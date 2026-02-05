# Oriental Synergy クイックデプロイガイド

XサーバーVPSへのデプロイを30分で完了させるためのガイドです。

## 📋 事前準備チェックリスト

- [ ] XサーバーVPSの契約完了
- [ ] SSH接続情報の取得（IPアドレス: 162.43.15.173）
- [ ] rootパスワードまたはSSH秘密鍵の取得
- [ ] （オプション）独自ドメインの準備

## 🚀 デプロイ手順（30分）

### ステップ1: VPSへのSSH接続 (2分)

```bash
ssh root@162.43.15.173
```

初回接続時はフィンガープリントの確認が表示されます。`yes`と入力してください。

### ステップ2: VPSセットアップスクリプトの実行 (5分)

```bash
# セットアップスクリプトをダウンロード
cd ~
wget https://raw.githubusercontent.com/yourusername/oriental-synergy/main/vps-setup.sh
# または、ファイルを直接アップロード

# 実行権限を付与
chmod +x vps-setup.sh

# スクリプトを実行
sudo ./vps-setup.sh
```

このスクリプトが以下を自動的に実行します：
- システムアップデート
- Docker Compose インストール
- Nginx、Certbot、fail2ban などのインストール
- ファイアウォール設定
- アプリケーションディレクトリ作成

### ステップ3: プロジェクトファイルのアップロード (5分)

**方法A: SCPでアップロード（推奨）**

ローカル環境で実行：

```bash
cd /Users/soedakei/madoc_line

# プロジェクトファイルをアップロード
scp -r backend/ frontend/ docker-compose.prod.yml nginx.conf.template root@162.43.15.173:/var/www/oriental-synergy/
```

**方法B: Gitリポジトリからクローン**

VPS上で実行：

```bash
cd /var/www/oriental-synergy
git clone https://github.com/yourusername/oriental-synergy.git .
```

### ステップ4: 環境変数の設定 (5分)

VPS上で実行：

```bash
cd /var/www/oriental-synergy

# SECRET_KEYの生成
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
echo "生成されたSECRET_KEY: $SECRET_KEY"

# バックエンド環境変数の作成
cat > backend/.env << EOF
# Database
DATABASE_URL=sqlite:////app/data/oriental_synergy.db

# Security
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
BACKEND_CORS_ORIGINS=["http://162.43.15.173","http://x162-43-15-173.static.xvps.ne.jp"]

# Server
HOST=0.0.0.0
PORT=8000

# Environment
ENVIRONMENT=production
DEBUG=False
EOF

# フロントエンド環境変数の作成
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://162.43.15.173/api/v1
NEXT_TELEMETRY_DISABLED=1
EOF
```

### ステップ5: Nginx設定 (3分)

```bash
# Nginx設定ファイルを配置
sudo cp nginx.conf.template /etc/nginx/sites-available/oriental-synergy

# シンボリックリンクを作成
sudo ln -s /etc/nginx/sites-available/oriental-synergy /etc/nginx/sites-enabled/

# 設定をテスト
sudo nginx -t

# Nginxを再起動
sudo systemctl restart nginx
```

### ステップ6: Dockerコンテナの起動 (8分)

```bash
cd /var/www/oriental-synergy

# イメージのビルド
docker-compose -f docker-compose.prod.yml build

# コンテナの起動
docker-compose -f docker-compose.prod.yml up -d

# ログを確認
docker-compose -f docker-compose.prod.yml logs -f
```

`Ctrl + C`でログ表示を終了できます。

### ステップ7: データベースの初期化 (2分)

```bash
# バックエンドコンテナに入る
docker-compose -f docker-compose.prod.yml exec backend bash

# データベースの初期化
python init_db.py

# サンプルデータの投入（必要に応じて）
python seed_data.py

# コンテナから抜ける
exit
```

### ステップ8: 動作確認 (2分)

ブラウザで以下にアクセス：

1. **フロントエンド**: http://162.43.15.173/
2. **バックエンドAPI**: http://162.43.15.173/api/v1/health
3. **APIドキュメント**: http://162.43.15.173/docs

すべて正常に表示されれば完了です！🎉

## 🔐 SSL証明書の設定（独自ドメインがある場合）

独自ドメインのDNS設定でAレコードを`162.43.15.173`に向けた後：

```bash
# ドメインを変数に設定
DOMAIN="yourdomain.com"

# Nginx設定を編集してドメイン名を変更
sudo sed -i "s/162.43.15.173 x162-43-15-173.static.xvps.ne.jp/${DOMAIN} www.${DOMAIN}/g" /etc/nginx/sites-available/oriental-synergy

# Nginxを再起動
sudo systemctl restart nginx

# SSL証明書を取得
sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}

# 自動更新のテスト
sudo certbot renew --dry-run
```

