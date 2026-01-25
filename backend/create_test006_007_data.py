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

def create_test006_007_data():
    db = SessionLocal()
    try:
        now = datetime.now()
        # 1月の未来の日付を使用（受託・辞退のテスト用）
        test_date_006 = f"{now.year}/01/25"  # テスト006用
        test_date_007 = f"{now.year}/01/26"  # テスト007用
        
        print(f"📅 テスト006用の日付: {test_date_006}")
        print(f"📅 テスト007用の日付: {test_date_007}\n")
        
        # 会社情報を取得
        company = db.query(CompanyModel).filter(CompanyModel.id == 1).first()
        if not company:
            print("❌ エラー: 会社ID=1が見つかりません。")
            return
        
        # 従業員を取得
        employee1 = db.query(EmployeeModel).filter(EmployeeModel.id == 1).first()
        employee2 = db.query(EmployeeModel).filter(EmployeeModel.id == 2).first()
        
        if not employee1 or not employee2:
            print("❌ エラー: 従業員ID=1または2が見つかりません。")
            return
        
        # スタッフ情報を取得（山田花子: staff_id=1）
        staff1 = db.query(StaffModel).filter(StaffModel.id == 1).first()
        if not staff1:
            print("❌ エラー: スタッフID=1（山田花子）が見つかりません。")
            return
        
        # ============================================
        # テスト006: 受託テスト用（PENDING状態のオファー）
        # ============================================
        print("📋 テスト006のデータを作成中...")
        
        # 既存のテスト006予約を検索
        existing_reservation_006 = db.query(ReservationModel).filter(
            ReservationModel.reservation_date == test_date_006,
            ReservationModel.office_name.like('%テスト006%')
        ).first()
        
        if existing_reservation_006:
            print(f"⚠️ テスト006の予約 (ID: {existing_reservation_006.id}) が既に存在します。")
            reservation_006 = existing_reservation_006
        else:
            # テスト006の予約を作成
            reservation_006 = ReservationModel(
                company_id=company.id,
                office_name="東京支店（テスト006）",
                office_address="東京都渋谷区渋谷1-1-1",
                reservation_date=test_date_006,
                start_time="10:00",
                end_time="12:00",
                application_deadline=test_date_006,
                max_participants=1,
                total_duration=120,  # 2時間
                service_duration=60,
                break_duration=0,
                slot_count=2,
                time_slots=json.dumps([
                    {
                        "slot": 1,
                        "start_time": "10:00",
                        "end_time": "11:00",
                        "duration": 60,
                        "is_filled": False
                    },
                    {
                        "slot": 2,
                        "start_time": "11:00",
                        "end_time": "12:00",
                        "duration": 60,
                        "is_filled": False
                    }
                ]),
                slots_filled=0,
                hourly_rate=4000,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="テスト006用予約（受託テスト用）",
                employee_names=f"{employee1.name}"
            )
            db.add(reservation_006)
            db.commit()
            db.refresh(reservation_006)
            print(f"✅ テスト006の予約を作成しました (ID: {reservation_006.id})")
        
        # テスト006のアサインメント（PENDING状態）を作成
        existing_assignment_006 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_006.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()
        
        if existing_assignment_006:
            print(f"⚠️ テスト006のアサインメント (ID: {existing_assignment_006.id}) が既に存在します。")
        else:
            assignment_006 = ReservationStaff(
                reservation_id=reservation_006.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.PENDING,  # 受託前（PENDING状態）
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="テスト006: 受託テスト用オファー（PENDING状態）"
            )
            db.add(assignment_006)
            db.commit()
            db.refresh(assignment_006)
            print(f"✅ テスト006のアサインメントを作成しました (ID: {assignment_006.id}, ステータス: PENDING)")
        
        # ============================================
        # テスト007: 辞退テスト用（PENDING状態のオファー）
        # ============================================
        print("\n📋 テスト007のデータを作成中...")
        
        # 既存のテスト007予約を検索
        existing_reservation_007 = db.query(ReservationModel).filter(
            ReservationModel.reservation_date == test_date_007,
            ReservationModel.office_name.like('%テスト007%')
        ).first()
        
        if existing_reservation_007:
            print(f"⚠️ テスト007の予約 (ID: {existing_reservation_007.id}) が既に存在します。")
            reservation_007 = existing_reservation_007
        else:
            # テスト007の予約を作成
            reservation_007 = ReservationModel(
                company_id=company.id,
                office_name="大阪支店（テスト007）",
                office_address="大阪府大阪市北区梅田2-2-2",
                reservation_date=test_date_007,
                start_time="14:00",
                end_time="16:00",
                application_deadline=test_date_007,
                max_participants=1,
                total_duration=120,  # 2時間
                service_duration=60,
                break_duration=0,
                slot_count=2,
                time_slots=json.dumps([
                    {
                        "slot": 1,
                        "start_time": "14:00",
                        "end_time": "15:00",
                        "duration": 60,
                        "is_filled": False
                    },
                    {
                        "slot": 2,
                        "start_time": "15:00",
                        "end_time": "16:00",
                        "duration": 60,
                        "is_filled": False
                    }
                ]),
                slots_filled=0,
                hourly_rate=3500,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="テスト007用予約（辞退テスト用）",
                employee_names=f"{employee2.name}"
            )
            db.add(reservation_007)
            db.commit()
            db.refresh(reservation_007)
            print(f"✅ テスト007の予約を作成しました (ID: {reservation_007.id})")
        
        # テスト007のアサインメント（PENDING状態）を作成
        existing_assignment_007 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_007.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()
        
        if existing_assignment_007:
            print(f"⚠️ テスト007のアサインメント (ID: {existing_assignment_007.id}) が既に存在します。")
        else:
            assignment_007 = ReservationStaff(
                reservation_id=reservation_007.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.PENDING,  # 受託前（PENDING状態）
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="テスト007: 辞退テスト用オファー（PENDING状態）"
            )
            db.add(assignment_007)
            db.commit()
            db.refresh(assignment_007)
            print(f"✅ テスト007のアサインメントを作成しました (ID: {assignment_007.id}, ステータス: PENDING)")
        
        print("\n🎉 テスト006・007のセットアップ完了！")
        print("\n📋 作成されたデータ:")
        print(f"\n【テスト006 - 受託テスト用】")
        print(f"  予約ID: {reservation_006.id}")
        print(f"  日付: {reservation_006.reservation_date}")
        print(f"  事業所: {reservation_006.office_name}")
        print(f"  時間: {reservation_006.start_time} ~ {reservation_006.end_time}")
        print(f"  時給: {reservation_006.hourly_rate}円")
        print(f"  アサインメントID: {assignment_006.id if 'assignment_006' in locals() else existing_assignment_006.id}")
        print(f"  ステータス: PENDING（受託前）")
        
        print(f"\n【テスト007 - 辞退テスト用】")
        print(f"  予約ID: {reservation_007.id}")
        print(f"  日付: {reservation_007.reservation_date}")
        print(f"  事業所: {reservation_007.office_name}")
        print(f"  時間: {reservation_007.start_time} ~ {reservation_007.end_time}")
        print(f"  時給: {reservation_007.hourly_rate}円")
        print(f"  アサインメントID: {assignment_007.id if 'assignment_007' in locals() else existing_assignment_007.id}")
        print(f"  ステータス: PENDING（受託前）")
        
        print("\n📋 テスト手順:")
        print("\n【スタッフ側テスト（山田花子）】")
        print("1. staff1@example.com でログイン (password: password123)")
        print("2. オファー画面（/staff/jobs/offers）にアクセス")
        print("3. テスト006とテスト007のオファーがPENDING状態で表示されることを確認")
        print("\n【受託テスト（テスト006）】")
        print("4. テスト006のオファー詳細ページにアクセス")
        print("5. 「受託する」ボタンをクリック")
        print("6. ステータスがCONFIRMEDに変更されることを確認")
        print("\n【辞退テスト（テスト007）】")
        print("7. テスト007のオファー詳細ページにアクセス")
        print("8. 「辞退する」ボタンをクリック")
        print("9. 辞退理由を入力して送信")
        print("10. ステータスがREJECTEDに変更されることを確認")
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test006_007_data()

