"""
予約モデル
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum, Text, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base
import enum


class ReservationStatus(str, enum.Enum):
    """予約ステータス（管理者側の詳細ステータス）"""
    RECRUITING = "recruiting"              # 募集中（最初のステータス）
    ASSIGNING = "assigning"                # スタッフアサイン中（応募受付後）
    CONFIRMED = "confirmed"                # 確定済み（全スタッフアサイン完了）
    SERVICE_COMPLETED = "service_completed"  # 施術完了（スタッフから報告）
    EVALUATED = "evaluated"                # 評価取得完了（企業から評価受取）
    CLOSED = "closed"                      # 終了（評価確認済み）
    CANCELLED = "cancelled"                # キャンセル


class Reservation(Base):
    """予約テーブル"""
    __tablename__ = "reservations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    office_name = Column(String(255), nullable=False)
    office_address = Column(Text)
    reservation_date = Column(String(50), nullable=False)  # 2025/10/30
    start_time = Column(String(10), nullable=False)  # 15:00
    end_time = Column(String(10), nullable=False)    # 17:00
    application_deadline = Column(String(50))  # 募集期限（YYYY/MM/DD HH:MM）
    max_participants = Column(Integer, default=1, nullable=False)  # 募集人数
    staff_names = Column(Text)  # カンマ区切り
    employee_names = Column(Text)  # カンマ区切り
    
    # 時間枠管理フィールド
    total_duration = Column(Integer)  # 全体時間（分）
    service_duration = Column(Integer)  # 施術時間（分）
    break_duration = Column(Integer, default=0)  # 休憩時間（分）
    slot_count = Column(Integer, default=1)  # 予約枠数
    time_slots = Column(JSON)  # 各枠の時間帯情報 [{"slot": 1, "start_time": "10:00", "end_time": "10:30", ...}]
    slots_filled = Column(Integer, default=0)  # 予約済み枠数
    hourly_rate = Column(Integer)  # 時給（円）
    
    status = Column(SQLEnum(ReservationStatus), default=ReservationStatus.RECRUITING, nullable=False)
    notes = Column(Text)
    requirements = Column(Text)  # 要望など
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーション
    company = relationship("Company", backref="reservations")
    ratings = relationship("Rating", back_populates="reservation")
    staff_assignments = relationship("ReservationStaff", back_populates="reservation")
    
    def __repr__(self):
        return f"<Reservation(id={self.id}, company_id={self.company_id}, date={self.reservation_date})>"




