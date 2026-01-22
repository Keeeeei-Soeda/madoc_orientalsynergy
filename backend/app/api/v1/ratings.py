"""
評価API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from ...database import get_db
from ...models.rating import Rating as RatingModel
from ...models.staff import Staff as StaffModel
from ...schemas.rating import Rating, RatingCreate, RatingUpdate, RatingSummary

router = APIRouter()


@router.get("/ratings", response_model=List[Rating])
def get_ratings(
    skip: int = 0,
    limit: int = 100,
    company_id: int = None,
    staff_id: int = None,
    db: Session = Depends(get_db)
):
    """評価一覧を取得"""
    query = db.query(RatingModel)
    
    if company_id:
        query = query.filter(RatingModel.company_id == company_id)
    if staff_id:
        query = query.filter(RatingModel.staff_id == staff_id)
    
    ratings = query.offset(skip).limit(limit).all()
    return ratings


@router.get("/ratings/{rating_id}", response_model=Rating)
def get_rating(rating_id: int, db: Session = Depends(get_db)):
    """指定された評価を取得"""
    rating = db.query(RatingModel).filter(RatingModel.id == rating_id).first()
    if not rating:
        raise HTTPException(status_code=404, detail="評価が見つかりません")
    return rating


@router.post("/ratings", response_model=Rating, status_code=status.HTTP_201_CREATED)
def create_rating(rating: RatingCreate, db: Session = Depends(get_db)):
    """評価を作成"""
    # スタッフの存在確認
    staff = db.query(StaffModel).filter(StaffModel.id == rating.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフが見つかりません")
    
    # 平均評価を計算
    average = (
        rating.cleanliness + 
        rating.responsiveness + 
        rating.satisfaction + 
        rating.punctuality + 
        rating.skill
    ) / 5.0
    
    # 新しい評価を作成
    rating_data = rating.model_dump()
    rating_data['average_rating'] = average
    rating_data['rating'] = average  # 互換性のため
    
    db_rating = RatingModel(**rating_data)
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)
    
    # スタッフの平均評価を更新
    avg_rating = db.query(
        func.avg(RatingModel.average_rating)
    ).filter(
        RatingModel.staff_id == rating.staff_id
    ).scalar()
    
    if avg_rating:
        staff.rating = round(avg_rating, 1)
        db.commit()
    
    return db_rating


@router.put("/ratings/{rating_id}", response_model=Rating)
def update_rating(
    rating_id: int,
    rating: RatingUpdate,
    db: Session = Depends(get_db)
):
    """評価を更新"""
    db_rating = db.query(RatingModel).filter(RatingModel.id == rating_id).first()
    if not db_rating:
        raise HTTPException(status_code=404, detail="評価が見つかりません")
    
    # 更新
    update_data = rating.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_rating, field, value)
    
    # 平均評価を再計算
    average = (
        db_rating.cleanliness + 
        db_rating.responsiveness + 
        db_rating.satisfaction + 
        db_rating.punctuality + 
        db_rating.skill
    ) / 5.0
    db_rating.average_rating = average
    db_rating.rating = average  # 互換性のため
    
    db.commit()
    db.refresh(db_rating)
    
    # スタッフの平均評価を更新
    avg_rating = db.query(
        func.avg(RatingModel.average_rating)
    ).filter(
        RatingModel.staff_id == db_rating.staff_id
    ).scalar()
    
    if avg_rating:
        staff = db.query(StaffModel).filter(StaffModel.id == db_rating.staff_id).first()
        if staff:
            staff.rating = round(avg_rating, 1)
            db.commit()
    
    return db_rating


@router.delete("/ratings/{rating_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rating(rating_id: int, db: Session = Depends(get_db)):
    """評価を削除"""
    db_rating = db.query(RatingModel).filter(RatingModel.id == rating_id).first()
    if not db_rating:
        raise HTTPException(status_code=404, detail="評価が見つかりません")
    
    staff_id = db_rating.staff_id
    
    db.delete(db_rating)
    db.commit()
    
    # スタッフの平均評価を更新
    avg_rating = db.query(
        func.avg(RatingModel.rating)
    ).filter(
        RatingModel.staff_id == staff_id
    ).scalar()
    
    staff = db.query(StaffModel).filter(StaffModel.id == staff_id).first()
    if staff:
        if avg_rating:
            staff.rating = round(avg_rating)
        else:
            staff.rating = None
        db.commit()
    
    return None


@router.get("/staff/{staff_id}/rating-summary", response_model=RatingSummary)
def get_staff_rating_summary(staff_id: int, db: Session = Depends(get_db)):
    """スタッフの評価サマリーを取得"""
    staff = db.query(StaffModel).filter(StaffModel.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフが見つかりません")
    
    # 平均評価
    avg_rating = db.query(
        func.avg(RatingModel.average_rating)
    ).filter(
        RatingModel.staff_id == staff_id
    ).scalar()
    
    # 評価数
    rating_count = db.query(
        func.count(RatingModel.id)
    ).filter(
        RatingModel.staff_id == staff_id
    ).scalar()
    
    # 項目別平均
    avg_cleanliness = db.query(
        func.avg(RatingModel.cleanliness)
    ).filter(RatingModel.staff_id == staff_id).scalar() or 0.0
    
    avg_responsiveness = db.query(
        func.avg(RatingModel.responsiveness)
    ).filter(RatingModel.staff_id == staff_id).scalar() or 0.0
    
    avg_satisfaction = db.query(
        func.avg(RatingModel.satisfaction)
    ).filter(RatingModel.staff_id == staff_id).scalar() or 0.0
    
    avg_punctuality = db.query(
        func.avg(RatingModel.punctuality)
    ).filter(RatingModel.staff_id == staff_id).scalar() or 0.0
    
    avg_skill = db.query(
        func.avg(RatingModel.skill)
    ).filter(RatingModel.staff_id == staff_id).scalar() or 0.0
    
    return RatingSummary(
        staff_id=staff_id,
        staff_name=staff.name,
        average_rating=float(avg_rating) if avg_rating else 0.0,
        rating_count=rating_count or 0,
        avg_cleanliness=float(avg_cleanliness),
        avg_responsiveness=float(avg_responsiveness),
        avg_satisfaction=float(avg_satisfaction),
        avg_punctuality=float(avg_punctuality),
        avg_skill=float(avg_skill)
    )

