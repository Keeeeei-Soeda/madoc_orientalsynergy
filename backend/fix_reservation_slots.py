"""
予約の時間枠を修正するスクリプト
募集人数（max_participants）に基づいて、time_slotsを再計算します
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.config import settings
from app.models.reservation import Reservation
from app.utils.time_slot_calculator import calculate_time_slots

def fix_reservation_slots():
    """既存の予約の時間枠を修正"""
    DATABASE_URL = settings.DATABASE_URL
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # service_durationが設定されている予約を取得
        reservations = db.query(Reservation).filter(
            Reservation.service_duration.isnot(None),
            Reservation.service_duration > 0
        ).all()
        
        print(f"🔧 {len(reservations)}件の予約を修正します...\n")
        
        updated_count = 0
        for reservation in reservations:
            print(f"予約ID: {reservation.id}")
            print(f"  事業所: {reservation.office_name}")
            print(f"  日時: {reservation.reservation_date} {reservation.start_time}~{reservation.end_time}")
            print(f"  募集人数: {reservation.max_participants}")
            print(f"  現在の枠数: {reservation.slot_count}")
            
            # 時間枠を再計算
            break_duration = reservation.break_duration or 0
            slot_result = calculate_time_slots(
                reservation.start_time,
                reservation.end_time,
                reservation.service_duration,
                break_duration,
                reservation.max_participants  # 募集人数を考慮
            )
            
            if not slot_result['valid']:
                print(f"  ❌ エラー: {slot_result['error']}")
                continue
            
            # 既存の割り当て情報を保持
            old_slots = reservation.time_slots or []
            new_slots = slot_result['slots']
            
            # 既存の割り当て情報を新しい枠にコピー
            for i, new_slot in enumerate(new_slots):
                if i < len(old_slots) and old_slots[i].get('is_filled'):
                    new_slot['employee_id'] = old_slots[i].get('employee_id')
                    new_slot['employee_name'] = old_slots[i].get('employee_name')
                    new_slot['employee_department'] = old_slots[i].get('employee_department')
                    new_slot['is_filled'] = True
            
            # slots_filledを再計算
            slots_filled = sum(1 for slot in new_slots if slot.get('is_filled', False))
            
            # 更新
            reservation.slot_count = slot_result['slot_count']
            reservation.time_slots = new_slots
            reservation.slots_filled = slots_filled
            
            print(f"  ✅ 更新: {reservation.slot_count}枠（物理的には{slot_result['physical_slot_count']}枠可能）")
            print(f"      割り当て済み: {slots_filled}枠")
            print()
            
            updated_count += 1
        
        db.commit()
        print(f"\n✅ {updated_count}件の予約を更新しました")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
    finally:
        db.close()
        engine.dispose()

if __name__ == "__main__":
    fix_reservation_slots()