証明書が取得されると、自動的にHTTPS設定が追加されます。

## 📊 運用管理コマンド

### ログの確認

```bash
# Dockerコンテナのログ
cd /var/www/oriental-synergy
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend

# Nginxのログ
sudo tail -f /var/log/nginx/oriental-synergy-access.log
sudo tail -f /var/log/nginx/oriental-synergy-error.log
```

### コンテナの再起動

```bash
cd /var/www/oriental-synergy

# すべてのコンテナを再起動
docker-compose -f docker-compose.prod.yml restart

# 特定のコンテナのみ再起動
docker-compose -f docker-compose.prod.yml restart backend
```

### アプリケーションの更新

```bash
cd /var/www/oriental-synergy

# 最新のコードを取得（Gitを使用している場合）
git pull

# コンテナを停止
docker-compose -f docker-compose.prod.yml down

# 再ビルド
docker-compose -f docker-compose.prod.yml build

# 起動
docker-compose -f docker-compose.prod.yml up -d
```

### データベースのバックアップ

```bash
# 手動バックアップ
docker-compose -f docker-compose.prod.yml exec backend bash -c \
  "mkdir -p /app/data/backups && cp /app/data/oriental_synergy.db /app/data/backups/backup_$(date +%Y%m%d_%H%M%S).db"

# ローカルにダウンロード
scp root@162.43.15.173:/var/www/oriental-synergy/backend/data/oriental_synergy.db ./backup.db
```

### システムリソースの確認

```bash
# コンテナのリソース使用状況
docker stats

# システム全体
htop

# ディスク使用状況
df -h

# メモリ使用状況
free -h
```

## 🔧 トラブルシューティング

### コンテナが起動しない

```bash
# ログを確認
docker-compose -f docker-compose.prod.yml logs

# コンテナの状態を確認
docker-compose -f docker-compose.prod.yml ps

# コンテナを削除して再作成
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up -d
```

### Nginxエラー

```bash
# 設定ファイルのテスト
sudo nginx -t

# エラーログを確認
sudo tail -50 /var/log/nginx/error.log

# Nginxを再起動
sudo systemctl restart nginx
```

### ポートが使用中

```bash
# ポート使用状況の確認
sudo netstat -tulpn | grep :8000
sudo netstat -tulpn | grep :3000

# プロセスの停止
sudo kill -9 <PID>
```

### データベースエラー

```bash
# データベースファイルの確認
docker-compose -f docker-compose.prod.yml exec backend ls -la /app/data/

# データベースの再初期化
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
```

## 📈 パフォーマンス最適化

### Dockerリソース制限の調整

`docker-compose.prod.yml`を編集：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          memory: 512M
```

### Nginxキャッシュの有効化

`/etc/nginx/sites-available/oriental-synergy`に追加：

```nginx
# キャッシュディレクトリの設定
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m inactive=60m;

# APIキャッシュ（GETリクエストのみ）
location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    proxy_cache_methods GET;
    # ... 既存の設定 ...
}
```

## 🔒 セキュリティ強化

### SSH鍵認証の設定

```bash
# ローカル環境でSSH鍵を生成
ssh-keygen -t ed25519 -C "your_email@example.com"

# 公開鍵をVPSにコピー
ssh-copy-id root@162.43.15.173

# VPS上でパスワード認証を無効化
sudo nano /etc/ssh/sshd_config
# 以下を変更:
# PasswordAuthentication no
sudo systemctl restart sshd
```

### ファイアウォールルールの確認

```bash
# 現在のルールを確認
sudo ufw status verbose

# 不要なポートを閉じる
sudo ufw deny <port_number>
```

### 定期的なセキュリティアップデート

```bash
# 自動アップデートの設定
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📞 サポート

問題が発生した場合：

1. **ログを確認**: 上記のログ確認コマンドを実行
2. **XサーバーVPSサポート**: https://www.xserver.ne.jp/support/
3. **ドキュメント**: `DEPLOYMENT_GUIDE.md` を参照

## ✅ デプロイ完了チェックリスト

デプロイが完了したら、以下を確認：

- [ ] VPSにSSH接続できる
- [ ] Dockerコンテナが起動している
- [ ] フロントエンドにアクセスできる（http://162.43.15.173/）
- [ ] バックエンドAPIにアクセスできる（http://162.43.15.173/api/v1/health）
- [ ] APIドキュメントが表示される（http://162.43.15.173/docs）
- [ ] データベースが初期化されている
- [ ] ログインできる（管理者アカウントでテスト）
- [ ] ファイアウォールが設定されている
- [ ] Nginxが正常に動作している
- [ ] （オプション）SSL証明書が設定されている
- [ ] バックアップ計画がある

すべてチェックできたら、デプロイ完了です！🎉








