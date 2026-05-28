from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id             = Column(Integer, primary_key=True, index=True)
    name           = Column(String, nullable=False)
    email          = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # 소셜 로그인은 None
    provider       = Column(String, default="email")  # email / google / kakao
    language       = Column(String, default="KSL")
    xp             = Column(Integer, default=0)
    streak         = Column(Integer, default=0)
    last_active    = Column(String, nullable=True)
    created_at     = Column(DateTime, server_default=func.now())

class Progress(Base):
    __tablename__ = "progress"

    id           = Column(Integer, primary_key=True, index=True)
    user_id      = Column(Integer, nullable=False)
    lesson_id    = Column(String, nullable=False)
    score        = Column(Integer, default=0)
    completed_at = Column(DateTime, server_default=func.now())