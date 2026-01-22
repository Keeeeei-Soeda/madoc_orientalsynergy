"""
slot_numberカラムを追加するマイグレーションスクリプト

Usage:
    python add_slot_number.py
"""
from app.database import SessionLocal, engine
from sqlalchemy import text

def add_slot_number_column():
    """reservation_staffテーブルにslot_numberカラムを追加"""
    db = SessionLocal()
    
    try:
        print("🔧 slot_numberカラムを追加中...")
        
        # カラムが既に存在するか確認
        result = db.execute(text("PRAGMA table_info(reservation_staff)")).fetchall()
        column_names = [row[1] for row in result]
        
        if 'slot_number' in column_names:
            print("✅ slot_numberカラムは既に存在します。")
            return
        
        # カラムを追加
        db.execute(text("ALTER TABLE reservation_staff ADD COLUMN slot_number INTEGER"))
        db.commit()
        
        print("✅ slot_numberカラムを追加しました。")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_slot_number_column()

