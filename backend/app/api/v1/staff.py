"""
スタッフ管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ...database import get_db
from ...models.staff import Staff as StaffModel
from ...models.reservation_staff import ReservationStaff, AssignmentStatus
from ...models.reservation import Reservation as ReservationModel
from ...models.user import User
from ...schemas.staff import Staff, StaffCreate, StaffUpdate
from ..deps import get_current_active_user, get_admin_user

router = APIRouter()


@router.get("/staff", response_model=List[Staff])
def get_staff_list(
    skip: int = 0,
    limit: int = 100,
    is_available: Optional[bool] = None,
    search: Optional[str] = Query(None, description="名前で検索"),
    db: Session = Depends(get_db)
):
    """
    スタッフ一覧を取得
    
    Args:
        skip: スキップする件数
        limit: 取得する最大件数
        is_available: 稼働可能フィルター
        search: 検索キーワード（名前）
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        List[Staff]: スタッフのリスト
    """
    query = db.query(StaffModel)
    
    # フィルター
    if is_available is not None:
        query = query.filter(StaffModel.is_available == is_available)
    
    if search:
        query = query.filter(StaffModel.name.contains(search))
    
    staff = query.offset(skip).limit(limit).all()
    return staff


@router.get("/staff/{staff_id}", response_model=Staff)
def get_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    スタッフ詳細を取得
    
    Args:
        staff_id: スタッフID
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        Staff: スタッフ情報
        
    Raises:
        HTTPException: スタッフが見つからない場合
    """
    staff = db.query(StaffModel).filter(StaffModel.id == staff_id).first()
    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff with id {staff_id} not found"
        )
    return staff


@router.post("/staff", response_model=Staff, status_code=status.HTTP_201_CREATED)
def create_staff(
    staff: StaffCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    スタッフを作成（管理者のみ）
    
    Args:
        staff: 作成するスタッフ情報
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        Staff: 作成されたスタッフ
        
    Raises:
        HTTPException: LINE IDが既に存在する場合
    """
    # LINE IDの重複チェック
    if staff.line_id:
        existing_staff = db.query(StaffModel).filter(
            StaffModel.line_id == staff.line_id
        ).first()
        if existing_staff:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="LINE ID already registered"
            )
    
    db_staff = StaffModel(**staff.model_dump())
    db.add(db_staff)
    db.commit()
    db.refresh(db_staff)
    return db_staff


@router.put("/staff/{staff_id}", response_model=Staff)
def update_staff(
    staff_id: int,
    staff: StaffUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    スタッフ情報を更新（管理者のみ）
    
    Args:
        staff_id: スタッフID
        staff: 更新するスタッフ情報
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        Staff: 更新されたスタッフ
        
    Raises:
        HTTPException: スタッフが見つからない場合
    """
    db_staff = db.query(StaffModel).filter(StaffModel.id == staff_id).first()
    if db_staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff with id {staff_id} not found"
        )
    
    # 更新
    update_data = staff.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_staff, key, value)
    
    db.commit()
    db.refresh(db_staff)
    return db_staff


