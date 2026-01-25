"""
予約-スタッフ関連モデル（多対多）
"""
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database import Base
import enum


class AssignmentStatus(str, enum.Enum):
    """アサインステータス"""
    PENDING = "pending"          # 承認待ち
    CONFIRMED = "confirmed"      # 確定
    COMPLETED = "completed"      # 完了報告済み
    REJECTED = "rejected"        # 辞退
    CANCELLED = "cancelled"      # キャンセル


class ReservationStaff(Base):
    """予約-スタッフ関連テーブル（多対多）"""
    __tablename__ = "reservation_staff"
    
    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    slot_number = Column(Integer, nullable=True)  # 割り当てる枠の番号（1始まり）
    status = Column(SQLEnum(AssignmentStatus), default=AssignmentStatus.PENDING, nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"))  # アサインした管理者/企業ユーザー
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    notes = Column(String(500))  # 備考
    
    # リレーション
    reservation = relationship("Reservation", back_populates="staff_assignments")
    staff = relationship("Staff", back_populates="reservations")
    assigner = relationship("User")
    
    def __repr__(self):
        return f"<ReservationStaff(reservation_id={self.reservation_id}, staff_id={self.staff_id}, status={self.status})>"

