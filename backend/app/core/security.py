"""
セキュリティ関連機能（JWT認証、パスワードハッシュ化）
"""
from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from ..config import settings

# パスワードハッシュ化コンテキスト
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    プレーンテキストのパスワードとハッシュ化されたパスワードを比較
    
    Args:
        plain_password: プレーンテキストのパスワード
        hashed_password: ハッシュ化されたパスワード
        
    Returns:
        bool: パスワードが一致する場合True
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    パスワードをハッシュ化
    
    Args:
        password: プレーンテキストのパスワード
        
    Returns:
        str: ハッシュ化されたパスワード
    """
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    JWTアクセストークンを作成
    
    Args:
        data: トークンに含めるデータ
        expires_delta: 有効期限（指定しない場合はデフォルト値を使用）
        
    Returns:
        str: JWTトークン
    """
    to_encode = data.copy()
    
    # subクレームは文字列である必要がある
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict) -> str:
    """
    JWTリフレッシュトークンを作成
    
    Args:
        data: トークンに含めるデータ
        
    Returns:
        str: JWTリフレッシュトークン
    """
    to_encode = data.copy()
    
    # subクレームは文字列である必要がある
    if "sub" in to_encode and not isinstance(to_encode["sub"], str):
        to_encode["sub"] = str(to_encode["sub"])
    
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """
    JWTトークンをデコード
    
    Args:
        token: JWTトークン
        
    Returns:
        dict: デコードされたペイロード、無効な場合はNone
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def verify_token(token: str, token_type: str = "access") -> Optional[dict]:
    """
    トークンを検証してペイロードを返す
    
    Args:
        token: JWTトークン
        token_type: トークンタイプ（"access" or "refresh"）
        
    Returns:
        dict: 有効な場合はペイロード、無効な場合はNone
    """
    payload = decode_token(token)
    if payload is None:
        return None
    
    # トークンタイプの確認
    if payload.get("type") != token_type:
        return None
    
    return payload

