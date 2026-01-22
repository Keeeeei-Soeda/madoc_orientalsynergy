"""
追加スタッフデータ投入スクリプト（既存データを保持）

Usage:
    python seed_staff_additional.py
"""
from app.database import SessionLocal
from app.models import User, Staff
from app.models.user import UserRole
from app.core.security import get_password_hash

def seed_additional_staff():
    """追加スタッフデータを投入（既存データを削除せず）"""
    db = SessionLocal()
    
    try:
        print("🌱 追加スタッフデータを投入中...")
        
        # 既存のスタッフユーザー数を確認
        existing_staff_count = db.query(User).filter(User.role == UserRole.STAFF).count()
        print(f"📊 既存のスタッフユーザー数: {existing_staff_count}名")
        
        # 追加する必要があるスタッフ数
        target_count = 10
        additional_count = target_count - existing_staff_count
        
        if additional_count <= 0:
            print(f"✅ 既に{existing_staff_count}名のスタッフが存在します。追加不要です。")
            return
        
        print(f"➕ {additional_count}名のスタッフを追加します...")
        
        # デフォルトパスワード
        default_password = get_password_hash("password123")
        
        # スタッフ名リスト（既存の名前を確認してから追加）
        all_staff_names = [
            "山田花子", "佐藤美咲", "鈴木健太", "高橋愛", "田中太郎",
            "中村優子", "渡辺健一", "伊藤さくら", "松本健二", "林美香"
        ]
        
        # 既存のスタッフ名を取得
        existing_staff = db.query(Staff).all()
        existing_names = {staff.name for staff in existing_staff}
        
        # 追加するスタッフ名を決定
        names_to_add = [name for name in all_staff_names if name not in existing_names][:additional_count]
        
        if not names_to_add:
            print("⚠️ 追加するスタッフ名がありません。")
            return
        
        # スタッフユーザーとスタッフ情報を作成
        staff_users = []
        qualifications = ["あん摩マッサージ指圧師", "鍼灸師", "柔道整復師"]
        districts = ['北区', '中央区', '西区', '浪速区', '福島区', '天王寺区', '東成区', '生野区', '住吉区', '東住吉区']
        
        start_index = existing_staff_count + 1
        
        for i, name in enumerate(names_to_add):
            # ユーザーを作成
            staff_user = User(
                email=f"staff{start_index + i}@example.com",
                password_hash=default_password,
                name=name,
                role=UserRole.STAFF,
                is_active=True
            )
            db.add(staff_user)
            db.flush()
            staff_users.append(staff_user)
            
            # スタッフ情報を作成
            staff_index = start_index + i - 1  # 配列インデックス用
            staff = Staff(
                user_id=staff_user.id,
                name=name,
                phone=f"090-1234-{start_index + i:04d}",
                address=f"大阪府大阪市{districts[staff_index % len(districts)]}",
                bank_account=f"三菱UFJ銀行 梅田支店 普通 123456{start_index + i}",
                qualifications=qualifications[staff_index % len(qualifications)],
                available_days="月,火,水,木,金",
                line_id=f"line_staff_{start_index + i}",
                is_available=True,
                rating=5 if staff_index < 3 else 4 if staff_index < 7 else 3,
                notes=f"経験{start_index + i}年"
            )
            db.add(staff)
            print(f"  ✅ {name} ({staff.qualifications}) を作成しました")
        
        db.commit()
        print(f"\n🎉 {len(names_to_add)}名のスタッフを追加しました！")
        print(f"📊 合計スタッフ数: {existing_staff_count + len(names_to_add)}名")
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_additional_staff()

