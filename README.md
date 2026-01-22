# Oriental Synergy - 派遣業務管理システム

オリエンタルシナジーの派遣スタッフと企業をつなぐ業務管理システムです。

## 🎯 システム概要

本システムは、派遣業務における以下の機能を提供します：

- **予約管理**: 企業からの予約作成・編集・削除
- **スタッフ管理**: スタッフ情報の管理とアサイン
- **オファー管理**: スタッフへの業務オファーと承認
- **シフト管理**: スタッフの確定シフトと予定管理
- **勤怠管理**: 出勤・退勤打刻と完了報告
- **評価機能**: 企業によるスタッフ評価

---

## 🏗️ 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: Bootstrap 5
- **State Management**: React Hooks (useState, useEffect, useContext)
- **Authentication**: JWT

### バックエンド
- **Framework**: FastAPI
- **Language**: Python 3.9+
- **ORM**: SQLAlchemy
- **Database**: SQLite (開発環境) / PostgreSQL (本番環境)
- **Validation**: Pydantic
- **Authentication**: JWT

---

## 📦 セットアップ

### 前提条件

- Node.js 18.x 以上
- Python 3.9 以上
- npm または yarn

### バックエンドのセットアップ

```bash
# プロジェクトディレクトリに移動
cd backend

# 仮想環境を作成
python3 -m venv venv

# 仮想環境を有効化
source venv/bin/activate  # macOS/Linux
# または
venv\Scripts\activate  # Windows

# 依存関係をインストール
pip install -r requirements.txt

# データベースを初期化（初回のみ）
python init_db.py

# サーバーを起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

バックエンドは `http://localhost:8000` で起動します。

### フロントエンドのセットアップ

```bash
# プロジェクトディレクトリに移動
cd frontend

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

フロントエンドは `http://localhost:3000` で起動します。

---

## 👥 ログイン情報

### 管理者
- **Email**: `admin@example.com`
- **Password**: `password123`

### 企業
- **Email**: `company@example.com`
- **Password**: `password123`

### スタッフ
- **Email**: `staff1@example.com` (山田花子)
- **Password**: `password123`

- **Email**: `staff3@example.com` (鈴木健太)
- **Password**: `password123`

- **Email**: `staff4@example.com` (高橋愛)
- **Password**: `password123`

---

## 🗂️ プロジェクト構造

```
madoc_line/
├── backend/                 # バックエンド
│   ├── app/
│   │   ├── api/            # APIエンドポイント
│   │   │   └── v1/
│   │   ├── models/         # データベースモデル
│   │   ├── schemas/        # Pydanticスキーマ
│   │   ├── main.py         # FastAPIアプリケーション
│   │   ├── database.py     # DB設定
│   │   └── config.py       # 設定
│   ├── venv/               # 仮想環境
│   ├── requirements.txt    # Python依存関係
│   └── *.py                # セットアップスクリプト
│
├── frontend/               # フロントエンド
│   ├── src/
│   │   ├── app/           # Next.js App Router
│   │   │   ├── admin/     # 管理者画面
│   │   │   ├── company/   # 企業画面
│   │   │   └── staff/     # スタッフ画面
│   │   ├── components/    # Reactコンポーネント
│   │   ├── lib/           # ユーティリティ
│   │   └── styles/        # スタイル
│   ├── public/            # 静的ファイル
│   ├── package.json       # Node依存関係
│   └── tsconfig.json      # TypeScript設定
│
├── .gitignore
├── README.md              # このファイル
└── CHANGELOG_2026-01-22.md  # 変更履歴
```

---

## 🔑 主要機能

### 管理者機能
- ✅ 予約一覧・詳細表示
- ✅ 予約作成・編集・削除
- ✅ スタッフ管理
- ✅ 従業員管理
- ✅ スタッフへのオファー送信（複数枠対応）
- ✅ 募集人数の検証

### 企業機能
- ✅ 予約一覧・詳細表示
- ✅ 予約作成・編集
- ✅ 確定スタッフの確認
- ✅ スタッフ評価（5段階評価 + コメント）

### スタッフ機能
- ✅ ダッシュボード
- ✅ マイページ（プロフィール表示）
- ✅ オファー一覧・詳細表示
- ✅ オファー承諾・辞退
- ✅ シフト管理（タブフィルター）
- ✅ 勤怠管理（出勤・退勤打刻、完了報告）
- ✅ 評価確認

---

## 🛠️ API エンドポイント

### 認証
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/refresh` - トークン更新

### 予約
- `GET /api/v1/reservations` - 予約一覧
- `GET /api/v1/reservations/{id}` - 予約詳細
- `POST /api/v1/reservations` - 予約作成
- `PUT /api/v1/reservations/{id}` - 予約更新
- `DELETE /api/v1/reservations/{id}` - 予約削除

### アサインメント
- `GET /api/v1/assignments/my` - 自分のアサインメント一覧
- `GET /api/v1/assignments/{id}` - アサインメント詳細
- `POST /api/v1/assignments` - アサインメント作成
- `PUT /api/v1/assignments/{id}` - アサインメント更新
- `DELETE /api/v1/assignments/{id}` - アサインメント削除

### 評価
- `GET /api/v1/ratings` - 評価一覧
- `POST /api/v1/ratings` - 評価作成
- `GET /api/v1/staff/{staff_id}/rating-summary` - スタッフ評価サマリー

### 勤怠
- `POST /api/v1/attendance/check-in` - 出勤打刻
- `POST /api/v1/attendance/check-out` - 退勤打刻
- `POST /api/v1/attendance/complete` - 完了報告

APIドキュメント: `http://localhost:8000/api/docs`

---

## 🧪 テスト

### 単体テスト
```bash
# バックエンド
cd backend
pytest

# フロントエンド
cd frontend
npm test
```

### E2Eテスト
詳細は `TESTING_GUIDE.md` を参照してください。

---

## 📝 変更履歴

変更履歴の詳細は [CHANGELOG_2026-01-22.md](./CHANGELOG_2026-01-22.md) を参照してください。

---

## 🤝 貢献

プロジェクトへの貢献を歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

---

## 📄 ライセンス

このプロジェクトは社内専用です。

---

## 📞 お問い合わせ

質問や問題がある場合は、開発チームまでお問い合わせください。

---

**バージョン**: v1.0.0  
**最終更新**: 2026年1月22日
