"""
アサイン管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ...database import get_db
from ...models.reservation_staff import ReservationStaff, AssignmentStatus
from ...models.reservation import Reservation as ReservationModel
from ...models.staff import Staff as StaffModel
from ...models.company import Company as CompanyModel
from ...models.user import User, UserRole
from ..deps import get_current_active_user
from pydantic import BaseModel

router = APIRouter()


# Pydanticスキーマ
class AssignmentCreate(BaseModel):
    reservation_id: int
    staff_id: int
    assigned_by: int
    slot_number: Optional[int] = None  # スタッフが選択した枠番号（1始まり）
    notes: Optional[str] = None


class AssignmentUpdate(BaseModel):
    status: Optional[AssignmentStatus] = None
    slot_number: Optional[int] = None  # 枠番号の変更も可能に
    notes: Optional[str] = None


class ReservationSummary(BaseModel):
    """予約情報のサマリー"""
    id: int
    company_name: Optional[str] = None
    office_name: Optional[str] = None
    office_address: Optional[str] = None
    reservation_date: Optional[str] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    service_duration: Optional[int] = None
    hourly_rate: Optional[float] = None
    time_slots: Optional[list] = None
    status: Optional[str] = None
    
    class Config:
        from_attributes = True

class AssignmentResponse(BaseModel):
    id: int
    reservation_id: int
    staff_id: int
    staff_name: str
    status: str
    assigned_by: int
    assigned_at: str
    slot_number: Optional[int] = None  # レスポンスにも含める
    notes: Optional[str] = None
    reservation: Optional[ReservationSummary] = None

    class Config:
        from_attributes = True


@router.get("/assignments/my", response_model=List[AssignmentResponse])
def get_my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """ログイン中のユーザーのアサインメントを取得"""
    # user_idからstaff_idを取得
    staff = db.query(StaffModel).filter(StaffModel.user_id == current_user.id).first()
    if not staff:
        return []
    
    # スタッフのアサインメントを取得
    assignments = db.query(ReservationStaff).filter(
        ReservationStaff.staff_id == staff.id
    ).all()
    
    result = []
    for assignment in assignments:
        reservation = db.query(ReservationModel).filter(ReservationModel.id == assignment.reservation_id).first()
        
        reservation_summary = None
        if reservation:
            company = db.query(CompanyModel).filter(CompanyModel.id == reservation.company_id).first()
            
            # time_slotsをパース
            time_slots_data = None
            if reservation.time_slots:
                if isinstance(reservation.time_slots, str):
                    import json
                    time_slots_data = json.loads(reservation.time_slots)
                else:
                    time_slots_data = reservation.time_slots
            
            reservation_summary = ReservationSummary(
                id=reservation.id,
                company_name=company.name if company else None,
                office_name=reservation.office_name,
                office_address=reservation.office_address,
                reservation_date=reservation.reservation_date,
                start_time=reservation.start_time,
                end_time=reservation.end_time,
                hourly_rate=reservation.hourly_rate,
                time_slots=time_slots_data
            )
        
        result.append(AssignmentResponse(
            id=assignment.id,
            reservation_id=assignment.reservation_id,
            staff_id=assignment.staff_id,
            staff_name=staff.name,
            slot_number=assignment.slot_number,
            status=assignment.status,
            assigned_by=assignment.assigned_by,
            assigned_at=assignment.assigned_at.isoformat() if assignment.assigned_at else None,
            notes=assignment.notes,
            reservation=reservation_summary
        ))
    
    return result


@router.get("/assignments/{assignment_id}", response_model=AssignmentResponse)
def get_assignment_by_id(
    assignment_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """アサインメントIDで単一のアサインメントを取得"""
    assignment = db.query(ReservationStaff).filter(
        ReservationStaff.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="アサインメントが見つかりません")
    
    # 予約情報を取得
    reservation = db.query(ReservationModel).filter(
        ReservationModel.id == assignment.reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(status_code=404, detail="予約が見つかりません")
    
    # 権限チェック: 企業ユーザーは自社の予約のみアクセス可能
    if current_user.role == UserRole.COMPANY:
        # user_idから企業を取得
        company = db.query(CompanyModel).filter(CompanyModel.user_id == current_user.id).first()
        if not company or company.id != reservation.company_id:
            raise HTTPException(
                status_code=403, 
                detail="この予約にアクセスする権限がありません"
            )
    # スタッフユーザーは自分のアサインメントのみアクセス可能
    elif current_user.role == UserRole.STAFF:
        staff = db.query(StaffModel).filter(StaffModel.user_id == current_user.id).first()
        if not staff or staff.id != assignment.staff_id:
            raise HTTPException(
                status_code=403, 
                detail="このアサインメントにアクセスする権限がありません"
            )
    
    # スタッフ情報を取得
    staff = db.query(StaffModel).filter(StaffModel.id == assignment.staff_id).first()
    staff_name = staff.name if staff else None
    
    # 予約サマリーを構築
    company = db.query(CompanyModel).filter(CompanyModel.id == reservation.company_id).first()
    
    # time_slotsをパース
    time_slots_data = None
    if reservation.time_slots:
        if isinstance(reservation.time_slots, str):
            import json
            time_slots_data = json.loads(reservation.time_slots)
        else:
            time_slots_data = reservation.time_slots
    
    reservation_summary = ReservationSummary(
        id=reservation.id,
        company_name=company.name if company else None,
        office_name=reservation.office_name,
        office_address=reservation.office_address,
        reservation_date=reservation.reservation_date,
        start_time=reservation.start_time,
        end_time=reservation.end_time,
        hourly_rate=reservation.hourly_rate,
        time_slots=time_slots_data
    )
    
    return AssignmentResponse(
        id=assignment.id,
        reservation_id=assignment.reservation_id,
        staff_id=assignment.staff_id,
        staff_name=staff_name,
        slot_number=assignment.slot_number,
        status=assignment.status,
        assigned_by=assignment.assigned_by,
        assigned_at=assignment.assigned_at.isoformat() if assignment.assigned_at else None,
        notes=assignment.notes,
        reservation=reservation_summary
    )

@router.get("/reservations/{reservation_id}/assignments", response_model=List[AssignmentResponse])
def get_reservation_assignments(reservation_id: int, db: Session = Depends(get_db)):
    """予約に割り当てられたスタッフを取得"""
    assignments = db.query(ReservationStaff).filter(
        ReservationStaff.reservation_id == reservation_id
    ).all()
    
    result = []
    for assignment in assignments:
        staff = db.query(StaffModel).filter(StaffModel.id == assignment.staff_id).first()
        result.append({
            "id": assignment.id,
            "reservation_id": assignment.reservation_id,
            "staff_id": assignment.staff_id,
            "staff_name": staff.name if staff else "不明",
            "status": assignment.status.value,
            "assigned_by": assignment.assigned_by,
            "assigned_at": assignment.assigned_at.isoformat() if assignment.assigned_at else None,
            "slot_number": assignment.slot_number,
            "notes": assignment.notes,
        })
    
    return result


@router.post("/reservations/{reservation_id}/assignments", status_code=status.HTTP_201_CREATED)
def assign_staff_to_reservation(
    reservation_id: int,
    assignment: AssignmentCreate,
    db: Session = Depends(get_db)
):
    """予約にスタッフをアサイン（枠指定可能）"""
    # 予約の存在確認
    reservation = db.query(ReservationModel).filter(ReservationModel.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="予約が見つかりません")
    
    # スタッフの存在確認
    staff = db.query(StaffModel).filter(StaffModel.id == assignment.staff_id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフが見つかりません")
    
    # 枠番号が指定されている場合のバリデーション
    if assignment.slot_number is not None:
        # time_slotsが存在するかチェック
        if not reservation.time_slots or len(reservation.time_slots) == 0:
            raise HTTPException(status_code=400, detail="この予約には時間枠が設定されていません")
        
        # 枠番号の妥当性をチェック
        if assignment.slot_number < 1 or assignment.slot_number > len(reservation.time_slots):
            raise HTTPException(
                status_code=400,
                detail=f"無効な枠番号です。有効範囲: 1-{len(reservation.time_slots)}"
            )
        
        # 同じ枠に既にスタッフ（自分または他のスタッフ）が割り当てられていないかチェック
        existing_slot_assignment = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_id,
            ReservationStaff.slot_number == assignment.slot_number,
            ReservationStaff.status != AssignmentStatus.REJECTED,
            ReservationStaff.status != AssignmentStatus.CANCELLED
        ).first()
        
        if existing_slot_assignment:
            # 同じスタッフの場合
            if existing_slot_assignment.staff_id == assignment.staff_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"枠{assignment.slot_number}には既にこのスタッフにオファーを送信済みです"
                )
            # 別のスタッフの場合
            else:
                staff = db.query(StaffModel).filter(StaffModel.id == existing_slot_assignment.staff_id).first()
                staff_name = staff.name if staff else "不明"
                raise HTTPException(
                    status_code=400,
                    detail=f"枠{assignment.slot_number}は既に{staff_name}にオファーを送信済みです"
                )
    else:
        # 枠番号が指定されていない場合（全体オファー）は、同じスタッフが既にアサインされていないかチェック
        existing = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_id,
            ReservationStaff.staff_id == assignment.staff_id,
            ReservationStaff.status != AssignmentStatus.REJECTED,
            ReservationStaff.status != AssignmentStatus.CANCELLED
        ).first()
        
        if existing:
            raise HTTPException(status_code=400, detail="このスタッフは既にこの予約に応募しています")
    
    # アサイン作成
    db_assignment = ReservationStaff(
        reservation_id=reservation_id,
        staff_id=assignment.staff_id,
        assigned_by=assignment.assigned_by,
        slot_number=assignment.slot_number,
        notes=assignment.notes,
        status=AssignmentStatus.PENDING
    )
    
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    
    return {
        "id": db_assignment.id,
        "reservation_id": db_assignment.reservation_id,
        "staff_id": db_assignment.staff_id,
        "staff_name": staff.name,
        "status": db_assignment.status.value,
        "assigned_by": db_assignment.assigned_by,
        "assigned_at": db_assignment.assigned_at.isoformat() if db_assignment.assigned_at else None,
        "slot_number": db_assignment.slot_number,
        "notes": db_assignment.notes,
    }


@router.put("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: int,
    assignment: AssignmentUpdate,
    db: Session = Depends(get_db)
):
    """アサインステータスを更新"""
    db_assignment = db.query(ReservationStaff).filter(ReservationStaff.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="アサインが見つかりません")
    
    # 更新
    update_data = assignment.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_assignment, field, value)
    
    db.commit()
    db.refresh(db_assignment)
    
    staff = db.query(StaffModel).filter(StaffModel.id == db_assignment.staff_id).first()
    
    return {
        "id": db_assignment.id,
        "reservation_id": db_assignment.reservation_id,
        "staff_id": db_assignment.staff_id,
        "staff_name": staff.name if staff else "不明",
        "status": db_assignment.status.value,
        "assigned_by": db_assignment.assigned_by,
        "assigned_at": db_assignment.assigned_at.isoformat() if db_assignment.assigned_at else None,
        "slot_number": db_assignment.slot_number,
        "notes": db_assignment.notes,
    }


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(assignment_id: int, db: Session = Depends(get_db)):
    """アサインを削除"""
    db_assignment = db.query(ReservationStaff).filter(ReservationStaff.id == assignment_id).first()
    if not db_assignment:
        raise HTTPException(status_code=404, detail="アサインが見つかりません")
    
    db.delete(db_assignment)
    db.commit()
    
    return None


@router.get("/staff/{staff_id}/assignments", response_model=List[AssignmentResponse])
def get_staff_assignments(staff_id: int, db: Session = Depends(get_db)):
    """スタッフに割り当てられた予約を取得"""
    assignments = db.query(ReservationStaff).filter(
        ReservationStaff.staff_id == staff_id
    ).all()
    
    result = []
    for assignment in assignments:
        staff = db.query(StaffModel).filter(StaffModel.id == assignment.staff_id).first()
        reservation = db.query(ReservationModel).filter(ReservationModel.id == assignment.reservation_id).first()
        
        reservation_summary = None
        if reservation:
            company = db.query(CompanyModel).filter(CompanyModel.id == reservation.company_id).first()
            
            # time_slotsをパース
            time_slots_data = None
            if reservation.time_slots:
                if isinstance(reservation.time_slots, str):
                    import json
                    time_slots_data = json.loads(reservation.time_slots)
                else:
                    time_slots_data = reservation.time_slots
            
            reservation_summary = ReservationSummary(
                id=reservation.id,
                company_name=company.name if company else None,
                office_name=reservation.office_name,
                office_address=reservation.office_address,
                reservation_date=reservation.reservation_date,
                start_time=reservation.start_time,
                end_time=reservation.end_time,
                hourly_rate=reservation.hourly_rate,
                time_slots=time_slots_data
            )
        
        result.append(AssignmentResponse(
            id=assignment.id,
            reservation_id=assignment.reservation_id,
            staff_id=assignment.staff_id,
            staff_name=staff.name if staff else "不明",
            slot_number=assignment.slot_number,
            status=assignment.status,
            assigned_by=assignment.assigned_by,
            assigned_at=assignment.assigned_at.isoformat() if assignment.assigned_at else None,
            notes=assignment.notes,
            reservation=reservation_summary
        ))
    
    return result


class RejectRequest(BaseModel):
    """辞退リクエスト"""
    rejection_reason: Optional[str] = None


@router.post("/assignments/{assignment_id}/accept")
def accept_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """アサインを受託（スタッフのみ）"""
    # アサインメントを取得
    assignment = db.query(ReservationStaff).filter(
        ReservationStaff.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="アサインメントが見つかりません")
    
    # スタッフユーザーのみアクセス可能
    if current_user.role != UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="スタッフのみがアサインを受託できます"
        )
    
    # ログイン中のスタッフのIDを取得
    staff = db.query(StaffModel).filter(StaffModel.user_id == current_user.id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフ情報が見つかりません")
    
    # 自分のアサインメントのみ受託可能
    if assignment.staff_id != staff.id:
        raise HTTPException(
            status_code=403,
            detail="自分のアサインメントのみ受託できます"
        )
    
    # PENDING状態のみ受託可能
    if assignment.status != AssignmentStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"受託可能な状態ではありません。現在のステータス: {assignment.status.value}"
        )
    
    # ステータスをCONFIRMEDに変更
    assignment.status = AssignmentStatus.CONFIRMED
    db.commit()
    db.refresh(assignment)
    
    return {
        "success": True,
        "message": "業務を受託しました",
        "assignment_id": assignment.id,
        "status": assignment.status.value
    }


@router.post("/assignments/{assignment_id}/reject")
def reject_assignment(
    assignment_id: int,
    reject_request: RejectRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """アサインを辞退（スタッフのみ）"""
    # アサインメントを取得
    assignment = db.query(ReservationStaff).filter(
        ReservationStaff.id == assignment_id
    ).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="アサインメントが見つかりません")
    
    # スタッフユーザーのみアクセス可能
    if current_user.role != UserRole.STAFF:
        raise HTTPException(
            status_code=403,
            detail="スタッフのみがアサインを辞退できます"
        )
    
    # ログイン中のスタッフのIDを取得
    staff = db.query(StaffModel).filter(StaffModel.user_id == current_user.id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフ情報が見つかりません")
    
    # 自分のアサインメントのみ辞退可能
    if assignment.staff_id != staff.id:
        raise HTTPException(
            status_code=403,
            detail="自分のアサインメントのみ辞退できます"
        )
    
    # PENDING状態のみ辞退可能
    if assignment.status != AssignmentStatus.PENDING:
        raise HTTPException(
            status_code=400,
            detail=f"辞退可能な状態ではありません。現在のステータス: {assignment.status.value}"
        )
    
    # ステータスをREJECTEDに変更
    assignment.status = AssignmentStatus.REJECTED
    # 辞退理由をnotesに追加
    if reject_request.rejection_reason:
        existing_notes = assignment.notes or ""
        assignment.notes = f"{existing_notes}\n[辞退理由] {reject_request.rejection_reason}".strip()
    
    db.commit()
    db.refresh(assignment)
    
    return {
        "success": True,
        "message": "業務を辞退しました",
        "assignment_id": assignment.id,
        "status": assignment.status.value
    }

