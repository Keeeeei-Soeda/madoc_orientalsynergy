"""
勤怠モデル
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, Boolean, Enum as SQLEnum, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import enum


class AttendanceStatus(str, enum.Enum):
    """勤怠ステータス"""
    PENDING = "pending"  # 未出勤
    IN_PROGRESS = "in_progress"  # 勤務中
    COMPLETED = "completed"  # 完了
    CORRECTION_REQUESTED = "correction_requested"  # 修正申請中
    CORRECTED = "corrected"  # 修正済み


class Attendance(Base):
    """勤怠テーブル"""
    __tablename__ = "attendance"
    
    id = Column(Integer, primary_key=True, index=True)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=True)
    assignment_id = Column(Integer, ForeignKey("reservation_staff.id"), nullable=True)  # アサインID
    work_date = Column(String(50), nullable=False)  # 2025/10/30
    
    # 打刻情報
    clock_in_time = Column(DateTime(timezone=True))  # 出勤打刻
    clock_out_time = Column(DateTime(timezone=True))  # 退勤打刻
    break_minutes = Column(Integer, default=0)  # 休憩時間（分）
    work_hours = Column(Integer)  # 実働時間（分）
    location_in = Column(String(255))  # 出勤打刻位置（緯度経度）
    location_out = Column(String(255))  # 退勤打刻位置
    
    # 完了報告
    completion_report = Column(Text)  # 完了報告内容
    completion_photos = Column(JSON)  # 完了写真（URL配列）
    completed_at = Column(DateTime(timezone=True))  # 完了報告日時
    
    # 修正申請
    correction_requested = Column(Boolean, default=False)  # 修正申請フラグ
    correction_reason = Column(Text)  # 修正理由
    correction_requested_at = Column(DateTime(timezone=True))  # 申請日時
    correction_approved_by = Column(Integer, ForeignKey("users.id"))  # 修正承認者
    correction_approved_at = Column(DateTime(timezone=True))  # 修正承認日時
    
    # ステータス
    status = Column(SQLEnum(AttendanceStatus), default=AttendanceStatus.PENDING, nullable=False)
    
    # フラグ
    is_late = Column(Boolean, default=False)  # 遅刻フラグ
    is_early_leave = Column(Boolean, default=False)  # 早退フラグ
    is_approved = Column(Boolean, default=False)  # 承認済みフラグ
    
    # 承認情報
    notes = Column(Text)  # 備考
    approved_by = Column(Integer, ForeignKey("users.id"))  # 承認者ID
    approved_at = Column(DateTime(timezone=True))  # 承認日時
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーション
    staff = relationship("Staff", backref="attendances")
    reservation = relationship("Reservation", backref="attendances")
    
    def __repr__(self):
        return f"<Attendance(id={self.id}, staff_id={self.staff_id}, date={self.work_date}, status={self.status})>"





