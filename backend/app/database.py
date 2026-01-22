"""
データベース接続設定
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# データベースエンジンの作成
if settings.USE_SQLITE:
    # SQLite用の設定
    engine = create_engine(
        settings.DATABASE_URL,
        connect_args={"check_same_thread": False},  # SQLiteでマルチスレッド対応
        echo=settings.DEBUG,  # SQLログ出力（デバッグ時のみ）
    )
else:
    # PostgreSQL用の設定
    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,  # 接続の健全性チェック
        echo=settings.DEBUG,  # SQLログ出力（デバッグ時のみ）
    )

# セッションローカルの作成
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ベースクラス
Base = declarative_base()


def get_db():
    """
    データベースセッションの依存性注入
    
    Yields:
        Session: データベースセッション
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

