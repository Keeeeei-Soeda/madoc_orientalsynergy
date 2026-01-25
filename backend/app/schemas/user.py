"""
ユーザースキーマ
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from ..models.user import UserRole


class UserBase(BaseModel):
    """ユーザー基本スキーマ"""
    email: EmailStr
    name: str
    role: UserRole


class UserCreate(UserBase):
    """ユーザー作成スキーマ"""
    password: str


class UserUpdate(BaseModel):
    """ユーザー更新スキーマ"""
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    is_active: Optional[bool] = None


class User(UserBase):
    """ユーザーレスポンススキーマ"""
    id: int
    is_active: bool
    company_id: Optional[int] = None  # 企業ユーザーの場合のみ
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

