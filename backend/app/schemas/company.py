"""
企業スキーマ
"""
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class CompanyBase(BaseModel):
    """企業基本スキーマ"""
    company_name: str = Field(..., alias="name")  # 企業名（必須）
    office_name: Optional[str] = None  # 支店・営業所名
    industry: Optional[str] = None  # 業種
    plan: Optional[str] = None  # プラン（6ヶ月、1年）
    contract_start_date: Optional[str] = ""  # 契約開始日（YYYY/MM/DD形式）
    contract_end_date: Optional[str] = None  # 契約終了日（YYYY/MM/DD形式）
    usage_count: int = 0  # 利用回数
    representative_name: Optional[str] = Field(None, alias="representative")  # 代表者名
    address: Optional[str] = None  # 住所
    phone: Optional[str] = None  # 電話番号
    email: Optional[EmailStr] = None  # メールアドレス
    contact_person: Optional[str] = None  # 担当者名
    contact_phone: Optional[str] = None  # 担当者電話
    contact_email: Optional[EmailStr] = None  # 担当者メール
    notes: Optional[str] = None  # 備考
    usage_status: Optional[str] = "active"  # 利用ステータス
    line_id: Optional[str] = None  # LINE ID


class CompanyCreate(CompanyBase):
    """企業作成スキーマ"""
    user_id: int


class CompanyUpdate(BaseModel):
    """企業更新スキーマ"""
    company_name: Optional[str] = Field(None, alias="name")  # 企業名
    office_name: Optional[str] = None  # 支店・営業所名
    industry: Optional[str] = None  # 業種
    plan: Optional[str] = None  # プラン（6ヶ月、1年）
    contract_start_date: Optional[str] = None  # 契約開始日
    contract_end_date: Optional[str] = None  # 契約終了日
    usage_count: Optional[int] = None  # 利用回数
    representative_name: Optional[str] = Field(None, alias="representative")  # 代表者名
    address: Optional[str] = None  # 住所
    phone: Optional[str] = None  # 電話番号
    email: Optional[EmailStr] = None  # メールアドレス
    contact_person: Optional[str] = None  # 担当者名
    contact_phone: Optional[str] = None  # 担当者電話
    contact_email: Optional[EmailStr] = None  # 担当者メール
    notes: Optional[str] = None  # 備考
    usage_status: Optional[str] = None  # 利用ステータス
    line_id: Optional[str] = None  # LINE ID


class Company(CompanyBase):
    """企業レスポンススキーマ"""
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        populate_by_name = True  # エイリアスとフィールド名の両方を許可

