"""
Attendanceテーブルに新しいフィールドを追加するマイグレーションスクリプト

Usage:
    python migrate_attendance.py
"""
from app.database import SessionLocal
from sqlalchemy import text

def migrate_attendance():
    """Attendanceテーブルに新しいフィールドを追加"""
    db = SessionLocal()
    
    try:
        print("🔧 Attendanceテーブルをマイグレーション中...")
        
        # 既存のカラムを確認
        result = db.execute(text("PRAGMA table_info(attendance)")).fetchall()
        existing_columns = {row[1] for row in result}
        
        # 追加するカラムのリスト
        new_columns = [
            ("assignment_id", "INTEGER"),
            ("completion_report", "TEXT"),
            ("completion_photos", "TEXT"),  # JSON as TEXT in SQLite
            ("completed_at", "DATETIME"),
            ("correction_requested", "BOOLEAN DEFAULT 0"),
            ("correction_reason", "TEXT"),
            ("correction_requested_at", "DATETIME"),
            ("correction_approved_by", "INTEGER"),
            ("correction_approved_at", "DATETIME"),
            ("status", "VARCHAR(50) DEFAULT 'pending'"),
            ("is_late", "BOOLEAN DEFAULT 0"),
            ("is_early_leave", "BOOLEAN DEFAULT 0"),
        ]
        
        added_count = 0
        for column_name, column_type in new_columns:
            if column_name not in existing_columns:
                try:
                    sql = f"ALTER TABLE attendance ADD COLUMN {column_name} {column_type}"
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
    migrate_attendance()

