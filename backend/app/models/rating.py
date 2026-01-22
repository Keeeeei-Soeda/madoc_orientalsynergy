from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class Rating(Base):
    """評価モデル"""
    __tablename__ = "ratings"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    staff_id = Column(Integer, ForeignKey("staff.id"), nullable=False)
    assignment_id = Column(Integer, ForeignKey("reservation_staff.id"), nullable=True)  # どのアサインに対する評価か
    
    # 評価項目（1-5）
    cleanliness = Column(Integer, nullable=False)  # 清潔感
    responsiveness = Column(Integer, nullable=False)  # 対応力
    satisfaction = Column(Integer, nullable=False)  # 満足度
    punctuality = Column(Integer, nullable=False)  # 時間厳守
    skill = Column(Integer, nullable=False)  # 技術力
    
    # 平均評価（自動計算）
    average_rating = Column(Float, nullable=False)  # 5項目の平均
    rating = Column(Float, nullable=False)  # 互換性のため残す（average_ratingと同じ）
    
    # コメント
    comment = Column(Text)
    
    # メタデータ
    is_public = Column(Boolean, default=True)  # スタッフに公開するか
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # リレーションシップ
    reservation = relationship("Reservation", back_populates="ratings")
    company = relationship("Company", back_populates="ratings")
    staff = relationship("Staff", back_populates="ratings")

