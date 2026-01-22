#!/usr/bin/env python3
"""
ダミー評価データ作成スクリプト

高橋愛（staff_id=4）に対して1件の評価を作成します。
"""
import os
import sys
from datetime import datetime, date

# プロジェクトのルートディレクトリをパスに追加
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.app.database import SessionLocal
from backend.app.models.rating import Rating as RatingModel
from backend.app.models.staff import Staff as StaffModel
from backend.app.models.company import Company as CompanyModel
from backend.app.models.reservation import Reservation as ReservationModel

def create_dummy_rating():
    db = SessionLocal()
    try:
        # スタッフ情報を取得（高橋愛: staff_id=4）
        staff = db.query(StaffModel).filter(StaffModel.id == 4).first()
        if not staff:
            print("❌ エラー: スタッフID=4（高橋愛）が見つかりません")
            return
        
        print(f"✅ スタッフ情報取得: {staff.name}")
        
        # 企業情報を取得（ID=1の企業）
        company = db.query(CompanyModel).filter(CompanyModel.id == 1).first()
        if not company:
            print("❌ エラー: 企業ID=1が見つかりません")
            return
        
        print(f"✅ 企業情報取得: {company.name}")
        
        # 予約情報を取得（最新の予約）
        reservation = db.query(ReservationModel).filter(
            ReservationModel.company_id == company.id
        ).order_by(ReservationModel.id.desc()).first()
        
        if not reservation:
            print("❌ エラー: 予約が見つかりません")
            return
        
        print(f"✅ 予約情報取得: 予約ID={reservation.id}")
        
        # 既存の評価をチェック
        existing_rating = db.query(RatingModel).filter(
            RatingModel.staff_id == staff.id,
            RatingModel.company_id == company.id
        ).first()
        
        if existing_rating:
            print(f"⚠️  既に評価が存在します (ID: {existing_rating.id})")
            print(f"   平均評価: {existing_rating.average_rating}")
            print(f"   コメント: {existing_rating.comment}")
            
            # 既存の評価を削除するか確認
            response = input("\n既存の評価を削除して新しい評価を作成しますか？ (y/N): ")
            if response.lower() == 'y':
                db.delete(existing_rating)
                db.commit()
                print("✅ 既存の評価を削除しました")
            else:
                print("処理を中断しました")
                return
        
        # 評価項目を設定
        cleanliness = 5      # 清潔感
        responsiveness = 5   # 対応力
        satisfaction = 4     # 満足度
        punctuality = 5      # 時間厳守
        skill = 4            # 技術力
        
        # 平均評価を計算
        average_rating = (cleanliness + responsiveness + satisfaction + punctuality + skill) / 5.0
        
        # 新しい評価を作成
        rating = RatingModel(
            company_id=company.id,
            staff_id=staff.id,
            reservation_id=reservation.id,
            assignment_id=None,  # ダミーデータなので指定なし
            cleanliness=cleanliness,
            responsiveness=responsiveness,
            satisfaction=satisfaction,
            punctuality=punctuality,
            skill=skill,
            average_rating=average_rating,
            rating=average_rating,  # 互換性のため
            comment="いつも丁寧な対応をありがとうございます。お客様からの評価も高く、次回もぜひお願いしたいと思っています。",
            is_public=True,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        
        db.add(rating)
        db.commit()
        db.refresh(rating)
        
        print("\n" + "="*60)
        print("🎉 ダミー評価データを作成しました！")
        print("="*60)
        print(f"評価ID: {rating.id}")
        print(f"スタッフ: {staff.name}")
        print(f"企業: {company.name}")
        print(f"予約ID: {reservation.id}")
        print(f"\n【評価内容】")
        print(f"  清潔感: {cleanliness} ⭐")
        print(f"  対応力: {responsiveness} ⭐")
        print(f"  満足度: {satisfaction} ⭐")
        print(f"  時間厳守: {punctuality} ⭐")
        print(f"  技術力: {skill} ⭐")
        print(f"  平均評価: {average_rating:.1f} ⭐")
        print(f"\nコメント: {rating.comment}")
        print("="*60)
        
        # スタッフの平均評価を更新
        from sqlalchemy import func
        avg_rating = db.query(
            func.avg(RatingModel.average_rating)
        ).filter(
            RatingModel.staff_id == staff.id
        ).scalar()
        
        if avg_rating:
            staff.rating = round(avg_rating, 1)
            db.commit()
            print(f"\n✅ スタッフの平均評価を更新: {staff.rating}")
        
        print("\n【確認方法】")
        print(f"1. スタッフアカウント（staff4@example.com）でログイン")
        print(f"2. 「評価確認」画面を開く")
        print(f"3. 作成した評価が表示されます")
        
    except Exception as e:
        db.rollback()
        print(f"\n❌ エラーが発生しました: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*60)
    print("📊 ダミー評価データ作成スクリプト")
    print("="*60 + "\n")
    
    create_dummy_rating()

