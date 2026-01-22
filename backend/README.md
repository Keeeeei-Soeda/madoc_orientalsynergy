# Oriental Synergy - Backend API

FastAPIを使用した派遣業務管理システムのバックエンドAPI

## 技術スタック

- **フレームワーク**: FastAPI 0.109+
- **Python**: 3.11+
- **データベース**: PostgreSQL 15
- **ORM**: SQLAlchemy 2.0
- **キャッシュ**: Redis 7
- **認証**: JWT + OAuth2.0

## セットアップ

### 1. 仮想環境の作成と有効化

```bash
# Python仮想環境の作成
python -m venv venv

# 仮想環境の有効化
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate
```

### 2. 依存関係のインストール

```bash
pip install -r requirements.txt
```

### 3. 環境変数の設定

```bash
# .envファイルを作成
cp env.example .env

# .envファイルを編集して、データベースの認証情報などを設定
```

### 4. データベースの準備

#### PostgreSQLの起動（Dockerを使用する場合）

```bash
# docker-composeでPostgreSQLとRedisを起動
docker-compose up -d db redis
```

#### データベーステーブルの作成

```bash
# 初期化スクリプトを実行
python init_db.py
```

### 5. サーバーの起動

```bash
# 開発サーバーを起動
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

サーバーが起動したら、以下のURLでアクセスできます：

- **API ドキュメント (Swagger UI)**: http://localhost:8000/api/docs
- **API ドキュメント (ReDoc)**: http://localhost:8000/api/redoc
- **OpenAPI JSON**: http://localhost:8000/api/openapi.json

## API エンドポイント

### ヘルスチェック

- `GET /` - ルートエンドポイント
- `GET /health` - ヘルスチェック

### ユーザー管理

- `GET /api/v1/users` - ユーザー一覧
- `GET /api/v1/users/{id}` - ユーザー詳細
- `POST /api/v1/users` - ユーザー作成
- `PUT /api/v1/users/{id}` - ユーザー更新
- `DELETE /api/v1/users/{id}` - ユーザー削除

### 企業管理

- `GET /api/v1/companies` - 企業一覧
- `GET /api/v1/companies/{id}` - 企業詳細
- `POST /api/v1/companies` - 企業作成
- `PUT /api/v1/companies/{id}` - 企業更新
- `DELETE /api/v1/companies/{id}` - 企業削除

### スタッフ管理

- `GET /api/v1/staff` - スタッフ一覧（検索・フィルター可能）
- `GET /api/v1/staff/{id}` - スタッフ詳細
- `POST /api/v1/staff` - スタッフ作成
- `PUT /api/v1/staff/{id}` - スタッフ更新
- `DELETE /api/v1/staff/{id}` - スタッフ削除

## プロジェクト構造

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPIアプリケーション本体
│   ├── config.py            # 設定管理
│   ├── database.py          # DB接続設定
│   ├── models/              # SQLAlchemyモデル
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── company.py
│   │   └── staff.py
│   ├── schemas/             # Pydanticスキーマ
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── company.py
│   │   └── staff.py
│   ├── api/                 # APIルーター
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── users.py
│   │       ├── companies.py
│   │       └── staff.py
│   └── core/                # コア機能
│       ├── __init__.py
│       └── security.py      # セキュリティ関連
├── tests/                   # テストコード
├── alembic/                 # DBマイグレーション
├── init_db.py              # DB初期化スクリプト
├── requirements.txt        # Python依存関係
├── env.example             # 環境変数テンプレート
├── Dockerfile              # Dockerイメージ
└── README.md               # このファイル
```

## 開発

### コード品質ツール

```bash
# コードフォーマット
black app/

# インポート整理
isort app/

# Linter
flake8 app/

# 型チェック
mypy app/
```

### テスト

```bash
# 全テストを実行
pytest

# カバレッジ付きで実行
pytest --cov=app --cov-report=html
```

### マイグレーション

```bash
# マイグレーションファイルを作成
alembic revision --autogenerate -m "Add new table"

# マイグレーションを実行
alembic upgrade head

# マイグレーションを戻す
alembic downgrade -1
```

## Docker

### Docker Composeで起動

```bash
# 全サービスを起動
docker-compose up -d

# ログを確認
docker-compose logs -f backend

# 停止
docker-compose down
```

### バックエンドのみをビルド

```bash
docker build -t oriental-synergy-backend .
docker run -p 8000:8000 oriental-synergy-backend
```

## トラブルシューティング

### データベース接続エラー

```bash
# PostgreSQLが起動しているか確認
docker-compose ps

# データベースログを確認
docker-compose logs db

# 接続テスト
psql -h localhost -U postgres -d oriental_synergy
```

### モジュールが見つからないエラー

```bash
# 依存関係を再インストール
pip install -r requirements.txt --force-reinstall
```

## 今後の実装予定

- [ ] JWT認証の実装
- [ ] パスワードハッシュ化
- [ ] ロールベースアクセス制御（RBAC）
- [ ] 予約管理API
- [ ] 勤怠管理API
- [ ] 評価API
- [ ] LINE連携
- [ ] ファイルアップロード
- [ ] メール通知
- [ ] バックグラウンドタスク（Celery）

## ライセンス

Proprietary - Oriental Synergy

## お問い合わせ

開発チーム: dev@orientalsynergy.com

