"""
予約スキーマ
"""
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
from ..models.reservation import ReservationStatus


class TimeSlot(BaseModel):
    """時間枠スキーマ"""
    slot: int = Field(..., description="枠番号（1始まり）")
    start_time: str = Field(..., description="開始時刻（HH:MM）")
    end_time: str = Field(..., description="終了時刻（HH:MM）")
    duration: int = Field(..., description="施術時間（分）")
    is_filled: bool = Field(default=False, description="予約済みかどうか")


class ReservationBase(BaseModel):
    """予約基本スキーマ"""
    company_id: int
    office_name: str
    office_address: Optional[str] = None
    reservation_date: str  # YYYY/MM/DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    application_deadline: Optional[str] = None  # 募集期限（YYYY/MM/DD HH:MM）
    max_participants: int = 1  # 募集人数
    staff_names: Optional[str] = None
    employee_names: Optional[str] = None
    
    # 時間枠管理フィールド
    total_duration: Optional[int] = None  # 全体時間（分）
    service_duration: Optional[int] = None  # 施術時間（分）
    break_duration: Optional[int] = 0  # 休憩時間（分）
    slot_count: Optional[int] = 1  # 予約枠数
    time_slots: Optional[List[Dict[str, Any]]] = None  # 各枠の情報
    slots_filled: Optional[int] = 0  # 予約済み枠数
    hourly_rate: Optional[int] = None  # 時給（円）
    
    status: ReservationStatus = ReservationStatus.RECRUITING
    notes: Optional[str] = None
    requirements: Optional[str] = None


class ReservationCreate(ReservationBase):
    """予約作成スキーマ"""
    pass


class ReservationUpdate(BaseModel):
    """予約更新スキーマ"""
    office_name: Optional[str] = None
    office_address: Optional[str] = None
    reservation_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    application_deadline: Optional[str] = None  # 募集期限
    max_participants: Optional[int] = None
    staff_names: Optional[str] = None
    employee_names: Optional[str] = None
    
    # 時間枠管理フィールド
    total_duration: Optional[int] = None
    service_duration: Optional[int] = None
    break_duration: Optional[int] = None
    slot_count: Optional[int] = None
    time_slots: Optional[List[Dict[str, Any]]] = None
    slots_filled: Optional[int] = None
    hourly_rate: Optional[int] = None
    
    status: Optional[ReservationStatus] = None
    notes: Optional[str] = None
    requirements: Optional[str] = None


class Reservation(ReservationBase):
    """予約レスポンススキーマ"""
    id: int
    created_at: datetime
    updated_at: datetime
    
    @field_validator('time_slots', mode='before')
    @classmethod
    def parse_time_slots(cls, v):
        """time_slotsが文字列の場合、JSONパースする"""
        if isinstance(v, str):
            try:
                return json.loads(v)
            except json.JSONDecodeError:
                return None
        return v
    
    class Config:
        from_attributes = True


class EmployeeRegistration(BaseModel):
    """社員の予約登録スキーマ"""
    employee_name: str
    department: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    slot_number: Optional[int] = None  # 社員が選択した枠番号（1始まり）


class SlotEmployeeAssignment(BaseModel):
    """時間枠への社員割り当てスキーマ"""
    employee_id: int = Field(..., description="社員ID")
    slot_number: int = Field(..., description="枠番号（1始まり）")




