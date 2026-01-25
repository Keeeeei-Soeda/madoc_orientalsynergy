"""
スタッフスキーマ
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StaffBase(BaseModel):
    """スタッフ基本スキーマ"""
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    bank_account: Optional[str] = None
    qualifications: Optional[str] = None
    available_days: Optional[str] = None
    line_id: Optional[str] = None
    is_available: bool = True
    rating: Optional[float] = None  # float型に修正（平均評価は小数点を含む）
    notes: Optional[str] = None


class StaffCreate(StaffBase):
    """スタッフ作成スキーマ"""
    user_id: int


class StaffUpdate(BaseModel):
    """スタッフ更新スキーマ"""
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    bank_account: Optional[str] = None
    qualifications: Optional[str] = None
    available_days: Optional[str] = None
    line_id: Optional[str] = None
    is_available: Optional[bool] = None
    rating: Optional[int] = None
    notes: Optional[str] = None


class Staff(StaffBase):
    """スタッフレスポンススキーマ"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

