"""
評価スキーマ
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RatingBase(BaseModel):
    """評価ベーススキーマ"""
    reservation_id: int
    staff_id: int
    assignment_id: Optional[int] = None  # どのアサインに対する評価か
    
    # 評価項目（1-5）
    cleanliness: int = Field(..., ge=1, le=5, description="清潔感 (1-5)")
    responsiveness: int = Field(..., ge=1, le=5, description="対応力 (1-5)")
    satisfaction: int = Field(..., ge=1, le=5, description="満足度 (1-5)")
    punctuality: int = Field(..., ge=1, le=5, description="時間厳守 (1-5)")
    skill: int = Field(..., ge=1, le=5, description="技術力 (1-5)")
    
    comment: Optional[str] = None
    is_public: bool = True  # スタッフに公開するか


class RatingCreate(RatingBase):
    """評価作成スキーマ"""
    company_id: int


class RatingUpdate(BaseModel):
    """評価更新スキーマ"""
    cleanliness: Optional[int] = Field(None, ge=1, le=5)
    responsiveness: Optional[int] = Field(None, ge=1, le=5)
    satisfaction: Optional[int] = Field(None, ge=1, le=5)
    punctuality: Optional[int] = Field(None, ge=1, le=5)
    skill: Optional[int] = Field(None, ge=1, le=5)
    comment: Optional[str] = None
    is_public: Optional[bool] = None


class Rating(RatingBase):
    """評価レスポンススキーマ"""
    id: int
    company_id: int
    average_rating: float  # 5項目の平均
    rating: float  # 互換性のため残す
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RatingSummary(BaseModel):
    """スタッフの評価サマリースキーマ"""
    staff_id: int
    staff_name: str
    average_rating: float
    rating_count: int
    
    # 項目別平均
    avg_cleanliness: float
    avg_responsiveness: float
    avg_satisfaction: float
    avg_punctuality: float
    avg_skill: float

