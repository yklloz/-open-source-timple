from datetime import datetime, timedelta
import os

from fastapi import HTTPException
import httpx
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

import models
import schemas

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
EXPIRE_DAYS = 30

KAKAO_REST_API_KEY = os.getenv("KAKAO_REST_API_KEY")
KAKAO_REDIRECT_URI = os.getenv("KAKAO_REDIRECT_URI")
KAKAO_CLIENT_SECRET = os.getenv("KAKAO_CLIENT_SECRET")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_secret_key() -> str:
    secret_key = os.getenv("JWT_SECRET_KEY") or SECRET_KEY
    if not secret_key:
        raise HTTPException(status_code=500, detail="JWT_SECRET_KEY is not configured")
    return secret_key


async def validate_kakao_credentials() -> tuple[bool, str]:
    rest_api_key = os.getenv("KAKAO_REST_API_KEY") or KAKAO_REST_API_KEY
    client_secret = os.getenv("KAKAO_CLIENT_SECRET") or KAKAO_CLIENT_SECRET
    redirect_uri = os.getenv("KAKAO_WEB_REDIRECT_URI") or os.getenv("KAKAO_REDIRECT_URI") or KAKAO_REDIRECT_URI

    if not rest_api_key or not client_secret or not redirect_uri:
        return False, "missing_configuration"

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://kauth.kakao.com/oauth/token",
            headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
            data={
                "grant_type": "authorization_code",
                "client_id": rest_api_key,
                "client_secret": client_secret,
                "redirect_uri": redirect_uri,
                "code": "credential_validation_probe",
            },
        )

    body = response.json()
    error_code = body.get("error_code", "")
    if error_code == "KOE010":
        return False, "invalid_client_credentials"

    return True, error_code or "credentials_accepted"


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, get_secret_key(), algorithm=ALGORITHM)


def get_current_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, get_secret_key(), algorithms=[ALGORITHM])
        return int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid token")


def signup(db: Session, req: schemas.SignupRequest) -> schemas.TokenResponse:
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email is already registered")

    user = models.User(
        name=req.name,
        email=req.email,
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


def login(db: Session, req: schemas.LoginRequest) -> schemas.TokenResponse:
    user = db.query(models.User).filter(models.User.email == req.email).first()

    if not user or not user.hashed_password or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )


async def kakao_login(code: str, db: Session, redirect_uri: str | None = None) -> schemas.TokenResponse:
    rest_api_key = os.getenv("KAKAO_REST_API_KEY") or KAKAO_REST_API_KEY
    configured_redirect_uri = os.getenv("KAKAO_REDIRECT_URI") or KAKAO_REDIRECT_URI
    effective_redirect_uri = redirect_uri or configured_redirect_uri
    client_secret = os.getenv("KAKAO_CLIENT_SECRET", KAKAO_CLIENT_SECRET or "")
    if not rest_api_key or not effective_redirect_uri:
        raise HTTPException(status_code=500, detail="Kakao OAuth environment variables are not configured")

    token_payload = {
        "grant_type": "authorization_code",
        "client_id": rest_api_key,
        "redirect_uri": effective_redirect_uri,
        "code": code,
    }
    if client_secret:
        token_payload["client_secret"] = client_secret

    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://kauth.kakao.com/oauth/token",
            headers={"Content-Type": "application/x-www-form-urlencoded;charset=utf-8"},
            data=token_payload,
        )
        token_data = token_res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(
                status_code=400,
                detail=token_data.get("error_description") or token_data.get("error") or "Failed to issue Kakao token",
            )

        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        user_data = user_res.json()
        if not user_res.is_success:
            raise HTTPException(
                status_code=400,
                detail=user_data.get("msg") or "Failed to retrieve Kakao user information",
            )

    kakao_id = str(user_data["id"])
    kakao_account = user_data.get("kakao_account", {})
    kakao_profile = kakao_account.get("profile", {})
    kakao_email = kakao_account.get("email") or f"kakao_{kakao_id}@kakao.local"
    kakao_name = kakao_profile.get("nickname") or user_data.get("properties", {}).get("nickname") or "Kakao user"

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

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )
