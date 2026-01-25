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

def create_test010_011_data():
    db = SessionLocal()
    try:
        now = datetime.now()
        # 1月の未来の日付を使用（受託・辞退のテスト用）
        test_date_010 = f"{now.year}/01/29"  # テスト010用
        test_date_011 = f"{now.year}/01/30"  # テスト011用
        
        print(f"📅 テスト010用の日付: {test_date_010}")
        print(f"📅 テスト011用の日付: {test_date_011}\n")
        
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
        # テスト010: 受託テスト用（PENDING状態のオファー）
        # ============================================
        print("📋 テスト010のデータを作成中...")
        
        # 既存のテスト010予約を検索
        existing_reservation_010 = db.query(ReservationModel).filter(
            ReservationModel.reservation_date == test_date_010,
            ReservationModel.office_name.like('%テスト010%')
        ).first()
        
        if existing_reservation_010:
            print(f"⚠️ テスト010の予約 (ID: {existing_reservation_010.id}) が既に存在します。")
            reservation_010 = existing_reservation_010
        else:
            # テスト010の予約を作成
            reservation_010 = ReservationModel(
                company_id=company.id,
                office_name="横浜支店（テスト010）",
                office_address="神奈川県横浜市西区みなとみらい2-2-1",
                reservation_date=test_date_010,
                start_time="10:00",
                end_time="12:00",
                application_deadline=test_date_010,
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
                hourly_rate=4500,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="テスト010用予約（受託テスト用）",
                employee_names=f"{employee1.name}"
            )
            db.add(reservation_010)
            db.commit()
            db.refresh(reservation_010)
            print(f"✅ テスト010の予約を作成しました (ID: {reservation_010.id})")
        
        # テスト010のアサインメント（PENDING状態）を作成
        existing_assignment_010 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_010.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()
        
        if existing_assignment_010:
            print(f"⚠️ テスト010のアサインメント (ID: {existing_assignment_010.id}) が既に存在します。")
            assignment_010 = existing_assignment_010
        else:
            assignment_010 = ReservationStaff(
                reservation_id=reservation_010.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.PENDING,  # 受託前（PENDING状態）
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="テスト010: 受託テスト用オファー（PENDING状態）"
            )
            db.add(assignment_010)
            db.commit()
            db.refresh(assignment_010)
            print(f"✅ テスト010のアサインメントを作成しました (ID: {assignment_010.id}, ステータス: PENDING)")
        
        # ============================================
        # テスト011: 辞退テスト用（PENDING状態のオファー）
        # ============================================
        print("\n📋 テスト011のデータを作成中...")
        
        # 既存のテスト011予約を検索
        existing_reservation_011 = db.query(ReservationModel).filter(
            ReservationModel.reservation_date == test_date_011,
            ReservationModel.office_name.like('%テスト011%')
        ).first()
        
        if existing_reservation_011:
            print(f"⚠️ テスト011の予約 (ID: {existing_reservation_011.id}) が既に存在します。")
            reservation_011 = existing_reservation_011
        else:
            # テスト011の予約を作成
            reservation_011 = ReservationModel(
                company_id=company.id,
                office_name="京都支店（テスト011）",
                office_address="京都府京都市下京区烏丸通四条下ル",
                reservation_date=test_date_011,
                start_time="14:00",
                end_time="16:00",
                application_deadline=test_date_011,
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
                hourly_rate=4000,
                status=ReservationStatus.RECRUITING,
                notes="",
                requirements="テスト011用予約（辞退テスト用）",
                employee_names=f"{employee2.name}"
            )
            db.add(reservation_011)
            db.commit()
            db.refresh(reservation_011)
            print(f"✅ テスト011の予約を作成しました (ID: {reservation_011.id})")
        
        # テスト011のアサインメント（PENDING状態）を作成
        existing_assignment_011 = db.query(ReservationStaff).filter(
            ReservationStaff.reservation_id == reservation_011.id,
            ReservationStaff.staff_id == staff1.id,
            ReservationStaff.slot_number == 1
        ).first()
        
        if existing_assignment_011:
            print(f"⚠️ テスト011のアサインメント (ID: {existing_assignment_011.id}) が既に存在します。")
            assignment_011 = existing_assignment_011
        else:
            assignment_011 = ReservationStaff(
                reservation_id=reservation_011.id,
                staff_id=staff1.id,
                slot_number=1,
                status=AssignmentStatus.PENDING,  # 受託前（PENDING状態）
                assigned_by=1,  # 管理者ID
                assigned_at=datetime.now(),
                notes="テスト011: 辞退テスト用オファー（PENDING状態）"
            )
            db.add(assignment_011)
            db.commit()
            db.refresh(assignment_011)
            print(f"✅ テスト011のアサインメントを作成しました (ID: {assignment_011.id}, ステータス: PENDING)")
        
        print("\n🎉 テスト010・011のセットアップ完了！")
        print("\n📋 作成されたデータ:")
        print(f"\n【テスト010 - 受託テスト用】")
        print(f"  予約ID: {reservation_010.id}")
        print(f"  日付: {reservation_010.reservation_date}")
        print(f"  事業所: {reservation_010.office_name}")
        print(f"  時間: {reservation_010.start_time} ~ {reservation_010.end_time}")
        print(f"  時給: {reservation_010.hourly_rate}円")
        print(f"  アサインメントID: {assignment_010.id}")
        print(f"  ステータス: PENDING（受託前）")
        
        print(f"\n【テスト011 - 辞退テスト用】")
        print(f"  予約ID: {reservation_011.id}")
        print(f"  日付: {reservation_011.reservation_date}")
        print(f"  事業所: {reservation_011.office_name}")
        print(f"  時間: {reservation_011.start_time} ~ {reservation_011.end_time}")
        print(f"  時給: {reservation_011.hourly_rate}円")
        print(f"  アサインメントID: {assignment_011.id}")
        print(f"  ステータス: PENDING（受託前）")
        
        print("\n📋 テスト手順:")
        print("\n【スタッフ側テスト（山田花子）】")
        print("1. staff1@example.com でログイン (password: password123)")
        print("2. オファー画面（/staff/jobs/offers）にアクセス")
        print("3. テスト010とテスト011のオファーがPENDING状態で表示されることを確認")
        print("4. サイドバーの「オファー」バッジに2が表示されることを確認")
        print("\n【受託テスト（テスト010）】")
        print("5. テスト010のオファー詳細ページにアクセス")
        print("6. 「受諾する」ボタンをクリック")
        print("7. 確認ダイアログで「OK」を選択")
        print("8. ページが再読み込みされ、ステータスがCONFIRMEDに変更されることを確認")
        print("9. サイドバーのバッジが1に減ることを確認")
        print("\n【辞退テスト（テスト011）】")
        print("10. テスト011のオファー詳細ページにアクセス")
        print("11. 「辞退する」ボタンをクリック")
        print("12. 確認ダイアログで「OK」を選択")
        print("13. 辞退理由を入力（任意）して送信")
        print("14. ページが再読み込みされ、ステータスがREJECTEDに変更されることを確認")
        print("15. サイドバーのバッジが0になり、非表示になることを確認")
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    create_test010_011_data()

