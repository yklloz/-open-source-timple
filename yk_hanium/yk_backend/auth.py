from datetime import datetime, timedelta
from typing import Optional
import os
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException
import httpx
from dotenv import load_dotenv
import models, schemas

load_dotenv()

SECRET_KEY  = "sonium-secret-key-change-in-production"
ALGORITHM   = "HS256"
EXPIRE_DAYS = 30

KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI", "http://127.0.0.1:8000/auth/kakao/callback")
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/auth/google/callback")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except ValueError:
        return False

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않아요")

def get_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="로그인이 필요해요")

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise HTTPException(status_code=401, detail="인증 형식이 올바르지 않아요")

    return token.strip()

def signup(db: Session, req: schemas.SignupRequest) -> schemas.TokenResponse:
    name = req.name.strip()
    email = str(req.email).strip().lower()
    password = req.password

    if not name:
        raise HTTPException(status_code=400, detail="이름을 입력해주세요")
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="비밀번호는 8자 이상이어야 해요")
    if len(password.encode("utf-8")) > 72:
        raise HTTPException(status_code=400, detail="비밀번호는 72바이트 이하여야 해요")

    if db.query(models.User).filter(models.User.email == email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일이에요")

    user = models.User(
        name=name,
        email=email,
        hashed_password=hash_password(req.password),
        provider="email",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )

async def google_login(code: str, db: Session) -> schemas.TokenResponse:
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GOOGLE_CLIENT_ID 또는 GOOGLE_CLIENT_SECRET이 설정되지 않았어요")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": GOOGLE_CLIENT_ID,
                "client_secret": GOOGLE_CLIENT_SECRET,
                "redirect_uri": GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )
        if token_res.status_code >= 400:
            raise HTTPException(status_code=400, detail="구글 토큰 요청에 실패했어요")

        token_data = token_res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="구글 토큰 발급에 실패했어요")

        user_res = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if user_res.status_code >= 400:
            raise HTTPException(status_code=400, detail="구글 사용자 정보를 가져오지 못했어요")

        user_data = user_res.json()

    google_id = str(user_data.get("id", ""))
    google_email = str(user_data.get("email") or f"{google_id}@google.local").strip().lower()
    google_name = str(user_data.get("name") or user_data.get("given_name") or "구글 사용자").strip()

    user = db.query(models.User).filter(models.User.email == google_email).first()
    if not user:
        user = models.User(
            name=google_name,
            email=google_email,
            provider="google",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.provider != "google":
        raise HTTPException(status_code=400, detail="이미 다른 로그인 방식으로 가입된 이메일이에요")

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )

def login(db: Session, req: schemas.LoginRequest) -> schemas.TokenResponse:
    email = str(req.email).strip().lower()
    password = req.password
    user = db.query(models.User).filter(models.User.email == email).first()

    if (
        not user
        or user.provider != "email"
        or not user.hashed_password
        or len(password.encode("utf-8")) > 72
        or not verify_password(password, user.hashed_password)
    ):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸어요")

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )

async def kakao_login(code: str, db: Session) -> schemas.TokenResponse:
    if not KAKAO_REST_API_KEY:
        raise HTTPException(status_code=500, detail="KAKAO_REST_API_KEY가 설정되지 않았어요")

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            data={
                "grant_type":   "authorization_code",
                "client_id":    KAKAO_REST_API_KEY,
                "redirect_uri": KAKAO_REDIRECT_URI,
                "code":         code,
            }
        )
        if token_res.status_code >= 400:
            raise HTTPException(status_code=400, detail="카카오 토큰 요청에 실패했어요")

        token_data   = token_res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="카카오 토큰 발급 실패")

        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        if user_res.status_code >= 400:
            raise HTTPException(status_code=400, detail="카카오 사용자 정보를 가져오지 못했어요")

        user_data = user_res.json()

    kakao_id    = str(user_data["id"])
    kakao_account = user_data.get("kakao_account", {})
    kakao_email = kakao_account.get("email", f"{kakao_id}@kakao.local")
    kakao_name  = user_data.get("properties", {}).get("nickname", "카카오 사용자")

    user = db.query(models.User).filter(models.User.email == kakao_email).first()
    if not user:
        user = models.User(
            name=kakao_name,
            email=kakao_email,
            provider="kakao",
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user.provider != "kakao":
        raise HTTPException(status_code=400, detail="이미 일반 계정으로 가입된 이메일이에요")

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )
