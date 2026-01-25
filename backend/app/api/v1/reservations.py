"""
予約管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import flag_modified
from typing import List, Optional
import json
from ...database import get_db
from ...models.reservation import Reservation as ReservationModel, ReservationStatus
from ...models.employee import Employee as EmployeeModel
from ...models.company import Company as CompanyModel
from ...models.reservation_staff import ReservationStaff as ReservationStaffModel
from ...models.user import User
from ...schemas.reservation import Reservation, ReservationCreate, ReservationUpdate, EmployeeRegistration, SlotEmployeeAssignment
from ..deps import get_current_active_user, get_company_user
from ...utils.time_slot_calculator import calculate_time_slots, calculate_total_minutes

router = APIRouter()


@router.get("/reservations", response_model=List[Reservation])
def get_reservations(
    skip: int = 0,
    limit: int = 100,
    status: Optional[ReservationStatus] = None,
    company_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    予約一覧を取得
    
    Args:
        skip: スキップする件数
        limit: 取得する最大件数
        status: ステータスフィルター
        company_id: 企業IDフィルター
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        List[Reservation]: 予約のリスト
    """
    query = db.query(ReservationModel)
    
    # フィルター
    if status:
        query = query.filter(ReservationModel.status == status)
    
    if company_id:
        query = query.filter(ReservationModel.company_id == company_id)
    
    reservations = query.offset(skip).limit(limit).all()
    return reservations


@router.get("/reservations/{reservation_id}", response_model=Reservation)
def get_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    予約詳細を取得
    
    Args:
        reservation_id: 予約ID
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        Reservation: 予約情報
        
    Raises:
        HTTPException: 予約が見つからない場合
    """
    reservation = db.query(ReservationModel).filter(
        ReservationModel.id == reservation_id
    ).first()
    
    if reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with id {reservation_id} not found"
        )
    return reservation


@router.post("/reservations", response_model=Reservation, status_code=status.HTTP_201_CREATED)
def create_reservation(
    reservation: ReservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_company_user)
):
    """
    予約を作成（企業または管理者のみ）
    
    Args:
        reservation: 作成する予約情報
        db: データベースセッション
        current_user: 現在のユーザー（企業または管理者権限必須）
        
    Returns:
        Reservation: 作成された予約
        
    Raises:
        HTTPException: 時間枠の計算エラー
    """
    # 時間枠情報が提供されている場合、自動計算を実行
    if reservation.service_duration is not None and reservation.service_duration > 0:
        # 全体時間を計算
        if reservation.total_duration is None:
            total_duration = calculate_total_minutes(
                reservation.start_time,
                reservation.end_time
            )
        else:
            total_duration = reservation.total_duration
        
        # 休憩時間のデフォルト値
        break_duration = reservation.break_duration if reservation.break_duration is not None else 0
        
        # 時間枠を計算（募集人数を考慮）
        slot_result = calculate_time_slots(
            reservation.start_time,
            reservation.end_time,
            reservation.service_duration,
            break_duration,
            reservation.max_participants
        )
        
        # 計算エラーチェック
        if not slot_result['valid']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"時間枠の計算エラー: {slot_result['error']}"
            )
        
        # 計算結果をモデルに反映
        reservation_data = reservation.model_dump()
        reservation_data['total_duration'] = total_duration
        reservation_data['slot_count'] = slot_result['slot_count']
        reservation_data['time_slots'] = slot_result['slots']
        reservation_data['slots_filled'] = 0  # 初期値
        
        db_reservation = ReservationModel(**reservation_data)
    else:
        # 時間枠情報がない場合は、従来通りの作成
        db_reservation = ReservationModel(**reservation.model_dump())
    
    db.add(db_reservation)
    db.commit()
    db.refresh(db_reservation)
    return db_reservation


@router.put("/reservations/{reservation_id}", response_model=Reservation)
def update_reservation(
    reservation_id: int,
    reservation: ReservationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_company_user)
):
    """
    予約情報を更新（企業または管理者のみ）
    
    Args:
        reservation_id: 予約ID
        reservation: 更新する予約情報
        db: データベースセッション
        current_user: 現在のユーザー（企業または管理者権限必須）
        
    Returns:
        Reservation: 更新された予約
        
    Raises:
        HTTPException: 予約が見つからない場合
    """
    db_reservation = db.query(ReservationModel).filter(
        ReservationModel.id == reservation_id
    ).first()
    
    if db_reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with id {reservation_id} not found"
        )
    
    # 更新データを取得
    update_data = reservation.model_dump(exclude_unset=True)
    
    # 時間枠の再計算が必要かチェック
    needs_recalculation = (
        'service_duration' in update_data or
        'break_duration' in update_data or
        'start_time' in update_data or
        'end_time' in update_data
    )
    
    if needs_recalculation and 'service_duration' in update_data and update_data['service_duration'] > 0:
        # 開始・終了時刻を取得（更新値または既存値）
        start_time = update_data.get('start_time', db_reservation.start_time)
        end_time = update_data.get('end_time', db_reservation.end_time)
        service_duration = update_data['service_duration']
        break_duration = update_data.get('break_duration', db_reservation.break_duration or 0)
        
        # 全体時間を計算
        total_duration = calculate_total_minutes(start_time, end_time)
        
        # 時間枠を計算（募集人数を考慮）
        max_participants_value = update_data.get('max_participants', db_reservation.max_participants)
        slot_result = calculate_time_slots(
            start_time,
            end_time,
            service_duration,
            break_duration,
            max_participants_value
        )
        
        # 計算エラーチェック
        if not slot_result['valid']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"時間枠の計算エラー: {slot_result['error']}"
            )
        
        # 計算結果を更新データに追加
        update_data['total_duration'] = total_duration
        update_data['slot_count'] = slot_result['slot_count']
        update_data['time_slots'] = slot_result['slots']
        # slots_filledは既存の値を保持（更新されていなければ）
        if 'slots_filled' not in update_data:
            update_data['slots_filled'] = db_reservation.slots_filled
    
    # 更新
    for key, value in update_data.items():
        setattr(db_reservation, key, value)
    
    db.commit()
    db.refresh(db_reservation)
    return db_reservation


@router.delete("/reservations/{reservation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reservation(
    reservation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_company_user)
):
    """
    予約を削除（企業または管理者のみ）
    
    Args:
        reservation_id: 予約ID
        db: データベースセッション
        current_user: 現在のユーザー（企業または管理者権限必須）
        
    Raises:
        HTTPException: 予約が見つからない場合
    """
    db_reservation = db.query(ReservationModel).filter(
        ReservationModel.id == reservation_id
    ).first()
    
    if db_reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reservation with id {reservation_id} not found"
        )
    
    db.delete(db_reservation)
    db.commit()
    return None


@router.post("/reservations/{reservation_id}/employees", response_model=Reservation)
def add_employee_to_reservation(
    reservation_id: int,
    employee_data: EmployeeRegistration,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    予約に社員を追加（企業の社員が予約に参加登録）
    
    Args:
        reservation_id: 予約ID
        employee_data: 社員登録情報（枠番号含む）
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        Reservation: 更新された予約
        
    Raises:
        HTTPException: 予約が見つからない、満席、枠が無効、または既に登録済みの場合
    """
    try:
        # 予約を取得
        db_reservation = db.query(ReservationModel).filter(
            ReservationModel.id == reservation_id
        ).first()
        
        if db_reservation is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"予約ID {reservation_id} が見つかりません"
            )
        
        # 既に登録済みかチェック
        existing_employees = db_reservation.employee_names or ""
        if employee_data.employee_name in existing_employees:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"社員 '{employee_data.employee_name}' は既にこの予約に登録されています"
            )
        
        # 枠番号が指定されていない場合はエラー
        if not employee_data.slot_number:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="枠番号を指定してください"
            )
        
        # 現在の登録人数をカウント
        current_count = len(existing_employees.split(',')) if existing_employees else 0
        
        # 満席チェック
        if current_count >= db_reservation.max_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="この予約は既に満席です"
            )
        
        # time_slotsへの指定枠割り当て
        if db_reservation.time_slots:
            # time_slotsをパース（JSON/文字列対応）
            if isinstance(db_reservation.time_slots, str):
                try:
                    slots = json.loads(db_reservation.time_slots)
                except json.JSONDecodeError:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="時間枠データの形式が不正です"
                    )
            elif isinstance(db_reservation.time_slots, list):
                slots = list(db_reservation.time_slots)
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="時間枠データの型が不正です"
                )
            
            slot_index = employee_data.slot_number - 1
            
            # 枠が存在するかチェック
            if slot_index < 0 or slot_index >= len(slots):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"無効な枠番号です。有効範囲: 1-{len(slots)}"
                )
            
            # 既に埋まっているかチェック
            if slots[slot_index].get('is_filled', False):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"枠{employee_data.slot_number}は既に予約されています"
                )
            
            # 指定された枠に割り当て
            slots[slot_index]['employee_name'] = employee_data.employee_name
            slots[slot_index]['employee_department'] = employee_data.department
            if employee_data.position:
                slots[slot_index]['employee_position'] = employee_data.position
            slots[slot_index]['is_filled'] = True
            
            # 更新
            db_reservation.time_slots = slots
            flag_modified(db_reservation, 'time_slots')
            
            print(f"✅ 社員を枠{employee_data.slot_number}に割り当て: {employee_data.employee_name}")
        
        # 社員名を追加（カンマ区切り）
        if existing_employees:
            db_reservation.employee_names = f"{existing_employees}, {employee_data.employee_name}"
        else:
            db_reservation.employee_names = employee_data.employee_name
        
        # slots_filledを更新
        db_reservation.slots_filled = current_count + 1
        
        # 備考に社員情報を追記（オプション）
        employee_info = f"\n[社員登録] {employee_data.employee_name} ({employee_data.department}"
        if employee_data.position:
            employee_info += f" - {employee_data.position}"
        employee_info += ")"
        if employee_data.notes:
            employee_info += f" - {employee_data.notes}"
        
        if db_reservation.notes:
            db_reservation.notes = f"{db_reservation.notes}{employee_info}"
        else:
            db_reservation.notes = employee_info.strip()
        
        print(f"🔄 社員登録完了: {employee_data.employee_name}, slots_filled={db_reservation.slots_filled}")
        
        db.commit()
        db.refresh(db_reservation)
        
        return db_reservation
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        print(f"❌ 社員登録エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"社員の登録に失敗しました: {str(e)}"
        )


@router.post("/reservations/{reservation_id}/assign-employee", response_model=Reservation)
def assign_employee_to_slot(
    reservation_id: int,
    assignment: SlotEmployeeAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_company_user)
):
    """
    予約の特定の時間枠に社員を割り当て（企業のみ）
    
    Args:
        reservation_id: 予約ID
        assignment: 社員割り当て情報（employee_id, slot_number）
        db: データベースセッション
        current_user: 現在のユーザー（企業権限必須）
        
    Returns:
        Reservation: 更新された予約
        
    Raises:
        HTTPException: 予約が見つからない、社員が見つからない、枠番号が無効な場合
    """
    # 予約を取得
    db_reservation = db.query(ReservationModel).filter(
        ReservationModel.id == reservation_id
    ).first()
    
    if db_reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"予約ID {reservation_id} が見つかりません"
        )
    
    # 企業の予約かチェック（企業ユーザーは自分の企業の予約のみ操作可能）
    if current_user.role.upper() == 'COMPANY':
        company = db.query(CompanyModel).filter(CompanyModel.user_id == current_user.id).first()
        if not company or db_reservation.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="この予約を操作する権限がありません"
            )
    
    # 社員を取得
    employee = db.query(EmployeeModel).filter(
        EmployeeModel.id == assignment.employee_id
    ).first()
    
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"社員ID {assignment.employee_id} が見つかりません"
        )
    
    # 社員が同じ企業に所属しているかチェック
    if employee.company_id != db_reservation.company_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この社員はこの予約の企業に所属していません"
        )
    
    # time_slotsが存在するかチェック
    if not db_reservation.time_slots or len(db_reservation.time_slots) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この予約には時間枠が設定されていません"
        )
    
    # 枠番号の妥当性をチェック
    if assignment.slot_number < 1 or assignment.slot_number > len(db_reservation.time_slots):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"無効な枠番号です。有効範囲: 1-{len(db_reservation.time_slots)}"
        )
    
    # time_slotsを更新（枠番号は1始まりなのでインデックスは-1）
    try:
        # time_slotsが文字列の場合はJSONパース、リストの場合はそのまま使用
        if db_reservation.time_slots is None:
            slots = []
        elif isinstance(db_reservation.time_slots, str):
            # 文字列の場合はJSONパース
            try:
                slots = json.loads(db_reservation.time_slots)
            except json.JSONDecodeError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="時間枠データの形式が不正です"
                )
        elif isinstance(db_reservation.time_slots, list):
            # 既にリストの場合はそのまま使用（コピーを作成）
            slots = list(db_reservation.time_slots)
        else:
            # その他の型の場合はエラー
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"時間枠データの型が不正です: {type(db_reservation.time_slots)}"
            )
        
        slot_index = assignment.slot_number - 1
        
        # スロットが存在するかチェック
        if slot_index >= len(slots) or slot_index < 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"無効な枠番号です。有効範囲: 1-{len(slots)}"
            )
        
        # 既に割り当てられている場合は上書き
        slots[slot_index]['employee_id'] = assignment.employee_id
        slots[slot_index]['employee_name'] = employee.name
        slots[slot_index]['employee_department'] = employee.department
        slots[slot_index]['is_filled'] = True
        
        # SQLAlchemyにJSONフィールドの変更を通知
        db_reservation.time_slots = slots
        flag_modified(db_reservation, 'time_slots')
        
        # slots_filledを更新（is_filled=Trueの枠数をカウント）
        filled_count = sum(1 for slot in slots if slot.get('is_filled', False))
        db_reservation.slots_filled = filled_count
        
        print(f"🔄 従業員割り当て: 予約ID={db_reservation.id}, 枠{assignment.slot_number}, 割り当て済み={filled_count}/{len(slots)}")
        
        db.commit()
        db.refresh(db_reservation)
        
        print(f"✅ コミット後: slots_filled={db_reservation.slots_filled}")
        
        return db_reservation
    except Exception as e:
        db.rollback()
        print(f"❌ エラー: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"社員の割り当てに失敗しました: {str(e)}"
        )


