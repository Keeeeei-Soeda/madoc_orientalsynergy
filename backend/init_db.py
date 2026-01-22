"""
データベース初期化スクリプト

Usage:
    python init_db.py
"""
from app.database import engine, Base
from app.models import User, Company, Staff, Employee, Reservation, Rating


def init_db():
    """データベーステーブルを作成"""
    print("🔧 データベーステーブルを作成中...")
    
    try:
        # 全てのテーブルを作成
        Base.metadata.create_all(bind=engine)
        print("✅ データベーステーブルの作成が完了しました！")
        
        # 作成されたテーブルの一覧を表示
        print("\n📋 作成されたテーブル:")
        for table in Base.metadata.sorted_tables:
            print(f"  - {table.name}")
            
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        raise


if __name__ == "__main__":
    init_db()

