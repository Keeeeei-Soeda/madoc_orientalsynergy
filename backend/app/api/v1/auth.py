"""
認証API（ログイン、ログアウト、トークンリフレッシュ）
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from ...database import get_db
from ...models.user import User, UserRole
from ...schemas.token import Token, RefreshTokenRequest
from ...schemas.user import User as UserSchema
from ...core.security import (
    verify_password,
    create_access_token,
    create_refresh_token,
    verify_token
)
from ...config import settings
from ..deps import get_current_active_user

router = APIRouter()


@router.post("/auth/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    ログイン（OAuth2形式）
    
    Args:
        form_data: OAuth2形式のログイン情報（username=email, password）
        db: データベースセッション
        
    Returns:
        Token: アクセストークンとリフレッシュトークン
        
    Raises:
        HTTPException: ログイン失敗時
    """
    # メールアドレスでユーザーを検索（OAuth2ではusernameフィールドにemailが入る）
    user = db.query(User).filter(User.email == form_data.username).first()
    
    # ユーザーが存在しない、またはパスワードが一致しない
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="メールアドレスまたはパスワードが正しくありません",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ユーザーがアクティブでない
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="アカウントが無効化されています"
        )
    
    # トークンを作成
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.id, "role": user.role.value}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/auth/refresh", response_model=Token)
def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    リフレッシュトークンを使って新しいアクセストークンを取得
    
    Args:
        refresh_data: リフレッシュトークン
        db: データベースセッション
        
    Returns:
        Token: 新しいアクセストークンとリフレッシュトークン
        
    Raises:
        HTTPException: トークンが無効な場合
    """
    # リフレッシュトークンを検証
    payload = verify_token(refresh_data.refresh_token, token_type="refresh")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="リフレッシュトークンが無効です",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ユーザーIDを取得
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="リフレッシュトークンが無効です"
        )
    
    # ユーザーを取得
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="アカウントが無効化されています"
        )
    
    # 新しいトークンを作成
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role.value}
    )
    new_refresh_token = create_refresh_token(
        data={"sub": user.id, "role": user.role.value}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }


@router.post("/auth/logout")
def logout(current_user: User = Depends(get_current_active_user)):
    """
    ログアウト
    
    Note:
        JWTはステートレスなため、サーバー側でトークンを無効化することはできません。
        クライアント側でトークンを削除してください。
        将来的には、Redisを使ってトークンのブラックリストを管理することもできます。
    
    Args:
        current_user: 現在のユーザー
        
    Returns:
        dict: ログアウト成功メッセージ
    """
    return {"message": "ログアウトしました"}


@router.get("/auth/me", response_model=UserSchema)
def get_me(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    現在のログインユーザー情報を取得
    
    Args:
        current_user: 現在のユーザー
        db: データベースセッション
        
    Returns:
        User: ユーザー情報（企業ユーザーの場合はcompany_idを含む）
    """
    # 企業ユーザーの場合、company_idを取得
    company_id = None
    if current_user.role == UserRole.COMPANY:
        from ...models.company import Company
        company = db.query(Company).filter(Company.user_id == current_user.id).first()
        if company:
            company_id = company.id
    
    # ユーザー情報をdictに変換してcompany_idを追加
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name,
        "role": current_user.role,
        "is_active": current_user.is_active,
        "company_id": company_id,
        "created_at": current_user.created_at,
        "updated_at": current_user.updated_at
    }
    
    return user_dict




