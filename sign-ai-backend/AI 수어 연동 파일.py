import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import urllib.request
import os
import numpy as np
import torch
import torch.nn as nn
from collections import deque

# ── 모델 구조 ────────────────────────────────────────────────────────
class SignModel(nn.Module):
    def __init__(self, num_classes):
        super().__init__()
        self.lstm1   = nn.LSTM(134, 256, batch_first=True, bidirectional=True)
        self.lstm2   = nn.LSTM(512, 256, batch_first=True, bidirectional=True)
        self.fc1     = nn.Linear(512, 256)
        self.fc2     = nn.Linear(256, num_classes)
        self.dropout = nn.Dropout(0.3)
        self.relu    = nn.ReLU()
        self.bn      = nn.BatchNorm1d(256)

    def forward(self, x):
        x, _ = self.lstm1(x)
        x, _ = self.lstm2(x)
        x = x[:, -1, :]
        x = self.dropout(self.relu(self.bn(self.fc1(x))))
        return self.fc2(x)

# ── AI 모델 로드 ─────────────────────────────────────────────────────
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
# label_classes  = np.load(r'D:\aihub_data\processed\label_classes.npy', allow_pickle=True)
# scaler_mean    = np.load(r'D:\aihub_data\processed\scaler_mean.npy')
# scaler_scale   = np.load(r'D:\aihub_data\processed\scaler_scale.npy')
label_classes  = np.load(r'D:\JNU-OpenSource\Hanium-OpenSoure-JNU-AI\AI 수어 파이썬 프로그램\6_AI수어 모델_260512\label_classes.npy', allow_pickle=True)
scaler_mean    = np.load(r'D:\JNU-OpenSource\Hanium-OpenSoure-JNU-AI\AI 수어 파이썬 프로그램\6_AI수어 모델_260512\scaler_mean.npy')
scaler_scale   = np.load(r'D:\JNU-OpenSource\Hanium-OpenSoure-JNU-AI\AI 수어 파이썬 프로그램\6_AI수어 모델_260512\scaler_scale.npy')

model = SignModel(len(label_classes)).to(device)
model.load_state_dict(torch.load(r'D:\JNU-OpenSource\Hanium-OpenSoure-JNU-AI\AI 수어 파이썬 프로그램\6_AI수어 모델_260512\best_model.pt', map_location=device))
model.eval()
print("AI 모델 로드 완료!", flush=True)

# MediaPipe Pose → OpenPose 25개 포인트 매핑
MP_TO_OP = [0, 12, 14, 16, 11, 13, 15, 24, 26, 28, 23, 25, 27, 12, 14, 16, 11, 13, 15, 24, 26, 28, 23, 25, 27]

def download_model(url, filename):
    if not os.path.exists(filename):
        print(f"모델 다운로드 중: {filename} ...")
        urllib.request.urlretrieve(url, filename)
        print(f"  완료: {filename}")

download_model(
    "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
    "hand_landmarker.task"
)
download_model(
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
    "pose_landmarker.task"
)

# ── MediaPipe 초기화 ─────────────────────────────────────────────────
hand_landmarker = mp_vision.HandLandmarker.create_from_options(
    mp_vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path="hand_landmarker.task"),
        num_hands=2,
        min_hand_detection_confidence=0.7,
        min_tracking_confidence=0.5,
        running_mode=mp_vision.RunningMode.IMAGE,
    )
)

pose_landmarker = mp_vision.PoseLandmarker.create_from_options(
    mp_vision.PoseLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path="pose_landmarker.task"),
        running_mode=mp_vision.RunningMode.IMAGE,
    )
)

# ── 좌표 추출 함수 ───────────────────────────────────────────────────
def extract_frame_keypoints(hand_result, pose_result, h, w):
    # Pose (25개)
    pose_kp = np.zeros(50)
    if pose_result.pose_landmarks:
        lms = pose_result.pose_landmarks[0]
        for i, mp_idx in enumerate(MP_TO_OP):
            pose_kp[i*2]   = lms[mp_idx].x * w
            pose_kp[i*2+1] = lms[mp_idx].y * h

    # 손 (왼손/오른손 각 21개)
    left_kp  = np.zeros(42)
    right_kp = np.zeros(42)

    if hand_result.hand_landmarks:
        for i, landmarks in enumerate(hand_result.hand_landmarks):
            handedness = hand_result.handedness[i][0].category_name
            kp = np.array([[lm.x * w, lm.y * h] for lm in landmarks]).flatten()
            if handedness == 'Left':
                left_kp = kp
            else:
                right_kp = kp

    return np.concatenate([pose_kp, left_kp, right_kp])  # (134,)

# ── 추론 함수 ────────────────────────────────────────────────────────
def predict(frame_buffer):
    X = np.array(frame_buffer)  # (30, 134)
    X = (X - scaler_mean) / scaler_scale
    X_tensor = torch.FloatTensor(X).unsqueeze(0).to(device)  # (1, 30, 134)

    with torch.no_grad():
        output = model(X_tensor)
        pred_idx = output.argmax(1).item()
        confidence = torch.softmax(output, dim=1)[0][pred_idx].item()

    return label_classes[pred_idx], confidence

# ── 카메라 설정 ──────────────────────────────────────────────────────
cap = cv2.VideoCapture(0)
frame_buffer = deque(maxlen=30)
current_prediction = ""
current_confidence = 0.0

print("작동 중입니다! 종료하려면 'q'를 누르세요.", flush=True)

while cap.isOpened():
    success, img = cap.read()
    if not success:
        continue

    h, w = img.shape[:2]
    img = cv2.flip(img, 1)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)

    # 인식
    hand_result = hand_landmarker.detect(mp_image)
    pose_result = pose_landmarker.detect(mp_image)

    # 좌표 추출 및 버퍼에 추가
    keypoints = extract_frame_keypoints(hand_result, pose_result, h, w)
    frame_buffer.append(keypoints)

    # 30프레임 모이면 예측
    if len(frame_buffer) == 30:
        current_prediction, current_confidence = predict(frame_buffer)

    # 손 그리기
    HAND_CONNECTIONS = [
        (0,1),(1,2),(2,3),(3,4),(0,5),(5,6),(6,7),(7,8),
        (0,9),(9,10),(10,11),(11,12),(0,13),(13,14),(14,15),(15,16),
        (0,17),(17,18),(18,19),(19,20),(5,9),(9,13),(13,17),
    ]
    if hand_result.hand_landmarks:
        for landmarks in hand_result.hand_landmarks:
            pts = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
            for start, end in HAND_CONNECTIONS:
                cv2.line(img, pts[start], pts[end], (255, 255, 255), 2)
            for pt in pts:
                cv2.circle(img, pt, 4, (0, 255, 0), -1)

    # 예측 결과 화면에 표시
    if current_prediction:
        cv2.putText(img, f"{current_prediction} ({current_confidence:.0%})",
                    (30, 60), cv2.FONT_HERSHEY_SIMPLEX, 1.5, (0, 255, 0), 3)

    # 프레임 버퍼 진행바
    bar_len = int((len(frame_buffer) / 30) * w)
    cv2.rectangle(img, (0, h-10), (bar_len, h), (0, 255, 0), -1)

    cv2.imshow("수어 번역기", img)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

hand_landmarker.close()
pose_landmarker.close()
cap.release()
cv2.destroyAllWindows()