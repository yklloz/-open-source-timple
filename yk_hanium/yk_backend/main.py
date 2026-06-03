from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
from urllib.parse import urlencode
import httpx
import models, schemas, auth
from database import engine, get_db, Base
import os
from dotenv import load_dotenv

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="손이음 API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://127.0.0.1:8000/auth/kakao/callback")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/auth/google/callback")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://127.0.0.1:8081")

# ── 헬스체크 ──────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "손이음 API"}

@app.get("/api/health")
def ai_health():
    return {"status": "ok"}

@app.post("/api/reset")
def ai_reset():
    return {"status": "ok"}

# ── 회원가입 ──────────────────────────────────────────
@app.post("/auth/signup", response_model=schemas.TokenResponse)
def signup(req: schemas.SignupRequest, db: Session = Depends(get_db)):
    return auth.signup(db, req)

# ── 로그인 ────────────────────────────────────────────
@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    return auth.login(db, req)

# ── 카카오 로그인 시작 ────────────────────────────────
@app.get("/auth/kakao")
def kakao_auth():
    if not KAKAO_REST_API_KEY:
        raise HTTPException(status_code=500, detail="KAKAO_REST_API_KEY가 설정되지 않았어요")

    params = urlencode({
        "client_id": KAKAO_REST_API_KEY,
        "redirect_uri": KAKAO_REDIRECT_URI,
        "response_type": "code",
    })
    kakao_url = f"https://kauth.kakao.com/oauth/authorize?{params}"
    return RedirectResponse(kakao_url)

# ── 카카오 콜백 ───────────────────────────────────────
@app.get("/auth/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    result = await auth.kakao_login(code, db)
    query = urlencode({
        "token": result.access_token,
        "name": result.name,
        "email": result.email,
    })
    return RedirectResponse(f"{FRONTEND_URL.rstrip('/')}/kakao-callback?{query}")

@app.get("/auth/google")
def google_auth():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID가 설정되지 않았어요")

    params = urlencode({
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    })
    google_url = f"https://accounts.google.com/o/oauth2/v2/auth?{params}"
    return RedirectResponse(google_url)

@app.get("/auth/google/callback")
async def google_callback(code: str, db: Session = Depends(get_db)):
    result = await auth.google_login(code, db)
    query = urlencode({
        "token": result.access_token,
        "name": result.name,
        "email": result.email,
    })
    return RedirectResponse(f"{FRONTEND_URL.rstrip('/')}/google-callback?{query}")

# ── 내 정보 조회 ──────────────────────────────────────
@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(authorization: Optional[str] = Header(None),
           db: Session = Depends(get_db)):
    token   = auth.get_bearer_token(authorization)
    user_id = auth.get_current_user_id(token)
    user    = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없어요")
    return user

# ── 진도 저장 ─────────────────────────────────────────
@app.post("/progress")
def save_progress(req: schemas.ProgressRequest,
                  authorization: Optional[str] = Header(None),
                  db: Session = Depends(get_db)):
    token   = auth.get_bearer_token(authorization)
    user_id = auth.get_current_user_id(token)

    exists = db.query(models.Progress).filter(
        models.Progress.user_id   == user_id,
        models.Progress.lesson_id == req.lesson_id
    ).first()

    if not exists:
        progress = models.Progress(
            user_id=user_id, lesson_id=req.lesson_id, score=req.score
        )
        db.add(progress)
        user = db.query(models.User).filter(models.User.id == user_id).first()
        user.xp += req.score // 10
        db.commit()

    return {"status": "ok"}

# ── 내 진도 조회 ──────────────────────────────────────
@app.get("/progress/me")
def get_my_progress(authorization: Optional[str] = Header(None),
                    db: Session = Depends(get_db)):
    token    = auth.get_bearer_token(authorization)
    user_id  = auth.get_current_user_id(token)
    progress = db.query(models.Progress).filter(
        models.Progress.user_id == user_id
    ).all()
    return {"completed": [p.lesson_id for p in progress]}
