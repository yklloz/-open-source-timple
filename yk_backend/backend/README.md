# 손통해요 Backend

Kakao REST API 로그인 콜백용 FastAPI 서버입니다.

## 실행

```bash
cd yk_backend/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Kakao Developers Redirect URI

로컬 테스트:

```text
http://127.0.0.1:8000/auth/kakao/callback
```

배포 후:

```text
https://YOUR_API_DOMAIN/auth/kakao/callback
```

## 프론트 `.env`

```env
EXPO_PUBLIC_KAKAO_REST_API_KEY=YOUR_REST_API_KEY
EXPO_PUBLIC_KAKAO_REDIRECT_URI=http://127.0.0.1:8000/auth/kakao/callback
```
