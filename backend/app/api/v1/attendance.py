"""
勤怠管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from ...database import get_db
from ...models.attendance import Attendance as AttendanceModel, AttendanceStatus
from ...models.staff import Staff as StaffModel
from ...models.reservation import Reservation as ReservationModel
from ...models.user import User, UserRole
from ..deps import get_current_active_user, get_admin_user, get_staff_user

router = APIRouter()


# Pydanticスキーマ
class CheckInRequest(BaseModel):
    """出勤打刻リクエスト"""
    assignment_id: int
    reservation_id: int
    location: Optional[str] = None  # 緯度経度（例: "34.123,135.456"）


class CheckOutRequest(BaseModel):
    """退勤打刻リクエスト"""
    attendance_id: int
    location: Optional[str] = None


class CompletionReportRequest(BaseModel):
    """完了報告リクエスト"""
    attendance_id: int
    report: str
    photos: Optional[List[str]] = None  # 写真URL配列


class CorrectionRequest(BaseModel):
    """修正申請リクエスト"""
    attendance_id: int
    reason: str


class AttendanceResponse(BaseModel):
    """勤怠レスポンス"""
    id: int
    staff_id: int
    staff_name: str
    reservation_id: Optional[int]
    assignment_id: Optional[int]
    work_date: str
    clock_in_time: Optional[str]
    clock_out_time: Optional[str]
    work_hours: Optional[int]
    status: str
    completion_report: Optional[str]
    correction_requested: bool
    correction_reason: Optional[str]
    is_late: bool
    is_early_leave: bool
    is_approved: bool
    
    class Config:
        from_attributes = True


@router.post("/attendance/check-in", response_model=AttendanceResponse)
def check_in(
    request: CheckInRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_staff_user)
):
    """出勤打刻"""
    # スタッフ情報を取得
    staff = db.query(StaffModel).filter(StaffModel.user_id == current_user.id).first()
    if not staff:
        raise HTTPException(status_code=404, detail="スタッフ情報が見つかりません")
    
    # 予約情報を取得
    reservation = db.query(ReservationModel).filter(
        ReservationModel.id == request.reservation_id
    ).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="予約が見つかりません")
    
    # 既に打刻済みかチェック
    existing = db.query(AttendanceModel).filter(
        AttendanceModel.assignment_id == request.assignment_id,
        AttendanceModel.status != AttendanceStatus.PENDING
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="既に打刻済みです")
    
    # 出勤打刻を作成
    attendance = AttendanceModel(
        staff_id=staff.id,
        reservation_id=request.reservation_id,
        assignment_id=request.assignment_id,
        work_date=reservation.reservation_date,
        clock_in_time=datetime.now(),
        location_in=request.location,
        status=AttendanceStatus.IN_PROGRESS
    )
    
    db.add(attendance)
    db.commit()
    db.refresh(attendance)
    
    return AttendanceResponse(
        id=attendance.id,
        staff_id=attendance.staff_id,
        staff_name=staff.name,
        reservation_id=attendance.reservation_id,
        assignment_id=attendance.assignment_id,
        work_date=attendance.work_date,
        clock_in_time=attendance.clock_in_time.isoformat() if attendance.clock_in_time else None,
        clock_out_time=None,
        work_hours=None,
        status=attendance.status.value,
        completion_report=None,
        correction_requested=False,
        correction_reason=None,
        is_late=False,
        is_early_leave=False,
        is_approved=False
    )


@router.post("/attendance/check-out", response_model=AttendanceResponse)
def check_out(
    request: CheckOutRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_staff_user)
):
    """退勤打刻"""
    # 勤怠レコードを取得
    attendance = db.query(AttendanceModel).filter(
        AttendanceModel.id == request.attendance_id
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="勤怠レコードが見つかりません")
    
    # 既に退勤打刻済みかチェック
    if attendance.clock_out_time:
        raise HTTPException(status_code=400, detail="既に退勤打刻済みです")
    
    # 退勤打刻
    attendance.clock_out_time = datetime.now()
    attendance.location_out = request.location
    
    # 実働時間を計算（分単位）
    if attendance.clock_in_time:
        duration = (attendance.clock_out_time - attendance.clock_in_time).total_seconds() / 60
        attendance.work_hours = int(duration - attendance.break_minutes)
    
    db.commit()
    db.refresh(attendance)
    
    # スタッフ名を取得
    staff = db.query(StaffModel).filter(StaffModel.id == attendance.staff_id).first()
    
    return AttendanceResponse(
        id=attendance.id,
        staff_id=attendance.staff_id,
        staff_name=staff.name if staff else "不明",
        reservation_id=attendance.reservation_id,
        assignment_id=attendance.assignment_id,
        work_date=attendance.work_date,
        clock_in_time=attendance.clock_in_time.isoformat() if attendance.clock_in_time else None,
        clock_out_time=attendance.clock_out_time.isoformat() if attendance.clock_out_time else None,
        work_hours=attendance.work_hours,
        status=attendance.status.value,
        completion_report=attendance.completion_report,
        correction_requested=attendance.correction_requested or False,
        correction_reason=attendance.correction_reason,
        is_late=attendance.is_late or False,
        is_early_leave=attendance.is_early_leave or False,
        is_approved=attendance.is_approved or False
    )


@router.post("/attendance/complete", response_model=AttendanceResponse)
def complete_report(
    request: CompletionReportRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_staff_user)
):
    """完了報告"""
    # 勤怠レコードを取得
    attendance = db.query(AttendanceModel).filter(
        AttendanceModel.id == request.attendance_id
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="勤怠レコードが見つかりません")
    
    # 完了報告
    attendance.completion_report = request.report
    attendance.completion_photos = request.photos
    attendance.completed_at = datetime.now()
    attendance.status = AttendanceStatus.COMPLETED
    
    db.commit()
    db.refresh(attendance)
    
    # スタッフ名を取得
    staff = db.query(StaffModel).filter(StaffModel.id == attendance.staff_id).first()
    
    return AttendanceResponse(
        id=attendance.id,
        staff_id=attendance.staff_id,
        staff_name=staff.name if staff else "不明",
        reservation_id=attendance.reservation_id,
        assignment_id=attendance.assignment_id,
        work_date=attendance.work_date,
        clock_in_time=attendance.clock_in_time.isoformat() if attendance.clock_in_time else None,
        clock_out_time=attendance.clock_out_time.isoformat() if attendance.clock_out_time else None,
        work_hours=attendance.work_hours,
        status=attendance.status.value,
        completion_report=attendance.completion_report,
        correction_requested=attendance.correction_requested or False,
        correction_reason=attendance.correction_reason,
        is_late=attendance.is_late or False,
        is_early_leave=attendance.is_early_leave or False,
        is_approved=attendance.is_approved or False
    )


@router.post("/attendance/correction", response_model=AttendanceResponse)
def request_correction(
    request: CorrectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_staff_user)
):
    """修正申請"""
    # 勤怠レコードを取得
    attendance = db.query(AttendanceModel).filter(
        AttendanceModel.id == request.attendance_id
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="勤怠レコードが見つかりません")
    
    # 修正申請
    attendance.correction_requested = True
    attendance.correction_reason = request.reason
    attendance.correction_requested_at = datetime.now()
    attendance.status = AttendanceStatus.CORRECTION_REQUESTED
    
    db.commit()
    db.refresh(attendance)
    
    # スタッフ名を取得
    staff = db.query(StaffModel).filter(StaffModel.id == attendance.staff_id).first()
    
    return AttendanceResponse(
        id=attendance.id,
        staff_id=attendance.staff_id,
        staff_name=staff.name if staff else "不明",
        reservation_id=attendance.reservation_id,
        assignment_id=attendance.assignment_id,
        work_date=attendance.work_date,
        clock_in_time=attendance.clock_in_time.isoformat() if attendance.clock_in_time else None,
        clock_out_time=attendance.clock_out_time.isoformat() if attendance.clock_out_time else None,
        work_hours=attendance.work_hours,
        status=attendance.status.value,
        completion_report=attendance.completion_report,
        correction_requested=True,
        correction_reason=attendance.correction_reason,
        is_late=attendance.is_late or False,
        is_early_leave=attendance.is_early_leave or False,
        is_approved=attendance.is_approved or False
    )


@router.get("/attendance/staff/{staff_id}", response_model=List[AttendanceResponse])
def get_staff_attendance(
    staff_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """スタッフの勤怠履歴"""
    attendances = db.query(AttendanceModel).filter(
        AttendanceModel.staff_id == staff_id
    ).order_by(AttendanceModel.work_date.desc()).all()
    
    result = []
    for attendance in attendances:
        staff = db.query(StaffModel).filter(StaffModel.id == attendance.staff_id).first()
        result.append(AttendanceResponse(
            id=attendance.id,
            staff_id=attendance.staff_id,
            staff_name=staff.name if staff else "不明",
            reservation_id=attendance.reservation_id,
            assignment_id=attendance.assignment_id,
            work_date=attendance.work_date,
            clock_in_time=attendance.clock_in_time.isoformat() if attendance.clock_in_time else None,
            clock_out_time=attendance.clock_out_time.isoformat() if attendance.clock_out_time else None,
            work_hours=attendance.work_hours,
            status=attendance.status.value,
            completion_report=attendance.completion_report,
            correction_requested=attendance.correction_requested or False,
            correction_reason=attendance.correction_reason,
            is_late=attendance.is_late or False,
            is_early_leave=attendance.is_early_leave or False,
            is_approved=attendance.is_approved or False
        ))
    
    return result


@router.put("/attendance/{attendance_id}/approve", response_model=AttendanceResponse)
def approve_correction(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """修正承認（管理者）"""
    # 勤怠レコードを取得
    attendance = db.query(AttendanceModel).filter(
        AttendanceModel.id == attendance_id
    ).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="勤怠レコードが見つかりません")
    
    # 承認
    attendance.correction_approved_by = current_user.id
    attendance.correction_approved_at = datetime.now()
    attendance.status = AttendanceStatus.CORRECTED
    attendance.is_approved = True
    
    db.commit()
    db.refresh(attendance)
    
    # スタッフ名を取得
    staff = db.query(StaffModel).filter(StaffModel.id == attendance.staff_id).first()
    
    return AttendanceResponse(
        id=attendance.id,
        staff_id=attendance.staff_id,
        staff_name=staff.name if staff else "不明",
        reservation_id=attendance.reservation_id,
        assignment_id=attendance.assignment_id,
        work_date=attendance.work_date,
        clock_in_time=attendance.clock_in_time.isoformat() if attendance.clock_in_time else None,
        clock_out_time=attendance.clock_out_time.isoformat() if attendance.clock_out_time else None,
        work_hours=attendance.work_hours,
        status=attendance.status.value,
        completion_report=attendance.completion_report,
        correction_requested=attendance.correction_requested or False,
        correction_reason=attendance.correction_reason,
        is_late=attendance.is_late or False,
        is_early_leave=attendance.is_early_leave or False,
        is_approved=True
    )
