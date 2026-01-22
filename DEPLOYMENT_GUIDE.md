# XサーバーVPSデプロイガイド

## VPS情報
- **IPアドレス**: 162.43.15.173
- **ホスト名**: x162-43-15-173.static.xvps.ne.jp
- **OS**: Ubuntu 22.04
- **スペック**: 4コア / 6GB RAM / 150GB SSD

## 前提条件
- Dockerがインストール済み
- rootまたはsudo権限を持つユーザーでアクセス可能

## デプロイ手順

### 1. VPSへのSSH接続

```bash
ssh root@162.43.15.173
```

初回接続時はフィンガープリントの確認が表示されます。`yes`を入力して続行してください。

### 2. 必要なパッケージのインストール

```bash
# システムのアップデート
sudo apt update && sudo apt upgrade -y

# Docker Composeのインストール（最新版）
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Gitのインストール
sudo apt install -y git

# Nginxのインストール（リバースプロキシ用）
sudo apt install -y nginx

# Certbot（SSL証明書用）
sudo apt install -y certbot python3-certbot-nginx

# ファイアウォール設定
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### 3. プロジェクトのデプロイディレクトリ作成

```bash
# アプリケーション用ディレクトリ作成
sudo mkdir -p /var/www/oriental-synergy
cd /var/www/oriental-synergy
```

### 4. プロジェクトファイルのアップロード

**方法A: Gitリポジトリからクローン（推奨）**

```bash
# Gitリポジトリがある場合
git clone <your-repository-url> .

# または、GitHubにプッシュしてからクローン
# ローカルで: git init && git add . && git commit -m "Initial commit"
```

**方法B: ローカルからSCPでアップロード**

```bash
# ローカル環境で実行
cd /Users/soedakei/madoc_line
scp -r backend/ frontend/ docker-compose.yml database/ root@162.43.15.173:/var/www/oriental-synergy/
```

### 5. 環境変数の設定

```bash
cd /var/www/oriental-synergy

# バックエンド用環境変数
cat > backend/.env << 'EOF'
# Database
DATABASE_URL=sqlite:///./oriental_synergy.db

# Security
SECRET_KEY=<ランダムな64文字以上の文字列>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://162.43.15.173:3000","http://localhost:3000"]

# Server
HOST=0.0.0.0
PORT=8000

# Environment
ENVIRONMENT=production
DEBUG=False
EOF

# フロントエンド用環境変数
cat > frontend/.env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://162.43.15.173:8000/api/v1
EOF
```

**SECRET_KEYの生成:**

```bash
# Pythonでランダムなキーを生成
python3 -c "import secrets; print(secrets.token_urlsafe(64))"
```

### 6. docker-compose.ymlの確認・調整

現在の`docker-compose.yml`を本番環境用に調整します：

```bash
nano docker-compose.yml
```

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: oriental-synergy-backend
    restart: always
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - backend-db:/app/data
    environment:
      - ENVIRONMENT=production
    env_file:
      - ./backend/.env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    container_name: oriental-synergy-frontend
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - ./frontend/.env.local
    depends_on:
      - backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  backend-db:
    driver: local
```

### 7. Dockerコンテナのビルドと起動

```bash
# Dockerイメージのビルド
docker-compose build

# コンテナの起動
docker-compose up -d

# ログの確認
docker-compose logs -f

# 正常に起動しているか確認
docker-compose ps
```

### 8. データベースの初期化

```bash
# バックエンドコンテナに入る
docker-compose exec backend bash

# データベースの初期化
python init_db.py

# サンプルデータの投入（必要に応じて）
python seed_data.py

# コンテナから抜ける
exit
```

### 9. Nginxのリバースプロキシ設定

```bash
# Nginx設定ファイルの作成
sudo nano /etc/nginx/sites-available/oriental-synergy
```

以下の内容を貼り付け：

```nginx
# バックエンドAPI用
upstream backend {
    server 127.0.0.1:8000;
}

# フロントエンド用
upstream frontend {
    server 127.0.0.1:3000;
}

# HTTPサーバー（後でHTTPSにリダイレクト）
server {
    listen 80;
    server_name 162.43.15.173 x162-43-15-173.static.xvps.ne.jp;

    # バックエンドAPI
    location /api/ {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Docsページ（FastAPI）
    location /docs {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Redocページ（FastAPI）
    location /redoc {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # OpenAPIスキーマ
    location /openapi.json {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # フロントエンド
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # ファイルアップロードサイズ制限
    client_max_body_size 10M;
}
```

```bash
# 設定を有効化
sudo ln -s /etc/nginx/sites-available/oriental-synergy /etc/nginx/sites-enabled/

# デフォルト設定を無効化
sudo rm /etc/nginx/sites-enabled/default

# 設定のテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
```

