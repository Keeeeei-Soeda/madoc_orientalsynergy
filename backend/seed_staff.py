"""
スタッフのシードデータ作成スクリプト
"""
from app.database import SessionLocal
from app.models import User, Staff
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_staff():
    """スタッフのシードデータを作成"""
    db = SessionLocal()
    
    try:
        print("🌱 スタッフシードデータを作成中...")
        
        # スタッフユーザーとスタッフ情報のデータ
        staff_data = [
            {
                "email": "yamada@staff.com",
                "password": "password123",
                "full_name": "山田花子",
                "phone": "090-1234-5678",
                "address": "大阪府大阪市北区梅田1-1-1",
                "bank_account": "三菱UFJ銀行 梅田支店 普通 1234567",
                "qualifications": "あん摩マッサージ指圧師、鍼灸師",
                "available_days": "月,火,水,木,金",
                "line_id": "yamada_line",
                "rating": 4.8,
                "notes": "経験豊富なベテランスタッフ"
            },
            {
                "email": "sato@staff.com",
                "password": "password123",
                "full_name": "佐藤美咲",
                "phone": "090-2345-6789",
                "address": "大阪府大阪市中央区難波2-2-2",
                "bank_account": "三井住友銀行 難波支店 普通 2345678",
                "qualifications": "あん摩マッサージ指圧師",
                "available_days": "月,水,金",
                "line_id": "sato_line",
                "rating": 4.9,
                "notes": "リンパマッサージが得意"
            },
            {
                "email": "suzuki@staff.com",
                "password": "password123",
                "full_name": "鈴木健太",
                "phone": "090-3456-7890",
                "address": "大阪府大阪市西区新町3-3-3",
                "bank_account": "りそな銀行 新町支店 普通 3456789",
                "qualifications": "あん摩マッサージ指圧師、柔道整復師",
                "available_days": "火,木,土",
                "line_id": "suzuki_line",
                "rating": 4.7,
                "notes": "スポーツマッサージが専門"
            },
            {
                "email": "tanaka@staff.com",
                "password": "password123",
                "full_name": "田中愛",
                "phone": "090-4567-8901",
                "address": "大阪府大阪市天王寺区上本町4-4-4",
                "bank_account": "関西みらい銀行 天王寺支店 普通 4567890",
                "qualifications": "あん摩マッサージ指圧師、アロマセラピスト",
                "available_days": "月,火,水,木,金,土",
                "line_id": "tanaka_line",
                "rating": 4.6,
                "notes": "アロマを使った施術が人気"
            },
            {
                "email": "watanabe@staff.com",
                "password": "password123",
                "full_name": "渡辺麗子",
                "phone": "090-5678-9012",
                "address": "大阪府大阪市阿倍野区阿倍野筋5-5-5",
                "bank_account": "大阪シティ信用金庫 阿倍野支店 普通 5678901",
                "qualifications": "あん摩マッサージ指圧師",
                "available_days": "水,木,金",
                "line_id": "watanabe_line",
                "rating": 4.5,
                "notes": "フットケアが得意"
            },
        ]
        
        created_count = 0
        
        for data in staff_data:
            # ユーザーが既に存在するかチェック
            existing_user = db.query(User).filter(User.email == data["email"]).first()
            
            if existing_user:
                print(f"⚠️  {data['email']} は既に存在します。スキップします。")
                continue
            
            # ユーザーを作成
            user = User(
                email=data["email"],
                password_hash=pwd_context.hash(data["password"]),
                name=data["full_name"],
                role="staff",
                is_active=True
            )
            db.add(user)
            db.flush()  # IDを取得するためにflush
            
            # スタッフ情報を作成
            staff = Staff(
                user_id=user.id,
                name=data["full_name"],
                phone=data["phone"],
                address=data["address"],
                bank_account=data["bank_account"],
                qualifications=data["qualifications"],
                available_days=data["available_days"],
                line_id=data["line_id"],
                is_available=True,
                rating=data["rating"],
                notes=data["notes"]
            )
            db.add(staff)
            
            created_count += 1
            print(f"✅ {data['full_name']} を作成しました")
        
        db.commit()
        
        print(f"\n🎉 {created_count}人のスタッフを作成しました！")
        print("\n📋 ログイン情報:")
        print("=" * 50)
        for data in staff_data:
            print(f"メールアドレス: {data['email']}")
            print(f"パスワード: {data['password']}")
            print(f"名前: {data['full_name']}")
            print("-" * 50)
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_staff()

