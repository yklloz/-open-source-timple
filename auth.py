from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from fastapi import HTTPException
import httpx
import models, schemas

SECRET_KEY  = "sonium-secret-key-change-in-production"
ALGORITHM   = "HS256"
EXPIRE_DAYS = 30

KAKAO_REST_API_KEY = "fc48db6324243498b0db8554df49fbbd"
KAKAO_REDIRECT_URI = "http://127.0.0.1:8000/auth/kakao/callback"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user_id(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="토큰이 유효하지 않아요")

def signup(db: Session, req: schemas.SignupRequest) -> schemas.TokenResponse:
    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일이에요")

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

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 틀렸어요")

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )

async def kakao_login(code: str, db: Session) -> schemas.TokenResponse:
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
        token_data   = token_res.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="카카오 토큰 발급 실패")

        user_res = await client.get(
            "https://kapi.kakao.com/v2/user/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        user_data = user_res.json()

    kakao_id    = str(user_data["id"])
    kakao_email = user_data.get("kakao_account", {}).get("email", f"{kakao_id}@kakao.com")
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

    return schemas.TokenResponse(
        access_token=create_token(user.id),
        user_id=user.id,
        name=user.name,
        email=user.email,
    )