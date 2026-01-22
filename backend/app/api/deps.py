"""
依存性注入（Dependency Injection）
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from ..database import get_db
from ..core.security import verify_token
from ..models.user import User, UserRole

# HTTPベアラー認証スキーム
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    現在のログインユーザーを取得
    
    Args:
        credentials: HTTPベアラー認証情報
        db: データベースセッション
        
    Returns:
        User: 現在のユーザー
        
    Raises:
        HTTPException: 認証失敗時
    """
    # トークンを検証
    token = credentials.credentials
    payload = verify_token(token, token_type="access")
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが無効です",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ユーザーIDを取得（subは文字列なので整数に変換）
    user_id_str: Optional[str] = payload.get("sub")
    if user_id_str is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが無効です",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        user_id = int(user_id_str)
    except (ValueError, TypeError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="認証トークンが無効です",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # ユーザーをデータベースから取得
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )
    
    # アクティブなユーザーかチェック
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="アカウントが無効化されています"
        )
    
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    現在のアクティブなユーザーを取得
    
    Args:
        current_user: 現在のユーザー
        
    Returns:
        User: アクティブなユーザー
        
    Raises:
        HTTPException: ユーザーが非アクティブの場合
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="アカウントが無効化されています"
        )
    return current_user


def require_role(*allowed_roles: UserRole):
    """
    指定されたロールを持つユーザーのみアクセス可能にするデコレータ
    
    Args:
        allowed_roles: 許可するロール
        
    Returns:
        依存性注入関数
    """
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="この操作を実行する権限がありません"
            )
        return current_user
    
    return role_checker


# ロール別の依存性注入関数
def get_admin_user(current_user: User = Depends(require_role(UserRole.ADMIN))) -> User:
    """管理者ユーザーのみアクセス可能"""
    return current_user


def get_company_user(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.COMPANY))
) -> User:
    """管理者または企業ユーザーのみアクセス可能"""
    return current_user


def get_staff_user(
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.STAFF))
) -> User:
    """管理者またはスタッフユーザーのみアクセス可能"""
    return current_user

