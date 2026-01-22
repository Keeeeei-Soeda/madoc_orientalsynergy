"""
初期データ投入スクリプト

Usage:
    python seed_data.py
"""
from app.database import SessionLocal
from app.models import User, Company, Staff, Reservation, Attendance
from app.models.user import UserRole
from app.models.reservation import ReservationStatus
from app.core.security import get_password_hash
from app.utils.time_slot_calculator import calculate_time_slots, calculate_total_minutes
from datetime import datetime, timedelta


def seed_data():
    """初期データを投入"""
    db = SessionLocal()
    
    try:
        print("🌱 初期データを投入中...")
        
        # デフォルトパスワード
        default_password = get_password_hash("password123")
        
        # 管理者ユーザーを作成
        admin_user = User(
            email="admin@orientalsynergy.com",
            password_hash=default_password,
            name="システム管理者",
            role=UserRole.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        db.flush()  # IDを取得するため
        
        # 企業ユーザーを作成
        company_user1 = User(
            email="company1@example.com",
            password_hash=default_password,
            name="株式会社A 担当者",
            role=UserRole.COMPANY,
            is_active=True
        )
        db.add(company_user1)
        db.flush()
        
        company_user2 = User(
            email="company2@example.com",
            password_hash=default_password,
            name="株式会社B 担当者",
            role=UserRole.COMPANY,
            is_active=True
        )
        db.add(company_user2)
        db.flush()
        
        # スタッフユーザーを作成（10名）
        staff_users = []
        for i in range(1, 11):
            staff_user = User(
                email=f"staff{i}@example.com",
                password_hash=default_password,
                name=f"スタッフ{i}",
                role=UserRole.STAFF,
                is_active=True
            )
            db.add(staff_user)
            db.flush()
            staff_users.append(staff_user)
        
        print(f"✅ ユーザー {1 + 2 + 10}名を作成しました")
        
        # 企業情報を作成（新しい項目を含む）
        # 例1: 2025/12/15契約、6ヶ月プラン → 2026/01/01〜2026/06/30（契約期間内）
        company1 = Company(
            user_id=company_user1.id,
            name="株式会社A",
            office_name="梅田営業所",
            industry="建設業",
            plan="6ヶ月",
            contract_start_date="2025/12/15",
            contract_end_date="2026/06/30",
            usage_count=20,
            representative="田中一郎",
            address="大阪府大阪市北区梅田1-1-1",
            phone="06-0000-0001",
            email="info@company-a.jp",
            contact_person="担当 太郎",
            contact_phone="090-0000-0001",
            contact_email="tantou@company-a.jp",
            notes="定期契約企業（2025年12月15日契約、実際の契約期間は2026年1月1日〜6月30日）"
        )
        db.add(company1)
        
        # 例2: 2025/12/20契約、1年プラン → 2026/01/01〜2027/01/31（契約期間内）
        company2 = Company(
            user_id=company_user2.id,
            name="株式会社B",
            office_name="難波事業所",
            industry="製造業",
            plan="1年",
            contract_start_date="2025/12/20",
            contract_end_date="2027/01/31",
            usage_count=15,
            representative="佐藤二郎",
            address="大阪府大阪市中央区難波2-2-2",
            phone="06-0000-0002",
            email="info@company-b.jp",
            contact_person="担当 花子",
            contact_phone="090-0000-0002",
            contact_email="tantou@company-b.jp",
            notes="新規契約企業（2025年12月20日契約、実際の契約期間は2026年1月1日〜2027年1月31日）"
        )
        db.add(company2)
        
        print(f"✅ 企業 2社を作成しました")
        
        # スタッフ情報を作成（10名）
        staff_names = [
            "山田花子", "佐藤美咲", "鈴木健太", "高橋愛", "田中太郎",
            "中村優子", "渡辺健一", "伊藤さくら", "松本健二", "林美香"
        ]
        qualifications = ["あん摩マッサージ指圧師", "鍼灸師", "柔道整復師"]
        districts = ['北区', '中央区', '西区', '浪速区', '福島区', '天王寺区', '東成区', '生野区', '住吉区', '東住吉区']
        
        for i, (user, name) in enumerate(zip(staff_users, staff_names)):
            staff = Staff(
                user_id=user.id,
                name=name,
                phone=f"090-1234-{i+1:04d}",
                address=f"大阪府大阪市{districts[i]}",
                bank_account=f"三菱UFJ銀行 梅田支店 普通 123456{i+1}",
                qualifications=qualifications[i % 3],
                available_days="月,火,水,木,金",
                line_id=f"line_staff_{i+1}",
                is_available=True,
                rating=5 if i < 3 else 4 if i < 7 else 3,
                notes=f"経験{i+1}年"
            )
            db.add(staff)
        
        print(f"✅ スタッフ {len(staff_names)}名を作成しました")
        
        db.flush()  # IDを取得するため
        
        # 予約情報を作成
        today = datetime.now()
        reservations = []
        
        # 枠情報付き予約データを10個作成
        reservation_templates = [
            # 企業A向け（5件）
            {
                "company_id": company1.id,
                "office_name": "本社オフィス",
                "office_address": "大阪府大阪市北区梅田1-1-1",
                "reservation_date": (today + timedelta(days=3)).strftime("%Y/%m/%d"),
                "start_time": "10:00",
                "end_time": "12:00",
                "service_duration": 30,
                "break_duration": 10,
                "hourly_rate": 1500,
                "status": ReservationStatus.RECRUITING,
                "notes": "定期訪問",
            },
            {
                "company_id": company1.id,
                "office_name": "本社オフィス",
                "office_address": "大阪府大阪市北区梅田1-1-1",
                "reservation_date": (today + timedelta(days=5)).strftime("%Y/%m/%d"),
                "start_time": "14:00",
                "end_time": "16:30",
                "service_duration": 40,
                "break_duration": 15,
                "hourly_rate": 1800,
                "status": ReservationStatus.RECRUITING,
                "notes": "長めの施術",
            },
            {
                "company_id": company1.id,
                "office_name": "梅田支店",
                "office_address": "大阪府大阪市北区中津1-1-1",
                "reservation_date": (today + timedelta(days=7)).strftime("%Y/%m/%d"),
                "start_time": "09:00",
                "end_time": "11:00",
                "service_duration": 20,
                "break_duration": 5,
                "hourly_rate": 1200,
                "status": ReservationStatus.RECRUITING,
                "notes": "短時間施術",
            },
            {
                "company_id": company1.id,
                "office_name": "本社オフィス",
                "office_address": "大阪府大阪市北区梅田1-1-1",
                "reservation_date": (today + timedelta(days=10)).strftime("%Y/%m/%d"),
                "start_time": "13:00",
                "end_time": "17:00",
                "service_duration": 60,
                "break_duration": 10,
                "hourly_rate": 2000,
                "status": ReservationStatus.RECRUITING,
                "notes": "長時間コース",
            },
            {
                "company_id": company1.id,
                "office_name": "本社オフィス",
                "office_address": "大阪府大阪市北区梅田1-1-1",
                "reservation_date": (today + timedelta(days=14)).strftime("%Y/%m/%d"),
                "start_time": "10:00",
                "end_time": "11:30",
                "service_duration": 30,
                "break_duration": 0,
                "hourly_rate": 1500,
                "status": ReservationStatus.RECRUITING,
                "notes": "休憩なし連続",
            },
            # 企業B向け（5件）
            {
                "company_id": company2.id,
                "office_name": "大阪工場",
                "office_address": "大阪府大阪市中央区難波2-2-2",
                "reservation_date": (today + timedelta(days=4)).strftime("%Y/%m/%d"),
                "start_time": "09:00",
                "end_time": "11:30",
                "service_duration": 30,
                "break_duration": 10,
                "hourly_rate": 1600,
                "status": ReservationStatus.RECRUITING,
                "notes": "工場スタッフ向け",
            },
            {
                "company_id": company2.id,
                "office_name": "大阪工場",
                "office_address": "大阪府大阪市中央区難波2-2-2",
                "reservation_date": (today + timedelta(days=6)).strftime("%Y/%m/%d"),
                "start_time": "14:00",
                "end_time": "17:00",
                "service_duration": 45,
                "break_duration": 15,
                "hourly_rate": 1900,
                "status": ReservationStatus.RECRUITING,
                "notes": "じっくりコース",
            },
            {
                "company_id": company2.id,
                "office_name": "難波事業所",
                "office_address": "大阪府大阪市浪速区難波中2-10-70",
                "reservation_date": (today + timedelta(days=8)).strftime("%Y/%m/%d"),
                "start_time": "10:00",
                "end_time": "12:00",
                "service_duration": 25,
                "break_duration": 10,
                "hourly_rate": 1400,
                "status": ReservationStatus.RECRUITING,
                "notes": "オフィススタッフ向け",
            },
            {
                "company_id": company2.id,
                "office_name": "難波事業所",
                "office_address": "大阪府大阪市浪速区難波中2-10-70",
                "reservation_date": (today + timedelta(days=12)).strftime("%Y/%m/%d"),
                "start_time": "15:00",
                "end_time": "18:00",
                "service_duration": 50,
                "break_duration": 10,
                "hourly_rate": 1850,
                "status": ReservationStatus.RECRUITING,
                "notes": "夕方コース",
            },
            {
                "company_id": company2.id,
                "office_name": "大阪工場",
                "office_address": "大阪府大阪市中央区難波2-2-2",
                "reservation_date": (today + timedelta(days=15)).strftime("%Y/%m/%d"),
                "start_time": "09:30",
                "end_time": "11:30",
                "service_duration": 30,
                "break_duration": 5,
                "hourly_rate": 1550,
                "status": ReservationStatus.RECRUITING,
                "notes": "朝イチ枠",
            },
        ]
        
        # 各予約テンプレートから実際の予約を作成
        for i, template in enumerate(reservation_templates, 1):
            # 時間枠を計算
            slot_result = calculate_time_slots(
                template["start_time"],
                template["end_time"],
                template["service_duration"],
                template["break_duration"]
            )
            
            if not slot_result['valid']:
                print(f"⚠️  予約{i}の時間枠計算エラー: {slot_result['error']}")
                continue
            
            # 全体時間を計算
            total_duration = calculate_total_minutes(
                template["start_time"],
                template["end_time"]
            )
            
            # 募集期限を設定（予約日の2日前）
            reservation_date_obj = datetime.strptime(template["reservation_date"], "%Y/%m/%d")
            application_deadline = (reservation_date_obj - timedelta(days=2)).strftime("%Y/%m/%d 23:59")
            
            # 予約を作成
            reservation = Reservation(
                company_id=template["company_id"],
                office_name=template["office_name"],
                office_address=template["office_address"],
                reservation_date=template["reservation_date"],
                start_time=template["start_time"],
                end_time=template["end_time"],
                application_deadline=application_deadline,
                max_participants=slot_result['slot_count'],  # 枠数に応じて自動設定
            staff_names="",
                employee_names="",
                # 時間枠管理フィールド
                total_duration=total_duration,
                service_duration=template["service_duration"],
                break_duration=template["break_duration"],
                slot_count=slot_result['slot_count'],
                time_slots=slot_result['slots'],
                slots_filled=0,
                hourly_rate=template["hourly_rate"],
                status=template["status"],
                notes=template["notes"],
                requirements=f"{slot_result['slot_count']}枠募集"
            )
            db.add(reservation)
            reservations.append(reservation)
            
            print(f"  予約{i}: {template['office_name']} - {slot_result['slot_count']}枠 ({template['service_duration']}分/枠, 時給{template['hourly_rate']}円)")
        
        print(f"✅ 予約 {len(reservations)}件を作成しました")
        
        db.flush()  # IDを取得するため
        
        # 勤怠情報を作成（過去の予約に対して）
        # TODO: 新しい予約システムに合わせて勤怠データを作成
        # attendance1 = Attendance(
        #     staff_id=1,  # 山田花子
        #     reservation_id=reservations[0].id,
        #     work_date=(today - timedelta(days=7)).strftime("%Y/%m/%d"),
        #     clock_in_time=datetime.now() - timedelta(days=7, hours=10),
        #     clock_out_time=datetime.now() - timedelta(days=7, hours=8),
        #     break_minutes=0,
        #     work_hours=120,  # 2時間 = 120分
        #     location_in="大阪府大阪市北区梅田1-1-1",
        #     location_out="大阪府大阪市北区梅田1-1-1",
        #     is_approved=True,
        #     approved_by=admin_user.id,
        #     approved_at=datetime.now() - timedelta(days=6)
        # )
        # db.add(attendance1)
        
        # print(f"✅ 勤怠 0件を作成しました（後で実装）")
        
        # コミット
        db.commit()
        
        print("\n🎉 初期データの投入が完了しました！")
        print("\n📊 作成されたデータ:")
        print(f"  - 管理者: 1名")
        print(f"  - 企業ユーザー: 2名")
        print(f"  - スタッフユーザー: 5名")
        print(f"  - 企業情報: 2社")
        print(f"  - スタッフ情報: 5名")
        print(f"  - 予約: {len(reservations)}件（枠情報付き）")
        print(f"  - 勤怠: 0件")
        print("\n🔑 ログイン情報:")
        print(f"  管理者: admin@orientalsynergy.com / password123")
        print(f"  企業1: company1@example.com / password123")
        print(f"  企業2: company2@example.com / password123")
        print(f"  スタッフ1-5: staff1@example.com ~ staff5@example.com / password123")
        print("\n📅 予約詳細:")
        for res in reservations:
            print(f"  - {res.office_name}: {res.slot_count}枠 (施術{res.service_duration}分, 時給{res.hourly_rate}円)")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()