### 10. 動作確認

```bash
# バックエンドAPI確認
curl http://162.43.15.173/api/v1/health

# または、ブラウザでアクセス
# http://162.43.15.173/docs（FastAPI Swagger UI）
# http://162.43.15.173/（Next.jsフロントエンド）
```

### 11. SSL証明書の設定（独自ドメインがある場合）

ドメインのDNS設定でAレコードを`162.43.15.173`に向けた後：

```bash
# Let's EncryptでSSL証明書を取得
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# 自動更新のテスト
sudo certbot renew --dry-run
```

## 運用管理

### ログの確認

```bash
# Dockerコンテナのログ
docker-compose logs -f backend
docker-compose logs -f frontend

# Nginxのログ
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### コンテナの再起動

```bash
cd /var/www/oriental-synergy

# すべてのコンテナを再起動
docker-compose restart

# 特定のコンテナのみ再起動
docker-compose restart backend
docker-compose restart frontend
```

### アプリケーションの更新

```bash
cd /var/www/oriental-synergy

# Gitからプル（Gitを使用している場合）
git pull

# コンテナの再ビルドと再起動
docker-compose down
docker-compose build
docker-compose up -d
```

### バックアップ

```bash
# データベースのバックアップ
docker-compose exec backend bash -c "cp /app/oriental_synergy.db /app/data/backup_$(date +%Y%m%d_%H%M%S).db"

# ボリュームのバックアップ
docker run --rm -v oriental-synergy_backend-db:/data -v $(pwd)/backups:/backup ubuntu tar czf /backup/db-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### システムリソースの監視

```bash
# Dockerコンテナのリソース使用状況
docker stats

# システム全体のリソース
htop  # インストールが必要な場合: sudo apt install htop
```

## トラブルシューティング

### コンテナが起動しない場合

```bash
# ログを確認
docker-compose logs

# コンテナの状態を確認
docker-compose ps

# コンテナを削除して再作成
docker-compose down -v
docker-compose up -d
```

### ポートが使用中の場合

```bash
# ポート使用状況の確認
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# プロセスの停止
sudo kill -9 <PID>
```

### データベースエラーの場合

```bash
# データベースファイルの権限確認
docker-compose exec backend ls -la /app/oriental_synergy.db

# データベースの再初期化
docker-compose exec backend python init_db.py
```

## セキュリティ対策

### 1. ファイアウォール設定の確認

```bash
sudo ufw status
```

### 2. SSH設定の強化

```bash
sudo nano /etc/ssh/sshd_config
```

以下を設定：
```
PermitRootLogin no  # root直接ログイン禁止
PasswordAuthentication no  # パスワード認証無効化（鍵認証のみ）
```

### 3. 定期的なセキュリティアップデート

```bash
# 自動アップデートの設定
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. fail2ban の設定

```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## パフォーマンス最適化

### 1. Nginxのキャッシュ設定

```nginx
# /etc/nginx/sites-available/oriental-synergy に追加
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=my_cache:10m max_size=1g inactive=60m use_temp_path=off;
```

### 2. Docker Composeのリソース制限

```yaml
# docker-compose.yml に追加
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

## 監視とアラート

### 1. Uptime監視

- UptimeRobot（無料）などの外部サービスを使用
- エンドポイント: `http://162.43.15.173/api/v1/health`

### 2. ログ監視

```bash
# cronで定期的にログをチェック
crontab -e

# 1時間ごとにエラーログをチェック
0 * * * * grep -i error /var/log/nginx/error.log | mail -s "Nginx Errors" your-email@example.com
```

## チェックリスト

デプロイ完了前に以下を確認：

- [ ] SSH接続が正常にできる
- [ ] Docker、Docker Composeがインストールされている
- [ ] プロジェクトファイルがアップロードされている
- [ ] 環境変数（.env）が正しく設定されている
- [ ] Dockerコンテナが正常に起動している
- [ ] データベースが初期化されている
- [ ] Nginxが正常に動作している
- [ ] フロントエンドにアクセスできる
- [ ] バックエンドAPIにアクセスできる
- [ ] ファイアウォール設定が適切
- [ ] SSL証明書が設定されている（独自ドメインの場合）
- [ ] バックアップ体制が整っている

## サポート情報

- XサーバーVPSサポート: https://www.xserver.ne.jp/support/
- 緊急時の連絡先: Xサーバーサポートチケット

## 次のステップ

1. 独自ドメインの取得と設定
2. SSL証明書の適用
3. CI/CDパイプラインの構築（GitHub Actions等）
4. 監視・アラートシステムの導入
5. 定期バックアップの自動化





