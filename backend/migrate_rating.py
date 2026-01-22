"""
Ratingsテーブルに新しいフィールドを追加するマイグレーションスクリプト

Usage:
    python migrate_rating.py
"""
from app.database import SessionLocal
from sqlalchemy import text

def migrate_rating():
    """Ratingsテーブルに新しいフィールドを追加"""
    db = SessionLocal()
    
    try:
        print("🔧 Ratingsテーブルをマイグレーション中...")
        
        # 既存のカラムを確認
        result = db.execute(text("PRAGMA table_info(ratings)")).fetchall()
        existing_columns = {row[1] for row in result}
        
        # 追加するカラムのリスト
        new_columns = [
            ("assignment_id", "INTEGER"),
            ("cleanliness", "INTEGER DEFAULT 5"),
            ("responsiveness", "INTEGER DEFAULT 5"),
            ("satisfaction", "INTEGER DEFAULT 5"),
            ("punctuality", "INTEGER DEFAULT 5"),
            ("skill", "INTEGER DEFAULT 5"),
            ("average_rating", "REAL DEFAULT 5.0"),
            ("is_public", "BOOLEAN DEFAULT 1"),
        ]
        
        added_count = 0
        for column_name, column_type in new_columns:
            if column_name not in existing_columns:
                try:
                    sql = f"ALTER TABLE ratings ADD COLUMN {column_name} {column_type}"
                    db.execute(text(sql))
                    print(f"  ✅ {column_name} カラムを追加しました")
                    added_count += 1
                except Exception as e:
                    print(f"  ⚠️  {column_name} の追加中にエラー: {e}")
            else:
                print(f"  ℹ️  {column_name} は既に存在します")
        
        db.commit()
        
        if added_count > 0:
            print(f"\n✅ {added_count}個のカラムを追加しました")
        else:
            print("\n✅ すべてのカラムは既に存在します")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    migrate_rating()

