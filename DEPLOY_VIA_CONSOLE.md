# XサーバーVPSコンソール経由でのデプロイ

SSH接続が難しい場合、ブラウザベースのVPSコンソールを使用してデプロイできます。

## 📱 VPSコンソールへのアクセス

### ステップ1: VPSコンソールを開く

1. **XサーバーVPSパネル**にログイン
   - https://secure.xserver.ne.jp/xvps_login.php

2. **VPS管理画面**を開く
   - 「VPS」タブをクリック
   - サーバー「oriental」を選択

3. **コンソールを起動**
   - 「コンソール」または「VNCコンソール」ボタンをクリック
   - ブラウザ上でターミナルが開きます

4. **rootでログイン**
   - ログイン: `root`
   - パスワード: XサーバーVPSのパスワード

---

## 🔐 SSH設定の確認と修正

VPSコンソールにログインできたら、SSH設定を確認・修正します。

### SSH設定を確認

```bash
# SSH設定を確認
cat /etc/ssh/sshd_config | grep -E "PermitRootLogin|PasswordAuthentication"
```

### パスワード認証を有効化

```bash
# SSH設定ファイルを編集
nano /etc/ssh/sshd_config

# 以下を確認・変更:
# PermitRootLogin yes
# PasswordAuthentication yes
# PubkeyAuthentication yes

# 保存して閉じる (Ctrl+O, Enter, Ctrl+X)

# SSH再起動
systemctl restart sshd

# 確認
systemctl status sshd
```

### SSH公開鍵を登録

```bash
# .sshディレクトリ作成
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# authorized_keysファイル作成
nano ~/.ssh/authorized_keys

# 以下の公開鍵を貼り付け:
# ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINhnEbpFNtFbL4DKo8F8YLozl4mguFzUJ+zKK2Pra/Gm soedakei@soedakeinoMacBook-Air.local

# 保存して閉じる (Ctrl+O, Enter, Ctrl+X)

# 権限設定
chmod 600 ~/.ssh/authorized_keys
chown -R root:root ~/.ssh
```

### ローカルから再度SSH接続テスト

ローカル環境で実行：

```bash
ssh root@162.43.15.173
```

---

## 🚀 VPSコンソールから直接デプロイ

SSH接続が解決しない場合、VPSコンソール上で直接デプロイ作業を行えます。

### 方法A: GitHubにコードをプッシュしてクローン（推奨）

#### ローカル環境で実行

```bash
cd /Users/soedakei/madoc_line

# Gitリポジトリを初期化（まだの場合）
git init
git add .
git commit -m "Initial commit for deployment"

# GitHubにプッシュ（リポジトリを作成後）
git remote add origin https://github.com/yourusername/oriental-synergy.git
git branch -M main
git push -u origin main
```

#### VPSコンソールで実行

```bash
# 作業ディレクトリ作成
mkdir -p /var/www/oriental-synergy
cd /var/www/oriental-synergy

# Gitからクローン
git clone https://github.com/yourusername/oriental-synergy.git .

# または、プライベートリポジトリの場合
git clone https://YOUR_GITHUB_TOKEN@github.com/yourusername/oriental-synergy.git .
```

### 方法B: ファイルを手動でアップロード

#### 1. ローカルでファイルを圧縮

```bash
cd /Users/soedakei/madoc_line

# 必要なファイルのみ圧縮
tar -czf oriental-synergy-deploy.tar.gz \
  --exclude='venv' \
  --exclude='node_modules' \
  --exclude='*.pyc' \
  --exclude='__pycache__' \
  --exclude='.git' \
  --exclude='.next' \
  backend/ frontend/ docker-compose.prod.yml \
  nginx.conf.template vps-setup.sh deploy.sh

# ファイルサイズ確認
ls -lh oriental-synergy-deploy.tar.gz
```

#### 2. ファイルをWeb経由でアップロード

**オプション2-1: Google Driveを使用**

1. `oriental-synergy-deploy.tar.gz` をGoogle Driveにアップロード
2. 共有リンクを取得（「リンクを知っている全員が閲覧可」）
3. VPSコンソールでダウンロード

```bash
# VPSコンソールで実行
cd /var/www/oriental-synergy

# Google Driveからダウンロード（共有リンクのIDを使用）
# リンク例: https://drive.google.com/file/d/FILE_ID/view
wget --no-check-certificate 'https://drive.google.com/uc?export=download&id=FILE_ID' -O oriental-synergy-deploy.tar.gz

# 解凍
tar -xzf oriental-synergy-deploy.tar.gz
ls -la
```

**オプション2-2: Dropboxを使用**

1. `oriental-synergy-deploy.tar.gz` をDropboxにアップロード
2. 共有リンクを取得
3. VPSコンソールでダウンロード

```bash
# VPSコンソールで実行
# Dropboxのリンクの dl=0 を dl=1 に変更
wget -O oriental-synergy-deploy.tar.gz "https://www.dropbox.com/s/xxxxx/oriental-synergy-deploy.tar.gz?dl=1"

# 解凍
tar -xzf oriental-synergy-deploy.tar.gz
```

**オプション2-3: curlでアップロード**

```bash
# ローカルで一時サーバーを起動
cd /Users/soedakei/madoc_line
python3 -m http.server 8080

# VPSコンソールでダウンロード（ローカルのIPアドレスを確認後）
# 注意: ファイアウォールで8080ポートを開ける必要があります
wget http://YOUR_LOCAL_IP:8080/oriental-synergy-deploy.tar.gz
```

---

## 🔧 VPSコンソールでデプロイ実行

ファイルが配置できたら、以下を実行：

```bash
cd /var/www/oriental-synergy

# VPSセットアップ
chmod +x vps-setup.sh
./vps-setup.sh

# 環境変数設定
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")

cat > backend/.env << EOF
DATABASE_URL=sqlite:////app/data/oriental_synergy.db
SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
BACKEND_CORS_ORIGINS=["http://162.43.15.173"]
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=production
DEBUG=False
EOF

cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://162.43.15.173/api/v1
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
EOF

# Nginx設定
cp nginx.conf.template /etc/nginx/sites-available/oriental-synergy
ln -s /etc/nginx/sites-available/oriental-synergy /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

# Dockerデプロイ
chmod +x deploy.sh
./deploy.sh

# データベース初期化
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
docker-compose -f docker-compose.prod.yml exec backend python seed_data.py
```

---

## ✅ デプロイ完了確認

ブラウザで以下にアクセス：

1. **フロントエンド**: http://162.43.15.173/
2. **API**: http://162.43.15.173/api/v1/health
3. **APIドキュメント**: http://162.43.15.173/docs

---

## 💡 推奨: SSH接続の設定完了後

SSH接続が確立できたら、今後のために公開鍵認証を設定しておくことをお勧めします。

```bash
# VPSコンソールまたはSSHで実行
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINhnEbpFNtFbL4DKo8F8YLozl4mguFzUJ+zKK2Pra/Gm soedakei@soedakeinoMacBook-Air.local" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

これで次回からパスワード不要で接続できます。





