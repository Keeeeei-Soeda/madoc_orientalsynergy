"""
予約のサンプルデータを投入するスクリプト
"""
import sys
from pathlib import Path

# プロジェクトルートをパスに追加
sys.path.append(str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.reservation import Reservation, ReservationStatus


def seed_reservations():
    """予約サンプルデータを投入"""
    db = SessionLocal()
    
    try:
        # 既存の予約数を確認
        existing_count = db.query(Reservation).count()
        if existing_count > 0:
            print(f"⚠️  既に{existing_count}件の予約データが存在します")
            response = input("削除して再投入しますか？ (y/N): ")
            if response.lower() != 'y':
                print("❌ キャンセルしました")
                return
            db.query(Reservation).delete()
            db.commit()
            print("🗑️  既存データを削除しました")
        
        # 予約サンプルデータ
        reservations = [
            Reservation(
                company_id=1,
                office_name="梅田オフィス",
                office_address="大阪府大阪市北区梅田1-1-1",
                reservation_date="2025/12/25",
                start_time="10:00",
                end_time="12:00",
                staff_names="山田花子, 佐藤美咲",
                employee_names="田中太郎, 鈴木次郎",
                status=ReservationStatus.CONFIRMED,
                notes="初回の施術です",
                requirements="マッサージチェア使用希望",
            ),
            Reservation(
                company_id=1,
                office_name="難波オフィス",
                office_address="大阪府大阪市中央区難波2-2-2",
                reservation_date="2025/12/26",
                start_time="14:00",
                end_time="16:00",
                staff_names="鈴木健太",
                employee_names="山田花子, 佐藤次郎",
                status=ReservationStatus.PENDING,
                notes="",
                requirements="",
            ),
            Reservation(
                company_id=2,
                office_name="本社オフィス",
                office_address="東京都港区六本木3-3-3",
                reservation_date="2025/12/27",
                start_time="13:00",
                end_time="15:00",
                staff_names="高橋愛, 田中太郎",
                employee_names="鈴木美穂, 田中健一, 佐藤三郎",
                status=ReservationStatus.CONFIRMED,
                notes="定期訪問",
                requirements="静かな個室希望",
            ),
            Reservation(
                company_id=2,
                office_name="本社オフィス",
                office_address="東京都港区六本木3-3-3",
                reservation_date="2025/12/28",
                start_time="10:00",
                end_time="12:00",
                staff_names="山田花子",
                employee_names="鈴木美穂, 田中健一",
                status=ReservationStatus.COMPLETED,
                notes="前回と同じ施術内容",
                requirements="",
            ),
            Reservation(
                company_id=1,
                office_name="梅田オフィス",
                office_address="大阪府大阪市北区梅田1-1-1",
                reservation_date="2025/12/29",
                start_time="15:00",
                end_time="17:00",
                staff_names="佐藤美咲, 鈴木健太",
                employee_names="田中太郎",
                status=ReservationStatus.CANCELLED,
                notes="クライアント都合によりキャンセル",
                requirements="",
            ),
        ]
        
        # データベースに追加
        for reservation in reservations:
            db.add(reservation)
        
        db.commit()
        
        print("✅ 予約サンプルデータの投入が完了しました！")
        print(f"📊 投入した予約数: {len(reservations)}件")
        
        # 投入したデータを確認
        print("\n📋 投入されたデータ:")
        for i, reservation in enumerate(reservations, 1):
            print(f"  {i}. [{reservation.status.value}] {reservation.company_id} - {reservation.office_name} ({reservation.reservation_date} {reservation.start_time}-{reservation.end_time})")
    
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 予約サンプルデータを投入します...")
    seed_reservations()