@router.delete("/reservations/{reservation_id}/slots/{slot_number}/employee", response_model=Reservation)
def unassign_employee_from_slot(
    reservation_id: int,
    slot_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_company_user)
):
    """
    予約の特定の時間枠から社員の割り当てを解除（企業のみ）
    
    Args:
        reservation_id: 予約ID
        slot_number: 枠番号（1始まり）
        db: データベースセッション
        current_user: 現在のユーザー（企業権限必須）
        
    Returns:
        Reservation: 更新された予約
        
    Raises:
        HTTPException: 予約が見つからない、枠番号が無効な場合
    """
    # 予約を取得
    db_reservation = db.query(ReservationModel).filter(
        ReservationModel.id == reservation_id
    ).first()
    
    if db_reservation is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"予約ID {reservation_id} が見つかりません"
        )
    
    # 企業の予約かチェック
    if current_user.role.upper() == 'COMPANY':
        company = db.query(CompanyModel).filter(CompanyModel.user_id == current_user.id).first()
        if not company or db_reservation.company_id != company.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="この予約を操作する権限がありません"
            )
    
    # time_slotsを取得（文字列の場合はJSONパース、リストの場合はそのまま使用）
    if db_reservation.time_slots is None:
        slots = []
    elif isinstance(db_reservation.time_slots, str):
        # 文字列の場合はJSONパース
        try:
            slots = json.loads(db_reservation.time_slots)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="時間枠データの形式が不正です"
            )
    elif isinstance(db_reservation.time_slots, list):
        # 既にリストの場合はそのまま使用（コピーを作成）
        slots = list(db_reservation.time_slots)
    else:
        # その他の型の場合はエラー
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"時間枠データの型が不正です: {type(db_reservation.time_slots)}"
        )
    
    # time_slotsが存在するかチェック
    if not slots or len(slots) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この予約には時間枠が設定されていません"
        )
    
    # 枠番号の妥当性をチェック
    if slot_number < 1 or slot_number > len(slots):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"無効な枠番号です。有効範囲: 1-{len(slots)}"
        )
    
    # time_slotsを更新
    slot_index = slot_number - 1
    
    # 社員情報を削除
    if 'employee_id' in slots[slot_index]:
        del slots[slot_index]['employee_id']
    if 'employee_name' in slots[slot_index]:
        del slots[slot_index]['employee_name']
    if 'employee_department' in slots[slot_index]:
        del slots[slot_index]['employee_department']
    slots[slot_index]['is_filled'] = False
    
    # SQLAlchemyにJSONフィールドの変更を通知
    db_reservation.time_slots = slots
    flag_modified(db_reservation, 'time_slots')
    
    # slots_filledを更新
    filled_count = sum(1 for slot in slots if slot.get('is_filled', False))
    db_reservation.slots_filled = filled_count
    
    print(f"🔄 従業員割り当て解除: 予約ID={db_reservation.id}, 枠{slot_number}, 割り当て済み={filled_count}/{len(slots)}")
    
    db.commit()
    db.refresh(db_reservation)
    
    print(f"✅ コミット後: slots_filled={db_reservation.slots_filled}")
    
    return db_reservation


