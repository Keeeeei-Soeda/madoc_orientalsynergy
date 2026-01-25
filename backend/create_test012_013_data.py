"""
テストデータ012、013を作成するスクリプト

要件:
- 予約枠の数：3名
- すでに予約されている数：1名（社員が予約中）
- 残りの予約数：2名
- 時間：12:00〜14:00
- 施術時間：30分
- 休憩時間：10分
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.reservation import Reservation, ReservationStatus
from app.models.company import Company
from datetime import datetime, timedelta
import json

# データベース接続
DATABASE_URL = "sqlite:///./oriental_synergy.db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def calculate_time_slots_with_breaks(start_time: str, end_time: str, service_duration: int, break_duration: int, max_participants: int):
    """
    休憩時間を含む時間枠を計算
    
    Args:
        start_time: 開始時刻 "HH:MM"
        end_time: 終了時刻 "HH:MM"
        service_duration: 施術時間（分）
        break_duration: 休憩時間（分）
        max_participants: 募集人数
    
    Returns:
        時間枠のリスト
    """
    start_hour, start_min = map(int, start_time.split(':'))
    end_hour, end_min = map(int, end_time.split(':'))
    
    start_dt = datetime(2000, 1, 1, start_hour, start_min)
    end_dt = datetime(2000, 1, 1, end_hour, end_min)
    
    slots = []
    current_time = start_dt
    slot_number = 1
    
    # 時間枠を計算
    while current_time + timedelta(minutes=service_duration) <= end_dt:
        slot_end = current_time + timedelta(minutes=service_duration)
        
        slots.append({
            'slot': slot_number,
            'start_time': current_time.strftime('%H:%M'),
            'end_time': slot_end.strftime('%H:%M'),
            'duration': service_duration,
            'is_filled': False
        })
        
        slot_number += 1
        # 次の枠は休憩時間を含めた時間から開始
        current_time = slot_end + timedelta(minutes=break_duration)
    
    return slots


def create_test_reservations():
    """テストデータ012、013を作成"""
    db = SessionLocal()
    
    try:
        # 企業ID 1を取得
        company = db.query(Company).filter(Company.id == 1).first()
        if not company:
            print("❌ 企業ID 1が見つかりません")
            return
        
        print("=" * 80)
        print("テストデータ012、013の作成")
        print("=" * 80)
        
        # テストデータ012
        print("\n【テストデータ012】")
        
        # 時間枠を計算
        time_slots_012 = calculate_time_slots_with_breaks(
            start_time="12:00",
            end_time="14:00",
            service_duration=30,
            break_duration=10,
            max_participants=3
        )
        
        # 最初の枠に社員を割り当て
        time_slots_012[0]['employee_name'] = "田中太郎"
        time_slots_012[0]['employee_department'] = "営業部"
        time_slots_012[0]['is_filled'] = True
        
        print(f"  時間枠数: {len(time_slots_012)}枠")
        for slot in time_slots_012:
            status = "予約済み" if slot['is_filled'] else "空き"
            emp = f"({slot.get('employee_name', '')})" if slot.get('employee_name') else ""
            print(f"    枠{slot['slot']}: {slot['start_time']}~{slot['end_time']} - {status} {emp}")
        
        reservation_012 = Reservation(
            company_id=company.id,
            office_name="札幌支店（テスト012）",
            office_address="北海道札幌市中央区北1条西2-2-2",
            reservation_date="2026/02/01",
            start_time="12:00",
            end_time="14:00",
            max_participants=3,  # 募集人数3名
            employee_names="田中太郎",  # 既に1名登録済み
            staff_names=None,
            status=ReservationStatus.RECRUITING,
            notes="テスト012用予約（時間枠テスト）",
            requirements="",
            total_duration=120,  # 2時間
            service_duration=30,  # 30分
            break_duration=10,  # 10分
            slot_count=len(time_slots_012),
            time_slots=time_slots_012,
            slots_filled=1,  # 1名予約済み
            hourly_rate=3000
        )
        
        db.add(reservation_012)
        db.flush()
        
        print(f"  ✅ 予約ID {reservation_012.id}: 札幌支店（テスト012）")
        print(f"     募集人数: 3名, 予約済み: 1名, 空き: 2名")
        
        # テストデータ013
        print("\n【テストデータ013】")
        
        # 時間枠を計算
        time_slots_013 = calculate_time_slots_with_breaks(
            start_time="12:00",
            end_time="14:00",
            service_duration=30,
            break_duration=10,
            max_participants=3
        )
        
        # 最初の枠に社員を割り当て
        time_slots_013[0]['employee_name'] = "佐藤花子"
        time_slots_013[0]['employee_department'] = "総務部"
        time_slots_013[0]['is_filled'] = True
        
        print(f"  時間枠数: {len(time_slots_013)}枠")
        for slot in time_slots_013:
            status = "予約済み" if slot['is_filled'] else "空き"
            emp = f"({slot.get('employee_name', '')})" if slot.get('employee_name') else ""
            print(f"    枠{slot['slot']}: {slot['start_time']}~{slot['end_time']} - {status} {emp}")
        
        reservation_013 = Reservation(
            company_id=company.id,
            office_name="仙台支店（テスト013）",
            office_address="宮城県仙台市青葉区中央1-1-1",
            reservation_date="2026/02/02",
            start_time="12:00",
            end_time="14:00",
            max_participants=3,  # 募集人数3名
            employee_names="佐藤花子",  # 既に1名登録済み
            staff_names=None,
            status=ReservationStatus.RECRUITING,
            notes="テスト013用予約（時間枠テスト）",
            requirements="",
            total_duration=120,  # 2時間
            service_duration=30,  # 30分
            break_duration=10,  # 10分
            slot_count=len(time_slots_013),
            time_slots=time_slots_013,
            slots_filled=1,  # 1名予約済み
            hourly_rate=3000
        )
        
        db.add(reservation_013)
        db.flush()
        
        print(f"  ✅ 予約ID {reservation_013.id}: 仙台支店（テスト013）")
        print(f"     募集人数: 3名, 予約済み: 1名, 空き: 2名")
        
        db.commit()
        
        print("\n" + "=" * 80)
        print("✅ テストデータ012、013の作成が完了しました")
        print("=" * 80)
        
        print("\n【確認用情報】")
        print(f"予約012 ID: {reservation_012.id}")
        print(f"  - 札幌支店（テスト012）")
        print(f"  - 2026/02/01 12:00~14:00")
        print(f"  - 募集3名 / 予約済み1名 / 空き2名")
        print(f"  - 時間枠: 3枠（30分×3、休憩10分）")
        print(f"  - 登録済み社員: 田中太郎（営業部）")
        
        print(f"\n予約013 ID: {reservation_013.id}")
        print(f"  - 仙台支店（テスト013）")
        print(f"  - 2026/02/02 12:00~14:00")
        print(f"  - 募集3名 / 予約済み1名 / 空き2名")
        print(f"  - 時間枠: 3枠（30分×3、休憩10分）")
        print(f"  - 登録済み社員: 佐藤花子（総務部）")
        
        print("\n【テスト用途】")
        print("1. スタッフが枠に申し込むパターン")
        print("   → /admin/dashboard から予約詳細を開き、スタッフをアサイン")
        print("\n2. 社員が自分で予約するパターン")
        print("   → /company/employee-bookings から空き枠を選択して登録")
        print("\n3. 会社側で予約を取るパターン")
        print("   → /company/reservations/[id] から社員を選択して枠に割り当て")
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    print("テストデータ012、013作成スクリプト")
    create_test_reservations()

