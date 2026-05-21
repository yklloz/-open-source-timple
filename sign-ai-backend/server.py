import base64
import csv
import json
from collections import deque
from pathlib import Path
from threading import Lock
from typing import Optional

import cv2
import mediapipe as mp
import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
from pydantic import BaseModel


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "6_AI수어 모델_260512"
FRAME_WINDOW = 30
MP_TO_OP = [
    0, 12, 14, 16, 11, 13, 15, 24, 26, 28,
    23, 25, 27, 12, 14, 16, 11, 13, 15, 24,
    26, 28, 23, 25, 27,
]


class SignModel(nn.Module):
    def __init__(self, num_classes: int):
        super().__init__()
        self.lstm1 = nn.LSTM(134, 256, batch_first=True, bidirectional=True)
        self.lstm2 = nn.LSTM(512, 256, batch_first=True, bidirectional=True)
        self.fc1 = nn.Linear(512, 256)
        self.fc2 = nn.Linear(256, num_classes)
        self.dropout = nn.Dropout(0.3)
        self.relu = nn.ReLU()
        self.bn = nn.BatchNorm1d(256)

    def forward(self, x):
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)
        x = x[:, -1, :]
        x = self.dropout(self.relu(self.bn(self.fc1(x))))
        return self.fc2(x)


class FrameRequest(BaseModel):
    image: str


