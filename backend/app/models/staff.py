"""
スタッフモデル
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Date
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Staff(Base):
    """スタッフテーブル"""
    __tablename__ = "staff"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False, index=True)
    phone = Column(String(20))
    address = Column(Text)
    bank_account = Column(String(255))
    qualifications = Column(Text)
    available_days = Column(String(100))
    line_id = Column(String(100), unique=True)
    is_available = Column(Boolean, default=True)
    rating = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーション
    user = relationship("User", backref="staff")
    ratings = relationship("Rating", back_populates="staff")
    reservations = relationship("ReservationStaff", back_populates="staff")
    
    def __repr__(self):
        return f"<Staff(id={self.id}, name={self.name})>"

