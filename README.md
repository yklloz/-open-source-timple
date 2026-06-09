# 손통해요

수어 학습과 수어↔텍스트 양방향 소통을 위한 Expo/React Native Web 프로젝트입니다.

## Frontend 실행

```bash
npm install
npx expo start -c --web
```

## Backend 실행

```bash
cd backend
/opt/anaconda3/bin/python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## Vercel 환경변수

```text
EXPO_PUBLIC_API_URL=https://arnetta-faddish-luisa.ngrok-free.dev
```
