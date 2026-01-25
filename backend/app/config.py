"""
アプリケーション設定
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """アプリケーション設定"""
    
    # アプリケーション情報
    APP_NAME: str = "Oriental Synergy API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # データベース設定
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    DB_NAME: str = "oriental_synergy"
    USE_SQLITE: bool = True  # 開発環境ではSQLiteを使用
    
    @property
    def DATABASE_URL(self) -> str:
        """データベース接続URL"""
        if self.USE_SQLITE:
            # SQLiteを使用（開発環境）
            return "sqlite:///./oriental_synergy.db"
        else:
            # PostgreSQLを使用（本番環境）
            return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"
    
    # Redis設定
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    
    @property
    def REDIS_URL(self) -> str:
        """Redis接続URL"""
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    # JWT設定
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS設定
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000,http://162.43.15.173:3000,http://162.43.15.173:8000"
    
    @property
    def get_cors_origins(self) -> list:
        """CORS設定をリストとして取得"""
        return [origin.strip() for origin in self.BACKEND_CORS_ORIGINS.split(",")]
    
    # ページネーション
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # SMTP設定（メール通知用）
    SMTP_HOST: Optional[str] = None  # 例: smtp.gmail.com
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_FROM_EMAIL: str = "noreply@orientalsynergy.com"
    SMTP_TLS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # 余分な環境変数を無視する


# 設定インスタンス
settings = Settings()