class SignRecognizer:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.frame_buffer = deque(maxlen=FRAME_WINDOW)
        self.lock = Lock()
        self.label_map = self._load_label_map()

        self.label_classes = np.load(MODEL_DIR / "label_classes.npy", allow_pickle=True)
        self.scaler_mean = np.load(MODEL_DIR / "scaler_mean.npy")
        self.scaler_scale = np.load(MODEL_DIR / "scaler_scale.npy")

        self.model = SignModel(len(self.label_classes)).to(self.device)
        state_dict = torch.load(MODEL_DIR / "best_model.pt", map_location=self.device)
        self.model.load_state_dict(state_dict)
        self.model.eval()

        self.hand_landmarker = mp_vision.HandLandmarker.create_from_options(
            mp_vision.HandLandmarkerOptions(
                base_options=mp_python.BaseOptions(
                    model_asset_buffer=(BASE_DIR / "hand_landmarker.task").read_bytes()
                ),
                num_hands=2,
                min_hand_detection_confidence=0.7,
                min_tracking_confidence=0.5,
                running_mode=mp_vision.RunningMode.IMAGE,
            )
        )
        self.pose_landmarker = mp_vision.PoseLandmarker.create_from_options(
            mp_vision.PoseLandmarkerOptions(
                base_options=mp_python.BaseOptions(
                    model_asset_buffer=(BASE_DIR / "pose_landmarker.task").read_bytes()
                ),
                running_mode=mp_vision.RunningMode.IMAGE,
            )
        )

    def _load_label_map(self) -> dict[str, str]:
        json_path = BASE_DIR / "label_map.json"
        csv_path = BASE_DIR / "label_map.csv"

        if json_path.exists():
            with json_path.open("r", encoding="utf-8") as file:
                data = json.load(file)
            return {str(key): str(value) for key, value in data.items()}

        if csv_path.exists():
            mapping = {}
            with csv_path.open("r", encoding="utf-8-sig", newline="") as file:
                reader = csv.reader(file)
                for row in reader:
                    if len(row) >= 2 and row[0].strip():
                        mapping[row[0].strip()] = row[1].strip()
            return mapping

        return {}

    def health(self) -> dict:
        return {
            "ok": True,
            "device": str(self.device),
            "classes": int(len(self.label_classes)),
            "frameWindow": FRAME_WINDOW,
            "bufferedFrames": len(self.frame_buffer),
            "hasLabelMap": bool(self.label_map),
        }

    def reset(self) -> dict:
        with self.lock:
            self.frame_buffer.clear()
        return {"ok": True}

    def predict_frame(self, image_data: str) -> dict:
        frame = self._decode_image(image_data)
        if frame is None:
            raise HTTPException(status_code=400, detail="Invalid image payload")

        h, w = frame.shape[:2]
        frame = cv2.flip(frame, 1)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)

        with self.lock:
            hand_result = self.hand_landmarker.detect(mp_image)
            pose_result = self.pose_landmarker.detect(mp_image)
            keypoints = self._extract_frame_keypoints(hand_result, pose_result, h, w)
            landmarks = self._extract_ui_landmarks(hand_result, pose_result, h, w)
            self.frame_buffer.append(keypoints)
            buffered_frames = len(self.frame_buffer)

            if buffered_frames < FRAME_WINDOW:
                return {
                    "ready": False,
                    "label": None,
                    "text": None,
                    "confidence": 0.0,
                    "bufferedFrames": buffered_frames,
                    "frameWindow": FRAME_WINDOW,
                    "landmarks": landmarks,
                }

            label, confidence = self._predict()
            text = self.label_map.get(label, label)
            return {
                "ready": True,
                "label": label,
                "text": text,
                "confidence": confidence,
                "bufferedFrames": buffered_frames,
                "frameWindow": FRAME_WINDOW,
                "landmarks": landmarks,
            }

    def _decode_image(self, image_data: str) -> Optional[np.ndarray]:
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        try:
            raw = base64.b64decode(image_data)
        except ValueError:
            return None

        image_array = np.frombuffer(raw, dtype=np.uint8)
        return cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    def _extract_frame_keypoints(self, hand_result, pose_result, h: int, w: int) -> np.ndarray:
        pose_kp = np.zeros(50)
        if pose_result.pose_landmarks:
            landmarks = pose_result.pose_landmarks[0]
            for i, mp_idx in enumerate(MP_TO_OP):
                pose_kp[i * 2] = landmarks[mp_idx].x * w
                pose_kp[i * 2 + 1] = landmarks[mp_idx].y * h

        left_kp = np.zeros(42)
        right_kp = np.zeros(42)
        if hand_result.hand_landmarks:
            for i, landmarks in enumerate(hand_result.hand_landmarks):
                handedness = hand_result.handedness[i][0].category_name
                keypoints = np.array([[lm.x * w, lm.y * h] for lm in landmarks]).flatten()
                if handedness == "Left":
                    left_kp = keypoints
                else:
                    right_kp = keypoints

        return np.concatenate([pose_kp, left_kp, right_kp])

    def _extract_ui_landmarks(self, hand_result, pose_result, h: int, w: int) -> dict:
        pose_points = []
        if pose_result.pose_landmarks:
            for index, landmark in enumerate(pose_result.pose_landmarks[0]):
                if index in {11, 12, 13, 14, 15, 16, 23, 24}:
                    pose_points.append(
                        {
                            "index": index,
                            "x": float(landmark.x),
                            "y": float(landmark.y),
                            "z": float(landmark.z),
                            "visibility": float(getattr(landmark, "visibility", 1.0)),
                        }
                    )

        hands = []
        if hand_result.hand_landmarks:
            for i, landmarks in enumerate(hand_result.hand_landmarks):
                handedness = hand_result.handedness[i][0].category_name
                hands.append(
                    {
                        "handedness": handedness,
                        "points": [
                            {
                                "index": index,
                                "x": float(landmark.x),
                                "y": float(landmark.y),
                                "z": float(landmark.z),
                            }
                            for index, landmark in enumerate(landmarks)
                        ],
                    }
                )

        return {
            "imageWidth": int(w),
            "imageHeight": int(h),
            "pose": pose_points,
            "hands": hands,
        }

    def _predict(self) -> tuple[str, float]:
        x = np.array(self.frame_buffer)
        x = (x - self.scaler_mean) / self.scaler_scale
        x_tensor = torch.FloatTensor(x).unsqueeze(0).to(self.device)

        with torch.no_grad():
            output = self.model(x_tensor)
            probabilities = torch.softmax(output, dim=1)[0]
            pred_idx = int(probabilities.argmax().item())
            confidence = float(probabilities[pred_idx].item())

        return str(self.label_classes[pred_idx]), confidence


recognizer = SignRecognizer()
app = FastAPI(title="AI Sign Language Recognition API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return recognizer.health()


@app.post("/api/reset")
def reset():
    return recognizer.reset()


@app.post("/api/predict-frame")
def predict_frame(request: FrameRequest):
    return recognizer.predict_frame(request.image)
