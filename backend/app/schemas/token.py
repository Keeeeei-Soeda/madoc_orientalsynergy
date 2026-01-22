"""
認証トークン関連のスキーマ
"""
from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """トークンレスポンス"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """トークンペイロード"""
    sub: Optional[int] = None  # ユーザーID
    role: Optional[str] = None  # ユーザーロール
    exp: Optional[int] = None  # 有効期限


class LoginRequest(BaseModel):
    """ログインリクエスト"""
    email: str
    password: str


class RefreshTokenRequest(BaseModel):
    """リフレッシュトークンリクエスト"""
    refresh_token: str





