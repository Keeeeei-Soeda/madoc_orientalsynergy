"""
勤怠スキーマ
"""
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class AttendanceBase(BaseModel):
    """勤怠基本スキーマ"""
    staff_id: int
    reservation_id: Optional[int] = None
    work_date: str
    break_minutes: int = 0
    notes: Optional[str] = None


class AttendanceCreate(AttendanceBase):
    """勤怠作成スキーマ"""
    pass


class AttendanceUpdate(BaseModel):
    """勤怠更新スキーマ"""
    break_minutes: Optional[int] = None
    notes: Optional[str] = None
    is_approved: Optional[bool] = None


class ClockInRequest(BaseModel):
    """出勤打刻リクエスト"""
    staff_id: int
    reservation_id: Optional[int] = None
    work_date: str
    location: Optional[str] = None


class ClockOutRequest(BaseModel):
    """退勤打刻リクエスト"""
    attendance_id: int
    location: Optional[str] = None
    break_minutes: int = 0


class Attendance(AttendanceBase):
    """勤怠レスポンススキーマ"""
    id: int
    clock_in_time: Optional[datetime] = None
    clock_out_time: Optional[datetime] = None
    work_hours: Optional[int] = None
    location_in: Optional[str] = None
    location_out: Optional[str] = None
    is_approved: bool
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True








