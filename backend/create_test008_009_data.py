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

def create_test008_009_data():
    db = SessionLocal()
    try:
        now = datetime.now()
        # 1月の未来の日付を使用（受託・辞退のテスト用）
        test_date_008 = f"{now.year}/01/27"  # テスト008用
        test_date_009 = f"{now.year}/01/28"  # テスト009用
        
        print(f"📅 テスト008用の日付: {test_date_008}")
        print(f"📅 テスト009用の日付: {test_date_009}\n")
        
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
        # テスト008: 受託テスト用（PENDING状態のオファー）
        # ============================================
        print("📋 テスト008のデータを作成中...")
        
        # 既存のテスト008予約を検索
        existing_reservation_008 = db.query(ReservationModel).filter(
            ReservationModel.reservation_date == test_date_008,
            ReservationModel.office_name.like('%テスト008%')
        ).first()
        
        if existing_reservation_008:
            print(f"⚠️ テスト008の予約 (ID: {existing_reservation_008.id}) が既に存在します。")
            reservation_008 = existing_reservation_008
        else:
            # テスト008の予約を作成
            reservation_008 = ReservationModel(
                company_id=company.id,
                office_name="名古屋支店（テスト008）",
                office_address="愛知県名古屋市中区錦3-15-30",
                reservation_date=test_date_008,
                start_time="09:00",
                end_time="11:00",
                application_deadline=test_date_008,
                max_participants=1,
                total_duration=120,  # 2時間
                service_duration=60,
                break_duration=0,
                slot_count=2,
                time_slots=json.dumps([
                    {
                        "slot": 1,
                        "start_time": "09:00",
                        "end_time": "10:00",
                        "duration": 60,
                        "is_filled": False
                    },
                    {
                        "slot": 2,
                        "start_time": "10:00",
                        "end_time": "11:00",
                        "duration": 60,
                        "is_filled": False
                    }
                ]),
                slots_filled=0,
                hourly_rate=4200,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="テスト008用予約（受託テスト用）",
                employee_names=f"{employee1.name}"
            )
            db.add(reservation_008)
            db.commit()
            db.refresh(reservation_008)
            print(f"✅ テスト008の予約を作成しました (ID: {reservation_008.id})")
        
        # テスト008のアサインメント（PENDING状態）を作成
        existing_assignment_008 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_008.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()
        
        if existing_assignment_008:
            print(f"⚠️ テスト008のアサインメント (ID: {existing_assignment_008.id}) が既に存在します。")
            assignment_008 = existing_assignment_008
        else:
            assignment_008 = ReservationStaff(
                reservation_id=reservation_008.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.PENDING,  # 受託前（PENDING状態）
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="テスト008: 受託テスト用オファー（PENDING状態）"
            )
            db.add(assignment_008)
            db.commit()
            db.refresh(assignment_008)
            print(f"✅ テスト008のアサインメントを作成しました (ID: {assignment_008.id}, ステータス: PENDING)")
        
        # ============================================
        # テスト009: 辞退テスト用（PENDING状態のオファー）
        # ============================================
        print("\n📋 テスト009のデータを作成中...")
        
        # 既存のテスト009予約を検索
        existing_reservation_009 = db.query(ReservationModel).filter(
            ReservationModel.reservation_date == test_date_009,
            ReservationModel.office_name.like('%テスト009%')
        ).first()
        
        if existing_reservation_009:
            print(f"⚠️ テスト009の予約 (ID: {existing_reservation_009.id}) が既に存在します。")
            reservation_009 = existing_reservation_009
        else:
            # テスト009の予約を作成
            reservation_009 = ReservationModel(
                company_id=company.id,
                office_name="神戸支店（テスト009）",
                office_address="兵庫県神戸市中央区三宮町1-1-1",
                reservation_date=test_date_009,
                start_time="13:00",
                end_time="15:00",
                application_deadline=test_date_009,
                max_participants=1,
                total_duration=120,  # 2時間
                service_duration=60,
                break_duration=0,
                slot_count=2,
                time_slots=json.dumps([
                    {
                        "slot": 1,
                        "start_time": "13:00",
                        "end_time": "14:00",
                        "duration": 60,
                        "is_filled": False
                    },
                    {
                        "slot": 2,
                        "start_time": "14:00",
                        "end_time": "15:00",
                        "duration": 60,
                        "is_filled": False
                    }
                ]),
                slots_filled=0,
                hourly_rate=3800,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="テスト009用予約（辞退テスト用）",
                employee_names=f"{employee2.name}"
            )
            db.add(reservation_009)
            db.commit()
            db.refresh(reservation_009)
            print(f"✅ テスト009の予約を作成しました (ID: {reservation_009.id})")
        
        # テスト009のアサインメント（PENDING状態）を作成
        existing_assignment_009 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_009.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()
        
        if existing_assignment_009:
            print(f"⚠️ テスト009のアサインメント (ID: {existing_assignment_009.id}) が既に存在します。")
            assignment_009 = existing_assignment_009
        else:
            assignment_009 = ReservationStaff(
                reservation_id=reservation_009.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.PENDING,  # 受託前（PENDING状態）
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="テスト009: 辞退テスト用オファー（PENDING状態）"
            )
            db.add(assignment_009)
            db.commit()
            db.refresh(assignment_009)
            print(f"✅ テスト009のアサインメントを作成しました (ID: {assignment_009.id}, ステータス: PENDING)")
        
        print("\n🎉 テスト008・009のセットアップ完了！")
        print("\n📋 作成されたデータ:")
        print(f"\n【テスト008 - 受託テスト用】")
        print(f"  予約ID: {reservation_008.id}")
        print(f"  日付: {reservation_008.reservation_date}")
        print(f"  事業所: {reservation_008.office_name}")
        print(f"  時間: {reservation_008.start_time} ~ {reservation_008.end_time}")
        print(f"  時給: {reservation_008.hourly_rate}円")
        print(f"  アサインメントID: {assignment_008.id}")
        print(f"  ステータス: PENDING（受託前）")
        
        print(f"\n【テスト009 - 辞退テスト用】")
        print(f"  予約ID: {reservation_009.id}")
        print(f"  日付: {reservation_009.reservation_date}")
        print(f"  事業所: {reservation_009.office_name}")
        print(f"  時間: {reservation_009.start_time} ~ {reservation_009.end_time}")
        print(f"  時給: {reservation_009.hourly_rate}円")
        print(f"  アサインメントID: {assignment_009.id}")
        print(f"  ステータス: PENDING（受託前）")
        
        print("\n📋 テスト手順:")
        print("\n【スタッフ側テスト（山田花子）】")
        print("1. staff1@example.com でログイン (password: password123)")
        print("2. オファー画面（/staff/jobs/offers）にアクセス")
        print("3. テスト008とテスト009のオファーがPENDING状態で表示されることを確認")
        print("4. サイドバーの「オファー」バッジに2が表示されることを確認")
        print("\n【受託テスト（テスト008）】")
        print("5. テスト008のオファー詳細ページにアクセス")
        print("6. 「受諾する」ボタンをクリック")
        print("7. ステータスがCONFIRMEDに変更されることを確認")
        print("8. サイドバーのバッジが1に減ることを確認")
        print("\n【辞退テスト（テスト009）】")
        print("9. テスト009のオファー詳細ページにアクセス")
        print("10. 「辞退する」ボタンをクリック")
        print("11. 辞退理由を入力して送信")
        print("12. ステータスがREJECTEDに変更されることを確認")
        print("13. サイドバーのバッジが0になり、非表示になることを確認")
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test008_009_data()

