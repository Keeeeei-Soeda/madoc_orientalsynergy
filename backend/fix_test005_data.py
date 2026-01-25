import os
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.reservation import Reservation as ReservationModel
from app.models.reservation_staff import ReservationStaff

def fix_test005_data():
    db = SessionLocal()
    try:
        # テスト005の予約を全て取得
        test005_reservations = db.query(ReservationModel).filter(
            ReservationModel.office_name.like('%テスト005%')
        ).order_by(ReservationModel.id).all()
        
        print(f"📋 テスト005の予約数: {len(test005_reservations)}件\n")
        
        # 古い予約（ID: 33）を削除（2026/01/22のもの）
        if len(test005_reservations) > 1:
            old_reservation = None
            for res in test005_reservations:
                if res.id == 33:  # 古い予約ID
                    old_reservation = res
                    break
            
            if old_reservation:
                print(f"🗑️  古い予約（ID: {old_reservation.id}, 日付: {old_reservation.reservation_date}）を削除します...")
                
                # 関連するアサインメントを削除
                assignments = db.query(ReservationStaff).filter(
                    ReservationStaff.reservation_id == old_reservation.id
                ).all()
                
                for assign in assignments:
                    print(f"  - アサインメントID: {assign.id} (スタッフID: {assign.staff_id}, 枠: {assign.slot_number}) を削除")
                    db.delete(assign)
                
                # 予約を削除
                db.delete(old_reservation)
                db.commit()
                print(f"✅ 予約ID: {old_reservation.id} と関連アサインメントを削除しました\n")
        
        # 残りの予約（ID: 35）のtime_slotsを確認
        remaining_reservation = db.query(ReservationModel).filter(
            ReservationModel.id == 35
        ).first()
        
        if remaining_reservation:
            print(f"📋 残りの予約（ID: {remaining_reservation.id}）の情報:")
            print(f"  日付: {remaining_reservation.reservation_date}")
            print(f"  事業所: {remaining_reservation.office_name}")
            print(f"  time_slots: {remaining_reservation.time_slots}")
            print(f"  service_duration: {remaining_reservation.service_duration}")
            print()
            
            # time_slotsが正しく設定されているか確認
            import json
            if remaining_reservation.time_slots:
                if isinstance(remaining_reservation.time_slots, str):
                    time_slots = json.loads(remaining_reservation.time_slots)
                else:
                    time_slots = remaining_reservation.time_slots
                
                print("📋 時間枠の詳細:")
                for slot in time_slots:
                    print(f"  枠{slot.get('slot')}: {slot.get('start_time')} ~ {slot.get('end_time')}")
                    print(f"    時間: {slot.get('duration')}分")
                    print(f"    埋まっている: {slot.get('is_filled')}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    fix_test005_data()

