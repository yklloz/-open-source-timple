from fastapi import FastAPI, Depends, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from typing import Optional
import base64
import json
import models, schemas, auth
from database import engine, get_db, Base
import os
from dotenv import load_dotenv
from urllib.parse import urlencode

load_dotenv(override=True)

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
KAKAO_WEB_REDIRECT_URI = os.getenv("KAKAO_WEB_REDIRECT_URI") or KAKAO_REDIRECT_URI
KAKAO_NATIVE_REDIRECT_URI = os.getenv("KAKAO_NATIVE_REDIRECT_URI") or KAKAO_REDIRECT_URI
KAKAO_DEFAULT_RETURN_URI = os.getenv("KAKAO_DEFAULT_RETURN_URI") or "http://localhost:8081"
KAKAO_CLIENT_SECRET_REQUIRED = os.getenv("KAKAO_CLIENT_SECRET_REQUIRED", "true").lower() != "false"


def encode_state(return_uri: str, kakao_redirect_uri: str) -> str:
    raw = json.dumps({
        "return_uri": return_uri,
        "kakao_redirect_uri": kakao_redirect_uri,
    }, separators=(",", ":")).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def decode_state(state: Optional[str]) -> tuple[str, str]:
    if not state:
        return KAKAO_DEFAULT_RETURN_URI, KAKAO_WEB_REDIRECT_URI or ""

    try:
        padded = state + "=" * (-len(state) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
        return (
            payload.get("return_uri") or KAKAO_DEFAULT_RETURN_URI,
            payload.get("kakao_redirect_uri") or KAKAO_WEB_REDIRECT_URI or "",
        )
    except Exception:
        return KAKAO_DEFAULT_RETURN_URI, KAKAO_WEB_REDIRECT_URI or ""


def redirect_with_params(return_uri: str, params: dict[str, str]) -> RedirectResponse:
    separator = "&" if "?" in return_uri else "?"
    return RedirectResponse(f"{return_uri}{separator}{urlencode(params)}")

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
def kakao_auth(return_uri: Optional[str] = None):
    selected_return_uri = return_uri or KAKAO_DEFAULT_RETURN_URI
    selected_redirect_uri = (
        KAKAO_NATIVE_REDIRECT_URI
        if selected_return_uri.startswith("signbridge://")
        else KAKAO_WEB_REDIRECT_URI
    )

    if not KAKAO_REST_API_KEY or not selected_redirect_uri:
        raise HTTPException(status_code=500, detail="Kakao OAuth environment variables are not configured")

    kakao_url = "https://kauth.kakao.com/oauth/authorize?" + urlencode({
        "response_type": "code",
        "client_id": KAKAO_REST_API_KEY,
        "redirect_uri": selected_redirect_uri,
        "state": encode_state(selected_return_uri, selected_redirect_uri),
    })
    return RedirectResponse(kakao_url)


@app.get("/auth/kakao/config")
async def kakao_config():
    client_secret_configured = bool(os.getenv("KAKAO_CLIENT_SECRET"))
    credentials_valid = True
    credential_status = "client_secret_not_required"
    if KAKAO_CLIENT_SECRET_REQUIRED:
        credentials_valid, credential_status = await auth.validate_kakao_credentials()

    return {
        "ready": bool(
            KAKAO_REST_API_KEY
            and KAKAO_WEB_REDIRECT_URI
            and (client_secret_configured or not KAKAO_CLIENT_SECRET_REQUIRED)
            and credentials_valid
        ),
        "client_secret_required": KAKAO_CLIENT_SECRET_REQUIRED,
        "client_secret_configured": client_secret_configured,
        "credentials_valid": credentials_valid,
        "credential_status": credential_status,
        "web_redirect_uri": KAKAO_WEB_REDIRECT_URI,
        "native_redirect_uri": KAKAO_NATIVE_REDIRECT_URI,
    }

# ── 카카오 콜백 ───────────────────────────────────────
@app.get("/auth/kakao/callback")
async def kakao_callback(
    code: Optional[str] = None,
    error: Optional[str] = None,
    error_description: Optional[str] = None,
    state: Optional[str] = None,
    db: Session = Depends(get_db),
):
    return_uri, kakao_redirect_uri = decode_state(state)

    if error:
        return redirect_with_params(return_uri, {
            "error": error,
            "error_description": error_description or error,
        })

    if not code:
        return redirect_with_params(return_uri, {
            "error": "missing_code",
            "error_description": "Kakao authorization code was not returned.",
        })

    try:
        result = await auth.kakao_login(code, db, redirect_uri=kakao_redirect_uri)
    except HTTPException as exc:
        return redirect_with_params(return_uri, {
            "error": "kakao_login_failed",
            "error_description": str(exc.detail),
        })

    return redirect_with_params(return_uri, {
        "access_token": result.access_token,
        "token_type": result.token_type,
        "user_id": str(result.user_id),
        "name": result.name,
        "email": result.email,
    })

# ── 내 정보 조회 ──────────────────────────────────────
@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(authorization: Optional[str] = Header(None),
           db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token   = authorization.replace("Bearer ", "")
    user_id = auth.get_current_user_id(token)
    user    = db.query(models.User).filter(models.User.id == user_id).first()
    return user

# ── 진도 저장 ─────────────────────────────────────────
@app.post("/progress")
def save_progress(req: schemas.ProgressRequest,
                  authorization: Optional[str] = Header(None),
                  db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
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
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    token    = authorization.replace("Bearer ", "")
    user_id  = auth.get_current_user_id(token)
    progress = db.query(models.Progress).filter(
        models.Progress.user_id == user_id
    ).all()
    return {"completed": [p.lesson_id for p in progress]}
