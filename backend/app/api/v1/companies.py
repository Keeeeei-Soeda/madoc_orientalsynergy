"""
企業管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ...database import get_db
from ...models.company import Company as CompanyModel
from ...models.user import User
from ...schemas.company import Company, CompanyCreate, CompanyUpdate
from ..deps import get_current_active_user, get_admin_user
from pydantic import BaseModel

router = APIRouter()


@router.get("/companies")
def get_companies(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    is_active: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    企業一覧を取得
    
    Args:
        skip: スキップする件数
        limit: 取得する最大件数
        search: 検索キーワード（企業名）
        is_active: アクティブ状態でフィルター
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        List[Company]: 企業のリスト
    """
    query = db.query(CompanyModel)
    
    # 検索フィルター
    if search:
        query = query.filter(CompanyModel.name.contains(search))
    
    # アクティブ状態フィルター
    if is_active is not None:
        query = query.filter(CompanyModel.is_active == is_active)
    
    companies_models = query.offset(skip).limit(limit).all()
    result = []
    for company_model in companies_models:
        company_dict = {
            "company_name": company_model.name,
            "representative_name": company_model.representative,
            "office_name": company_model.office_name,
            "industry": company_model.industry,
            "plan": company_model.plan,
            "contract_start_date": company_model.contract_start_date or "",
            "contract_end_date": company_model.contract_end_date,
            "usage_count": company_model.usage_count,
            "address": company_model.address,
            "phone": company_model.phone,
            "email": company_model.email,
            "contact_person": company_model.contact_person,
            "contact_phone": company_model.contact_phone,
            "contact_email": company_model.contact_email,
            "notes": company_model.notes,
            "usage_status": "active",  # デフォルト値
            "line_id": None,  # デフォルト値
            "id": company_model.id,
            "user_id": company_model.user_id,
            "created_at": company_model.created_at,
            "updated_at": company_model.updated_at,
        }
        result.append(company_dict)
    return result


@router.get("/companies/{company_id}", response_model=Company)
def get_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    企業詳細を取得
    
    Args:
        company_id: 企業ID
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        Company: 企業情報
        
    Raises:
        HTTPException: 企業が見つからない場合
    """
    db_company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if db_company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id {company_id} not found"
        )
    company = Company.model_validate(db_company)
    return company.model_dump(by_alias=True)


@router.post("/companies", response_model=Company, status_code=status.HTTP_201_CREATED)
def create_company(
    company: CompanyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    企業を作成（管理者のみ）
    
    Args:
        company: 作成する企業情報
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        Company: 作成された企業
    """
    # エイリアスを考慮してデータを変換
    company_data = company.model_dump(by_alias=True)
    db_company = CompanyModel(**company_data)
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    company = Company.model_validate(db_company)
    return company.model_dump(by_alias=True)


@router.put("/companies/{company_id}", response_model=Company)
def update_company(
    company_id: int,
    company: CompanyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    企業情報を更新（管理者のみ）
    
    Args:
        company_id: 企業ID
        company: 更新する企業情報
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        Company: 更新された企業
        
    Raises:
        HTTPException: 企業が見つからない場合
    """
    db_company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if db_company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id {company_id} not found"
        )
    
    # 更新（エイリアスを考慮）
    update_data = company.model_dump(exclude_unset=True, by_alias=True)
    for key, value in update_data.items():
        setattr(db_company, key, value)
    
    db.commit()
    db.refresh(db_company)
    company = Company.model_validate(db_company)
    return company.model_dump(by_alias=True)


@router.delete("/companies/{company_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_company(
    company_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    企業を削除（管理者のみ）
    
    Args:
        company_id: 企業ID
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Raises:
        HTTPException: 企業が見つからない場合
    """
    db_company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if db_company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id {company_id} not found"
        )
    
    db.delete(db_company)
    db.commit()
    return None


class ContractRenewalRequest(BaseModel):
    """契約更新リクエストスキーマ"""
    plan: str  # 6ヶ月 or 1年
    contract_start_date: str  # YYYY/MM/DD形式
    contract_end_date: str  # YYYY/MM/DD形式


@router.post("/companies/{company_id}/renew", response_model=Company)
def renew_company_contract(
    company_id: int,
    renewal_data: ContractRenewalRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    企業の契約を更新（管理者のみ）
    
    Args:
        company_id: 企業ID
        renewal_data: 契約更新データ
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        Company: 更新された企業情報
        
    Raises:
        HTTPException: 企業が見つからない場合、または契約が既に終了している場合
    """
    # 企業を取得
    db_company = db.query(CompanyModel).filter(CompanyModel.id == company_id).first()
    if db_company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Company with id {company_id} not found"
        )
    
    # 現在の契約が終了していないかチェック
    try:
        if db_company.contract_end_date:
            year, month, day = map(int, db_company.contract_end_date.split('/'))
            contract_end_date = datetime(year, month, day)
            today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
            
            if contract_end_date < today:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="契約が既に終了しています。契約更新できません。"
                )
    except ValueError:
        pass  # 日付のパースに失敗した場合はスキップ
    
    # 契約情報を更新
    db_company.plan = renewal_data.plan
    db_company.contract_start_date = renewal_data.contract_start_date
    db_company.contract_end_date = renewal_data.contract_end_date
    db_company.usage_count = 0  # 利用回数をリセット
    
    db.commit()
    db.refresh(db_company)
    return db_company

