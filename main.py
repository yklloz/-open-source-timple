from fastapi import FastAPI, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
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
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")

# ── 헬스체크 ──────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "service": "손이음 API"}

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
    kakao_url = (
        f"https://kauth.kakao.com/oauth/authorize"
        f"?client_id={KAKAO_REST_API_KEY}"
        f"&redirect_uri={KAKAO_REDIRECT_URI}"
        f"&response_type=code"
    )
    return RedirectResponse(kakao_url)

# ── 카카오 콜백 ───────────────────────────────────────
@app.get("/auth/kakao/callback")
async def kakao_callback(code: str, db: Session = Depends(get_db)):
    result = await auth.kakao_login(code, db)
    return RedirectResponse(
        f"http://localhost:8081?kakao_token={result.access_token}&name={result.name}"
    )

# ── 내 정보 조회 ──────────────────────────────────────
@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(authorization: Optional[str] = Header(None),
           db: Session = Depends(get_db)):
    token   = authorization.replace("Bearer ", "")
    user_id = auth.get_current_user_id(token)
    user    = db.query(models.User).filter(models.User.id == user_id).first()
    return user

# ── 진도 저장 ─────────────────────────────────────────
@app.post("/progress")
def save_progress(req: schemas.ProgressRequest,
                  authorization: Optional[str] = Header(None),
                  db: Session = Depends(get_db)):
    token   = authorization.replace("Bearer ", "")
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
    token    = authorization.replace("Bearer ", "")
    user_id  = auth.get_current_user_id(token)
    progress = db.query(models.Progress).filter(
        models.Progress.user_id == user_id
    ).all()
    return {"completed": [p.lesson_id for p in progress]}