from pydantic import BaseModel, EmailStr, Field
from typing import Optional

# 회원가입
class SignupRequest(BaseModel):
    name:     str = Field(min_length=1, max_length=80)
    email:    EmailStr
    password: str = Field(min_length=8, max_length=72)

# 로그인
class LoginRequest(BaseModel):
    email:    EmailStr
    password: str = Field(min_length=1, max_length=72)

# 토큰 응답
class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      int
    name:         str
    email:        str

# 유저 정보
class UserResponse(BaseModel):
    id:       int
    name:     str
    email:    str
    language: str
    xp:       int
    streak:   int

    class Config:
        from_attributes = True

# 진도 저장
class ProgressRequest(BaseModel):
    lesson_id: str
    score:     int
