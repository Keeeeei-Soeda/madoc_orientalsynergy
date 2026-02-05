"""
企業の社員モデル（マッサージを受ける側の人）
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Employee(Base):
    """企業の社員テーブル"""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False, index=True)
    department = Column(String(100))
    position = Column(String(100))
    email = Column(String(255))
    phone = Column(String(20))
    line_id = Column(String(100), unique=True, index=True)
    line_linked = Column(Boolean, default=False)  # LINE連携状態
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    concerns = Column(Text)  # お悩みなど（スタッフからの報告で更新）
    medical_record = Column(Text)  # カルテ（スタッフからの報告で更新、オリエンタルシナジー側で編集可能）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # リレーション
    company = relationship("Company", backref="employees")

    def __repr__(self):
        return f"<Employee(id={self.id}, name={self.name}, company_id={self.company_id})>"

