"""
企業の社員のシードデータ作成スクリプト
"""
from app.database import SessionLocal
from app.models import Company, Employee

def seed_employees():
    """企業の社員のシードデータを作成"""
    db = SessionLocal()
    
    try:
        print("🌱 社員シードデータを作成中...")
        
        # 企業を取得（最初の企業に社員を追加）
        company = db.query(Company).first()
        
        if not company:
            print("❌ 企業が見つかりません。先に企業データを作成してください。")
            return
        
        print(f"✅ 企業「{company.name}」に社員を追加します")
        
        # 社員データ
        employees_data = [
            {
                "name": "田中一郎",
                "department": "総務部",
                "position": "部長",
                "email": "tanaka@company.com",
                "phone": "06-1111-2222",
                "line_id": "tanaka_line",
                "line_linked": True,
                "notes": "総務部の責任者"
            },
            {
                "name": "佐藤二朗",
                "department": "人事部",
                "position": "課長",
                "email": "sato@company.com",
                "phone": "06-2222-3333",
                "line_id": "sato_line",
                "line_linked": True,
                "notes": "人事採用担当"
            },
            {
                "name": "加藤三郎",
                "department": "営業部",
                "position": "主任",
                "email": "kato@company.com",
                "phone": "06-3333-4444",
                "line_id": "",
                "line_linked": False,
                "notes": "営業担当"
            },
            {
                "name": "鈴木四郎",
                "department": "総務部",
                "position": "一般",
                "email": "suzuki@company.com",
                "phone": "06-4444-5555",
                "line_id": "suzuki_line",
                "line_linked": True,
                "notes": ""
            },
            {
                "name": "高橋五郎",
                "department": "経理部",
                "position": "課長",
                "email": "takahashi@company.com",
                "phone": "06-5555-6666",
                "line_id": "takahashi_line",
                "line_linked": True,
                "notes": "経理責任者"
            },
            {
                "name": "伊藤六子",
                "department": "営業部",
                "position": "一般",
                "email": "ito@company.com",
                "phone": "06-6666-7777",
                "line_id": "",
                "line_linked": False,
                "notes": "新入社員"
            },
            {
                "name": "山本七美",
                "department": "人事部",
                "position": "一般",
                "email": "yamamoto@company.com",
                "phone": "06-7777-8888",
                "line_id": "yamamoto_line",
                "line_linked": True,
                "notes": "人事アシスタント"
            },
        ]
        
        created_count = 0
        
        for data in employees_data:
            # 既に存在するかチェック
            existing = db.query(Employee).filter(
                Employee.company_id == company.id,
                Employee.name == data["name"]
            ).first()
            
            if existing:
                print(f"⚠️  {data['name']} は既に存在します。スキップします。")
                continue
            
            # 社員を作成
            employee = Employee(
                company_id=company.id,
                name=data["name"],
                department=data["department"],
                position=data["position"],
                email=data["email"],
                phone=data["phone"],
                line_id=data["line_id"] if data["line_id"] else None,
                line_linked=data["line_linked"],
                is_active=True,
                notes=data["notes"]
            )
            db.add(employee)
            
            created_count += 1
            print(f"✅ {data['name']} ({data['department']} - {data['position']}) を作成しました")
        
        db.commit()
        
        print(f"\n🎉 {created_count}人の社員を作成しました！")
        print(f"企業: {company.name} (ID: {company.id})")
        
    except Exception as e:
        db.rollback()
        print(f"❌ エラーが発生しました: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_employees()

