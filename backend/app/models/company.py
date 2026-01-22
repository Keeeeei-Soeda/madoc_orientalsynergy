"""
企業モデル
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base


class Company(Base):
    """企業テーブル"""
    __tablename__ = "companies"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(255), nullable=False, index=True)  # 企業名
    office_name = Column(String(255))  # 支店・営業所名
    industry = Column(String(100))  # 業種
    plan = Column(String(50))  # プラン（6ヶ月、1年）
    contract_start_date = Column(String(50))  # 契約開始日（YYYY/MM/DD形式）
    contract_end_date = Column(String(50))  # 契約終了日（YYYY/MM/DD形式）
    usage_count = Column(Integer, default=0)  # 利用回数
    representative = Column(String(100))  # 代表者名（参考用）
    address = Column(Text)  # 住所（参考用）
    phone = Column(String(20))  # 電話番号（参考用）
    email = Column(String(255))  # メールアドレス（参考用）
    contact_person = Column(String(100))  # 担当者名
    contact_phone = Column(String(20))  # 担当者電話
    contact_email = Column(String(255))  # 担当者メール
    notes = Column(Text)  # 備考
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # リレーション
    user = relationship("User", backref="companies")
    ratings = relationship("Rating", back_populates="company")
    
    def __repr__(self):
        return f"<Company(id={self.id}, name={self.name})>"