@router.delete("/staff/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    スタッフを削除（管理者のみ）
    
    Args:
        staff_id: スタッフID
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Raises:
        HTTPException: スタッフが見つからない場合
    """
    db_staff = db.query(StaffModel).filter(StaffModel.id == staff_id).first()
    if db_staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff with id {staff_id} not found"
        )
    
    db.delete(db_staff)
    db.commit()
    return None


# 給与計算関連のスキーマ
class EarningsDetail(BaseModel):
    """給与明細アイテム"""
    reservation_id: int
    reservation_date: str
    office_name: str
    slot_number: Optional[int] = None
    duration: int  # 分
    hourly_rate: int
    earnings: int  # 円

    class Config:
        from_attributes = True


class StaffEarningsResponse(BaseModel):
    """スタッフ給与レスポンス"""
    staff_id: int
    staff_name: str
    total_earnings: int  # 総給与（円）
    total_duration: int  # 総時間（分）
    assignment_count: int  # 確定済みアサイン数
    details: List[EarningsDetail]  # 明細リスト


@router.get("/staff/{staff_id}/earnings", response_model=StaffEarningsResponse)
def get_staff_earnings(
    staff_id: int,
    month: Optional[int] = Query(None, description="月（1-12）"),
    year: Optional[int] = Query(None, description="年"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    スタッフの給与情報を取得
    
    Args:
        staff_id: スタッフID
        month: 月（省略時は全て）
        year: 年（省略時は現在年）
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        StaffEarningsResponse: スタッフの給与情報
    """
    # スタッフの存在確認
    staff = db.query(StaffModel).filter(StaffModel.id == staff_id).first()
    if staff is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Staff with id {staff_id} not found"
        )
    
    # 権限チェック（本人または管理者のみ）
    if current_user.role.upper() != 'ADMIN':
        # スタッフユーザーの場合、自分のIDのみアクセス可能
        staff_user = db.query(User).filter(User.id == staff.user_id).first()
        if staff_user and staff_user.id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="このスタッフの給与情報を閲覧する権限がありません"
            )
    
    # 確定済みアサインを取得
    assignments = db.query(ReservationStaff).filter(
        ReservationStaff.staff_id == staff_id,
        ReservationStaff.status == AssignmentStatus.CONFIRMED
    ).all()
    
    # 予約情報を取得
    reservation_ids = [a.reservation_id for a in assignments]
    reservations = db.query(ReservationModel).filter(
        ReservationModel.id.in_(reservation_ids)
    ).all()
    
    reservation_map = {r.id: r for r in reservations}
    
    # 給与計算
    total_earnings = 0
    total_duration = 0
    details = []
    assignment_count = 0  # 確定済みアサイン数をカウント（durationに関係なく）
    
    for assignment in assignments:
        reservation = reservation_map.get(assignment.reservation_id)
        if not reservation:
            continue
        
        # 月フィルター
        passed_month_filter = True
        if month is not None or year is not None:
            try:
                # 日付フォーマットを複数パターンで試行
                date_str = reservation.reservation_date
                if not date_str:
                    passed_month_filter = False
                else:
                    res_date = None
                    
                    # パターン1: YYYY/MM/DD
                    try:
                        res_date = datetime.strptime(str(date_str), "%Y/%m/%d")
                    except (ValueError, TypeError):
                        # パターン2: YYYY-MM-DD
                        try:
                            res_date = datetime.strptime(str(date_str), "%Y-%m-%d")
                        except (ValueError, TypeError):
                            # パターン3: その他の形式を試行
                            try:
                                res_date = datetime.strptime(str(date_str), "%Y/%m/%d %H:%M:%S")
                            except (ValueError, TypeError):
                                pass
                    
                    if res_date:
                        if year is not None and res_date.year != year:
                            passed_month_filter = False
                        if month is not None and res_date.month != month:
                            passed_month_filter = False
                    else:
                        # 日付パースに失敗した場合はフィルターを通過させない
                        passed_month_filter = False
            except Exception as e:
                # エラーが発生した場合はフィルターを通過させない
                passed_month_filter = False
        
        # 月フィルターを通過した確定済みアサインをカウント
        if passed_month_filter:
            assignment_count += 1
        
        # 月フィルターを通過していない場合はスキップ
        if not passed_month_filter:
            continue
        
        # 給与計算
        duration = 0
        slot_number = getattr(assignment, 'slot_number', None) if hasattr(assignment, 'slot_number') else None
        
        try:
            if slot_number and reservation.time_slots:
                # 特定の枠が指定されている場合
                time_slots = reservation.time_slots
                
                # JSON文字列の場合はパース
                if isinstance(time_slots, str):
                    import json
                    try:
                        time_slots = json.loads(time_slots)
                    except (json.JSONDecodeError, TypeError):
                        time_slots = None
                
                if isinstance(time_slots, list):
                    for slot in time_slots:
                        # slot が dict の場合とそうでない場合に対応
                        slot_num = slot.get('slot') if isinstance(slot, dict) else getattr(slot, 'slot', None)
                        if slot_num == slot_number:
                            duration = slot.get('duration', 0) if isinstance(slot, dict) else getattr(slot, 'duration', 0)
                            break
            elif reservation.service_duration:
                # 枠指定がない場合、service_durationを使用
                duration = reservation.service_duration
        except Exception as e:
            # エラーが発生した場合は duration を 0 のままにする
            duration = 0
        
        # 給与計算（hourly_rateがある場合のみ）
        hourly_rate = reservation.hourly_rate if reservation.hourly_rate else 0
        earnings = 0
        if duration > 0 and hourly_rate > 0:
            earnings = int((duration * hourly_rate) / 60)
            total_earnings += earnings
            total_duration += duration
        
        # 全ての確定済みアサインをdetailsに追加（hourly_rateやdurationがなくても）
        details.append(EarningsDetail(
            reservation_id=reservation.id,
            reservation_date=reservation.reservation_date,
            office_name=reservation.office_name,
            slot_number=slot_number,
            duration=duration,
            hourly_rate=hourly_rate,
            earnings=earnings
        ))
    
    return StaffEarningsResponse(
        staff_id=staff.id,
        staff_name=staff.name,
        total_earnings=total_earnings,
        total_duration=total_duration,
        assignment_count=assignment_count,  # durationに関係なく、月フィルターを通過した確定済みアサイン数
        details=details
    )

