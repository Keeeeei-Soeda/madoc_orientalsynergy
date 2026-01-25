import os
import sys
from datetime import date, datetime, timedelta
import json

# プロジェクトのルートディレクトリをパスに追加
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal
from app.models.reservation import Reservation as ReservationModel, ReservationStatus
from app.models.reservation_staff import ReservationStaff, AssignmentStatus
from app.models.staff import Staff as StaffModel
from app.models.company import Company as CompanyModel
from app.models.employee import Employee as EmployeeModel

def create_test005_data():
    db = SessionLocal()
    try:
        # 今月（1月）の日付を使用（スタッフ側の動作確認用）
        now = datetime.now()
        test_date = f"{now.year}/01/{now.day:02d}" if now.month == 1 else f"{now.year}/01/15"
        print(f"📅 テスト005用の日付: {test_date}")

        # 既存のテスト005予約を検索
        existing_reservation = db.query(ReservationModel).filter(
            ReservationModel.reservation_date == test_date,
            ReservationModel.office_name.like('%テスト005%')
        ).first()

        if existing_reservation:
            print(f"⚠️ テスト005の予約 (ID: {existing_reservation.id}) が既に存在します。")
            print("既存のデータを使用します。")
            reservation = existing_reservation
        else:
            # 会社情報を取得 (例: ID=1の会社)
            company = db.query(CompanyModel).filter(CompanyModel.id == 1).first()
            if not company:
                print("エラー: 会社ID=1が見つかりません。")
                return

            # 従業員を取得または確認（テスト用）
            employee1 = db.query(EmployeeModel).filter(EmployeeModel.id == 1).first()
            employee2 = db.query(EmployeeModel).filter(EmployeeModel.id == 2).first()

            if not employee1 or not employee2:
                print("エラー: 従業員ID=1または2が見つかりません。")
                return

            # 1月分の予約を作成（テスト005）
            reservation = ReservationModel(
                company_id=company.id,
                office_name="福岡支店（テスト005）",
                office_address="福岡県福岡市博多区博多駅前2-1-1",
                reservation_date=test_date,
                start_time="11:00",
                end_time="14:30",
                application_deadline=test_date,
                max_participants=2,
                total_duration=210,  # 3.5時間
                service_duration=60,
                break_duration=15,
                slot_count=3,
                time_slots=json.dumps([
                    {
                        "slot": 1,
                        "start_time": "11:00",
                        "end_time": "12:00",
                        "duration": 60,
                        "is_filled": True,
                        "employee_id": employee1.id,
                        "employee_name": employee1.name,
                        "employee_department": employee1.department
                    },
                    {
                        "slot": 2,
                        "start_time": "12:15",
                        "end_time": "13:15",
                        "duration": 60,
                        "is_filled": True,
                        "employee_id": employee2.id,
                        "employee_name": employee2.name,
                        "employee_department": employee2.department
                    },
                    {
                        "slot": 3,
                        "start_time": "13:30",
                        "end_time": "14:30",
                        "duration": 60,
                        "is_filled": False
                    }
                ]),
                slots_filled=0,
                hourly_rate=3700,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="1月分のテスト005用予約です（スタッフ側動作確認用）",
                employee_names=f"{employee1.name},{employee2.name}"
            )
            db.add(reservation)
            db.commit()
            db.refresh(reservation)
            print(f"✅ 予約を作成しました (ID: {reservation.id})")

        # スタッフ情報を取得
        staff1 = db.query(StaffModel).filter(StaffModel.id == 1).first()  # 山田花子
        staff4 = db.query(StaffModel).filter(StaffModel.id == 4).first()  # 高橋愛

        if not staff1 or not staff4:
            print("エラー: スタッフID=1または4が見つかりません。")
            return

        # アサインメント1: スタッフ1（山田花子）を枠1に確定済みで割り当て
        existing_assignment1 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()

        if existing_assignment1:
            print(f"⚠️ アサインメント1 (ID: {existing_assignment1.id}) が既に存在します。")
        else:
            assignment1 = ReservationStaff(
                reservation_id=reservation.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.CONFIRMED,
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="枠1へのオファー（テスト005 - 確定済み）"
            )
            db.add(assignment1)
            db.commit()
            db.refresh(assignment1)
            print(f"✅ スタッフ{staff1.name}を枠1に確定済みで割り当てました (ID: {assignment1.id})")

        # アサインメント2: スタッフ4（高橋愛）を枠2に完了済みで割り当て
        existing_assignment2 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation.id,
            ReservationStaff.staff_id == staff4.id,
            ReservationStaff.slot_number == 2
        ).first()

        if existing_assignment2:
            print(f"⚠️ アサインメント2 (ID: {existing_assignment2.id}) が既に存在します。")
        else:
            assignment2 = ReservationStaff(
                reservation_id=reservation.id,
                staff_id=staff4.id,
                slot_number=2,
                status=AssignmentStatus.COMPLETED,
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="枠2へのオファー（テスト005 - 完了済み、評価テスト用）"
            )
            db.add(assignment2)
            db.commit()
            db.refresh(assignment2)
            print(f"✅ スタッフ{staff4.name}を枠2に完了済みで割り当てました (ID: {assignment2.id})")

        print("\n🎉 テスト005のセットアップ完了！")
        print(f"📍 予約ID: {reservation.id}")
        print(f"📅 日付: {reservation.reservation_date}")
        print(f"⏰ 時間: {reservation.start_time} 〜 {reservation.end_time}")
        print(f"🏢 事業所: {reservation.office_name}")
        print(f"💰 時給: {reservation.hourly_rate}円")
        print("\n👥 アサインメント:")
        print(f"  - 枠1: {staff1.name} (確定済み)")
        print(f"  - 枠2: {staff4.name} (完了済み - 評価可能)")
        print(f"  - 枠3: 未割り当て")
        print("\n📋 テスト手順:")
        print("\n【企業側テスト】")
        print("1. company1@example.com でログイン (password: password123)")
        print("2. 予約一覧から「福岡支店（テスト005）」を選択")
        print("3. スタッフ評価セクションで、高橋愛さんの「評価する」ボタンをクリック")
        print("4. 評価を入力して送信")
        print("\n【スタッフ側テスト（山田花子）】")
        print("5. staff1@example.com でログイン (password: password123)")
        print("6. 勤怠管理画面で出勤・退勤打刻をテスト")
        print("\n【スタッフ側テスト（高橋愛）】")
        print("7. staff4@example.com でログイン (password: password123)")
        print("8. 評価一覧で、企業からの評価を確認")
        print("\n【管理者側確認】")
        print("9. admin@orientalsynergy.com でログイン (password: password123)")
        print("10. 予約詳細でアサインメント状況を確認")

    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test005_data()

