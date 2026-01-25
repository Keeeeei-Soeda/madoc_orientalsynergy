#!/usr/bin/env python3
"""
テスト004ダミーデータ作成スクリプト

本日分の予約とアサインメントを作成します。
- 企業: 株式会社A（company1@example.com）
- 予約: 本日の予約（テスト004）
- 従業員: 2名をアサイン
- スタッフ: 2名を確定済みでアサイン
"""
import os
import sys
from datetime import date, datetime
import json

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.database import SessionLocal
from backend.app.models.reservation import Reservation as ReservationModel, ReservationStatus
from backend.app.models.reservation_staff import ReservationStaff, AssignmentStatus
from backend.app.models.staff import Staff as StaffModel
from backend.app.models.company import Company as CompanyModel
from backend.app.models.employee import Employee as EmployeeModel

def create_test004_data():
    db = SessionLocal()
    try:
        today = date.today().strftime('%Y/%m/%d')
        print(f"\n{'='*60}")
        print(f"📅 本日の日付: {today}")
        print(f"{'='*60}\n")

        # 企業情報を取得（株式会社A: company_id=1）
        company = db.query(CompanyModel).filter(CompanyModel.id == 1).first()
        if not company:
            print("❌ エラー: 企業ID=1（株式会社A）が見つかりません")
            return
        print(f"✅ 企業情報取得: {company.name}")

        # 従業員を取得（company_id=1の従業員）
        employees = db.query(EmployeeModel).filter(EmployeeModel.company_id == 1).limit(2).all()
        if len(employees) < 2:
            print("⚠️  警告: 従業員が2名未満です。既存の従業員を使用します")
        
        employee1 = employees[0] if len(employees) > 0 else None
        employee2 = employees[1] if len(employees) > 1 else None
        
        if employee1:
            print(f"✅ 従業員1: {employee1.name}")
        if employee2:
            print(f"✅ 従業員2: {employee2.name}")

        # 既存のテスト004予約を検索
        existing_reservation = db.query(ReservationModel).filter(
            ReservationModel.office_name.like('%テスト004%')
        ).first()

        if existing_reservation:
            print(f"\n⚠️  テスト004の予約 (ID: {existing_reservation.id}) が既に存在します")
            print("既存の予約を使用します")
            reservation = existing_reservation
        else:
            # 本日分の予約を作成
            time_slots_data = []
            
            # 枠1: 09:00-10:00（従業員1）
            slot1 = {
                "slot": 1,
                "start_time": "09:00",
                "end_time": "10:00",
                "duration": 60,
                "is_filled": True,
            }
            if employee1:
                slot1["employee_id"] = employee1.id
                slot1["employee_name"] = employee1.name
                slot1["employee_department"] = employee1.department
            time_slots_data.append(slot1)
            
            # 枠2: 10:15-11:15（従業員2）
            slot2 = {
                "slot": 2,
                "start_time": "10:15",
                "end_time": "11:15",
                "duration": 60,
                "is_filled": True,
            }
            if employee2:
                slot2["employee_id"] = employee2.id
                slot2["employee_name"] = employee2.name
                slot2["employee_department"] = employee2.department
            time_slots_data.append(slot2)
            
            # 枠3: 11:30-12:30
            time_slots_data.append({
                "slot": 3,
                "start_time": "11:30",
                "end_time": "12:30",
                "duration": 60,
                "is_filled": False,
            })

            reservation = ReservationModel(
                company_id=company.id,
                office_name="渋谷オフィス（テスト004）",
                office_address="東京都渋谷区道玄坂2-10-7",
                reservation_date=today,
                start_time="09:00",
                end_time="12:45",
                application_deadline=today,
                max_participants=2,
                employee_names=f"{employee1.name if employee1 else '未設定'},{employee2.name if employee2 else '未設定'}",
                total_duration=225,  # 3時間45分
                service_duration=60,
                break_duration=15,
                slot_count=3,
                time_slots=json.dumps(time_slots_data, ensure_ascii=False),
                slots_filled=2,
                hourly_rate=3600,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="本日分のテスト004用予約です。スタッフ評価機能のテスト用。"
            )
            db.add(reservation)
            db.commit()
            db.refresh(reservation)
            print(f"\n✅ 予約を作成しました (ID: {reservation.id})")

        # スタッフ情報を取得
        staff1 = db.query(StaffModel).filter(StaffModel.id == 1).first()  # 山田花子
        staff3 = db.query(StaffModel).filter(StaffModel.id == 3).first()  # 鈴木健太

        if not staff1:
            print("❌ エラー: スタッフID=1（山田花子）が見つかりません")
            return
        if not staff3:
            print("❌ エラー: スタッフID=3（鈴木健太）が見つかりません")
            return

        print(f"\n✅ スタッフ1: {staff1.name}")
        print(f"✅ スタッフ2: {staff3.name}")

        # アサインメント1: 山田花子 → 枠1（確定済み）
        existing_assignment1 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()

        if existing_assignment1:
            print(f"\n⚠️  アサインメント1 (ID: {existing_assignment1.id}) が既に存在します")
            assignment1 = existing_assignment1
        else:
            assignment1 = ReservationStaff(
                reservation_id=reservation.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.CONFIRMED,
                assigned_by=1,  # 管理者
                assigned_at=datetime.now(),
                notes="枠1へのオファー（テスト004）"
            )
            db.add(assignment1)
            db.commit()
            db.refresh(assignment1)
            print(f"\n✅ アサインメント1を作成: {staff1.name} → 枠1（確定済み）")

        # アサインメント2: 鈴木健太 → 枠2（完了報告済み）
        existing_assignment2 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation.id,
            ReservationStaff.staff_id == staff3.id,
            ReservationStaff.slot_number == 2
        ).first()

        if existing_assignment2:
            print(f"⚠️  アサインメント2 (ID: {existing_assignment2.id}) が既に存在します")
            # 既存のものを完了報告済みに更新
            existing_assignment2.status = AssignmentStatus.COMPLETED
            db.commit()
            assignment2 = existing_assignment2
            print(f"✅ アサインメント2をCOMPLETEDに更新")
        else:
            assignment2 = ReservationStaff(
                reservation_id=reservation.id,
                staff_id=staff3.id,
                slot_number=2,
                status=AssignmentStatus.COMPLETED,  # 完了報告済み
                assigned_by=1,  # 管理者
                assigned_at=datetime.now(),
                notes="枠2へのオファー（テスト004）- 完了報告済み"
            )
            db.add(assignment2)
            db.commit()
            db.refresh(assignment2)
            print(f"✅ アサインメント2を作成: {staff3.name} → 枠2（完了報告済み）")

        print(f"\n{'='*60}")
        print("🎉 テスト004データのセットアップ完了！")
        print(f"{'='*60}")
        print(f"📍 予約ID: {reservation.id}")
        print(f"🏢 企業: {company.name}")
        print(f"📅 予約日: {reservation.reservation_date}")
        print(f"⏰ 時間: {reservation.start_time} 〜 {reservation.end_time}")
        print(f"💰 時給: ¥{reservation.hourly_rate}")
        
        print(f"\n【従業員アサイン】")
        if employee1:
            print(f"  枠1: {employee1.name} ({employee1.department})")
        if employee2:
            print(f"  枠2: {employee2.name} ({employee2.department})")
        
        print(f"\n【スタッフアサイン】")
        print(f"  枠1: {staff1.name} - 確定済み (Assignment ID: {assignment1.id})")
        print(f"  枠2: {staff3.name} - 完了報告済み (Assignment ID: {assignment2.id})")
        
        print(f"\n{'='*60}")
        print("📝 テスト手順:")
        print(f"{'='*60}")
        
        print("\n【企業側テスト】")
        print("1. company1@example.com でログイン")
        print(f"2. 予約詳細画面 (予約ID: {reservation.id}) を開く")
        print("3. 「スタッフ評価（完了報告済み）」セクションを確認")
        print(f"4. {staff3.name}（枠2）の「評価する」ボタンをクリック")
        print("5. 評価を入力して送信")
        
        print("\n【スタッフ側テスト（山田花子）】")
        print("1. staff1@example.com でログイン")
        print("2. シフト管理で確定済み案件を確認")
        print("3. 勤怠管理で出勤・退勤打刻、完了報告")
        
        print("\n【スタッフ側テスト（鈴木健太）】")
        print("1. staff3@example.com でログイン")
        print("2. シフト管理で完了済み案件を確認")
        print("3. 評価確認画面で企業からの評価を確認（評価入力後）")
        
        print(f"\n{'='*60}\n")

    except Exception as e:
        db.rollback()
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test004_data()

