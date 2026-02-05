"""
企業の社員スキーマ
"""
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class EmployeeBase(BaseModel):
    """社員基本スキーマ"""
    name: str
    department: str
    position: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    line_id: Optional[str] = None
    line_linked: bool = False
    is_active: bool = True
    notes: Optional[str] = None
    concerns: Optional[str] = None  # お悩みなど（企業側には見えない）
    medical_record: Optional[str] = None  # カルテ（企業側には見えない）


class EmployeeCreate(EmployeeBase):
    """社員作成スキーマ"""
    company_id: int


class EmployeeUpdate(BaseModel):
    """社員更新スキーマ"""
    name: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    line_id: Optional[str] = None
    line_linked: Optional[bool] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    concerns: Optional[str] = None  # お悩みなど（管理者のみ編集可能）
    medical_record: Optional[str] = None  # カルテ（管理者のみ編集可能）


class Employee(EmployeeBase):
    """社員レスポンススキーマ"""
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

