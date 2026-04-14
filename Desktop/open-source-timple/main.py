import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision as mp_vision
import urllib.request
import os
 
# ── 모델 파일 자동 다운로드 ──────────────────────────────────────────
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
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
    "face_landmarker.task"
)
 
# ── 모델 초기화 ──────────────────────────────────────────────────────
hand_landmarker = mp_vision.HandLandmarker.create_from_options(
    mp_vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path="hand_landmarker.task"),
        num_hands=2,
        min_hand_detection_confidence=0.7,
        min_tracking_confidence=0.5,
        running_mode=mp_vision.RunningMode.IMAGE,
    )
)
 
face_landmarker = mp_vision.FaceLandmarker.create_from_options(
    mp_vision.FaceLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_path="face_landmarker.task"),
        min_face_detection_confidence=0.5,
        min_tracking_confidence=0.5,
        running_mode=mp_vision.RunningMode.IMAGE,
    )
)
 
# ── 손 연결선 정의 ───────────────────────────────────────────────────
HAND_CONNECTIONS = [
    (0,1),(1,2),(2,3),(3,4),          # 엄지
    (0,5),(5,6),(6,7),(7,8),          # 검지
    (0,9),(9,10),(10,11),(11,12),     # 중지
    (0,13),(13,14),(14,15),(15,16),   # 약지
    (0,17),(17,18),(18,19),(19,20),   # 소지
    (5,9),(9,13),(13,17),             # 손바닥
]
 
# ── 그리기 함수 ──────────────────────────────────────────────────────
def draw_hand(img, landmarks, h, w):
    pts = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    for start, end in HAND_CONNECTIONS:
        cv2.line(img, pts[start], pts[end], (255, 255, 255), 2)
    for pt in pts:
        cv2.circle(img, pt, 4, (0, 255, 0), -1)
 
def draw_face(img, landmarks, h, w):
    for lm in landmarks:
        cv2.circle(img, (int(lm.x * w), int(lm.y * h)), 1, (0, 200, 255), -1)
 
# ── 카메라 설정 (맥북 전용) ──────────────────────────────────────────
cap = cv2.VideoCapture(0)
 
print("작동 중입니다! 종료하려면 화면을 클릭하고 'q'를 누르세요.")
 
while cap.isOpened():
    success, img = cap.read()
    if not success:
        continue
 
    h, w = img.shape[:2]
 
    # 이미지 처리
    img = cv2.flip(img, 1)
    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=img_rgb)
 
    # 인식
    hand_result = hand_landmarker.detect(mp_image)
    face_result = face_landmarker.detect(mp_image)
 
    # 손 처리 및 엄지 척 판별
    if hand_result.hand_landmarks:
        for landmarks in hand_result.hand_landmarks:
            draw_hand(img, landmarks, h, w)
 
            thumb_tip  = landmarks[4].y   # 엄지 끝
            index_mcp  = landmarks[5].y   # 검지 시작 마디
            middle_mcp = landmarks[9].y   # 중지 시작 마디
 
            if thumb_tip < index_mcp - 0.1:
                cv2.putText(img, "Good Job!", (50, 150),
                            cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 255, 0), 3)
 
    # 얼굴 인식 그리기
    if face_result.face_landmarks:
        for landmarks in face_result.face_landmarks:
            draw_face(img, landmarks, h, w)
 
    # 화면 표시
    cv2.imshow("Sign-LLM Prototype", img)
 
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break
 
# 자원 해제
hand_landmarker.close()
face_landmarker.close()
cap.release()
cv2.destroyAllWindows()