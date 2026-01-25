import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.reservation import Reservation as ReservationModel
from app.models.reservation_staff import ReservationStaff
from app.models.staff import Staff as StaffModel

def check_test005_data():
    db = SessionLocal()
    try:
        # テスト005の予約を全て取得
        test005_reservations = db.query(ReservationModel).filter(
            ReservationModel.office_name.like('%テスト005%')
        ).all()
        
        print(f"📋 テスト005の予約数: {len(test005_reservations)}件\n")
        
        for res in test005_reservations:
            print(f"予約ID: {res.id}")
            print(f"  日付: {res.reservation_date}")
            print(f"  事業所: {res.office_name}")
            print(f"  時間: {res.start_time} ~ {res.end_time}")
            print(f"  時給: {res.hourly_rate}円")
            
            # この予約に紐づくアサインメントを取得
            assignments = db.query(ReservationStaff).filter(
                ReservationStaff.reservation_id == res.id
            ).all()
            
            print(f"  アサインメント数: {len(assignments)}件")
            for assign in assignments:
                staff = db.query(StaffModel).filter(StaffModel.id == assign.staff_id).first()
                staff_name = staff.name if staff else f"スタッフID{assign.staff_id}"
                print(f"    - スタッフ: {staff_name} (ID: {assign.staff_id})")
                print(f"      枠: {assign.slot_number}")
                print(f"      ステータス: {assign.status}")
            print()
        
        # 山田花子さん（staff_id=1）のアサインメントを確認
        print("\n👤 山田花子さん（staff_id=1）のアサインメント:")
        yamada_assignments = db.query(ReservationStaff).filter(
            ReservationStaff.staff_id == 1,
            ReservationStaff.status == 'confirmed'
        ).all()
        
        for assign in yamada_assignments:
            reservation = db.query(ReservationModel).filter(
                ReservationModel.id == assign.reservation_id
            ).first()
            if reservation:
                print(f"  - 予約ID: {reservation.id}, 日付: {reservation.reservation_date}")
                print(f"    事業所: {reservation.office_name}")
                print(f"    枠: {assign.slot_number}, ステータス: {assign.status}")
        
        # 高橋愛さん（staff_id=4）のアサインメントを確認
        print("\n👤 高橋愛さん（staff_id=4）のアサインメント:")
        takahashi_assignments = db.query(ReservationStaff).filter(
            ReservationStaff.staff_id == 4,
            ReservationStaff.status == 'completed'
        ).all()
        
        for assign in takahashi_assignments:
            reservation = db.query(ReservationModel).filter(
                ReservationModel.id == assign.reservation_id
            ).first()
            if reservation:
                print(f"  - 予約ID: {reservation.id}, 日付: {reservation.reservation_date}")
                print(f"    事業所: {reservation.office_name}")
                print(f"    枠: {assign.slot_number}, ステータス: {assign.status}")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    check_test005_data()

