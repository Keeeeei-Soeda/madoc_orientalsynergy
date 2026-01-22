"""
企業の社員管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from ...database import get_db
from ...models.employee import Employee as EmployeeModel
from ...models.company import Company as CompanyModel
from ...models.user import User
from ...schemas.employee import Employee, EmployeeCreate, EmployeeUpdate
from ..deps import get_current_active_user, get_admin_user, get_company_user

router = APIRouter()


@router.get("/employees", response_model=List[Employee])
def get_employees(
    skip: int = 0,
    limit: int = 100,
    company_id: Optional[int] = Query(None, description="企業IDでフィルター"),
    search: Optional[str] = Query(None, description="名前または部署で検索"),
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    社員一覧を取得
    
    Args:
        skip: スキップする件数
        limit: 取得する最大件数
        company_id: 企業IDでフィルター
        search: 検索キーワード（名前または部署）
        is_active: アクティブ状態でフィルター
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        List[Employee]: 社員のリスト
    """
    query = db.query(EmployeeModel)
    
    # 企業ユーザーの場合は自社の社員のみ表示
    if current_user.role.upper() == 'COMPANY':
        # ユーザーに紐づく企業を取得
        company = db.query(CompanyModel).filter(CompanyModel.user_id == current_user.id).first()
        if company:
            query = query.filter(EmployeeModel.company_id == company.id)
    elif company_id:
        query = query.filter(EmployeeModel.company_id == company_id)
    
    # 検索フィルター
    if search:
        query = query.filter(
            (EmployeeModel.name.contains(search)) |
            (EmployeeModel.department.contains(search))
        )
    
    # アクティブ状態フィルター
    if is_active is not None:
        query = query.filter(EmployeeModel.is_active == is_active)
    
    employees = query.offset(skip).limit(limit).all()
    return employees


@router.get("/employees/{employee_id}", response_model=Employee)
def get_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    社員詳細を取得
    
    Args:
        employee_id: 社員ID
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        Employee: 社員情報
        
    Raises:
        HTTPException: 社員が見つからない場合
    """
    employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with id {employee_id} not found"
        )
    return employee


@router.post("/employees", response_model=Employee, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    社員を作成
    
    Args:
        employee: 作成する社員情報
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        Employee: 作成された社員
        
    Raises:
        HTTPException: 企業が見つからない場合、またはLINE IDが既に存在する場合
    """
    # 企業の存在確認
    company = db.query(CompanyModel).filter(CompanyModel.id == employee.company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id {employee.company_id} not found"
        )
    
    # 企業ユーザーの場合、自社の社員のみ作成可能
    if current_user.role.upper() == 'COMPANY':
        user_company = db.query(CompanyModel).filter(CompanyModel.user_id == current_user.id).first()
        if not user_company or user_company.id != employee.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only create employees for your own company"
            )
    
    # LINE ID重複チェック
    if employee.line_id:
        existing_employee = db.query(EmployeeModel).filter(
            EmployeeModel.line_id == employee.line_id
        ).first()
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee with LINE ID {employee.line_id} already exists"
            )
    
    # 社員作成
    db_employee = EmployeeModel(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    return db_employee


@router.put("/employees/{employee_id}", response_model=Employee)
def update_employee(
    employee_id: int,
    employee: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    社員情報を更新
    
    Args:
        employee_id: 社員ID
        employee: 更新する社員情報
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        Employee: 更新された社員
        
    Raises:
        HTTPException: 社員が見つからない場合
    """
    db_employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if db_employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with id {employee_id} not found"
        )
    
    # 企業ユーザーの場合、自社の社員のみ更新可能
    if current_user.role.upper() == 'COMPANY':
        user_company = db.query(CompanyModel).filter(CompanyModel.user_id == current_user.id).first()
        if not user_company or user_company.id != db_employee.company_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update employees of your own company"
            )
    
    # LINE ID重複チェック
    if employee.line_id and employee.line_id != db_employee.line_id:
        existing_employee = db.query(EmployeeModel).filter(
            EmployeeModel.line_id == employee.line_id
        ).first()
        if existing_employee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee with LINE ID {employee.line_id} already exists"
            )
    
    # 更新
    update_data = employee.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_employee, field, value)
    
    db.commit()
    db.refresh(db_employee)
    
    return db_employee


@router.delete("/employees/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(
    employee_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    社員を削除（管理者のみ）
    
    Args:
        employee_id: 社員ID
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Raises:
        HTTPException: 社員が見つからない場合
    """
    db_employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if db_employee is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with id {employee_id} not found"
        )
    
    db.delete(db_employee)
    db.commit()
    
    return None

