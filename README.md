# 손통해요

손통해요 is split into:

- `yk_frontend`: Expo Router frontend
- `yk_backend`: FastAPI backend

## Local setup

1. Copy each `.env.example` file to `.env`.
2. Fill in local environment values. Never commit `.env` files.
3. Install backend dependencies from `yk_backend/backend/requirements.txt`.
4. Install frontend dependencies with `npm install` in `yk_frontend`.

## Run

Backend:

```powershell
cd yk_backend
.\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8001
```

Frontend:

```powershell
cd yk_frontend
npx expo start --web --port 8081
```

Before uploading, run:

```powershell
.\scripts\check-upload-safety.ps1
```
