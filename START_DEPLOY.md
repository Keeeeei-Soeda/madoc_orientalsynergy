# 🚀 Oriental Synergy - 今すぐデプロイ開始

## 📋 VPSパスワードの確認方法

### XサーバーVPSパネルで確認

1. **XサーバーVPSパネル**にログイン
   - URL: https://secure.xserver.ne.jp/xvps_login.php

2. VPS一覧から**「oriental」**サーバーを選択

3. **「パスワード変更」**メニューをクリック
   - 現在のパスワードが表示される、または
   - 新しいパスワードを設定できる

### 初回メールを確認

契約時のメール **「【Xserver VPS】■重要■VPSアカウント設定完了のお知らせ」** に記載されています。

---

## 🎯 デプロイ開始（2つの方法）

### 方法A: パスワード認証でデプロイ（すぐ開始）

パスワードを何度か入力する必要がありますが、すぐに始められます。

#### 1. SSH接続テスト

```bash
ssh root@162.43.15.173
```

パスワードを入力して接続できればOK。
接続できたら `exit` で抜けてください。

#### 2. ファイルアップロード

```bash
cd /Users/soedakei/madoc_line
./quick-upload.sh
```

パスワードを何度か入力（5-6回）してファイルをアップロードします。

#### 3. VPSでデプロイ実行

新しいターミナルウィンドウを開いて：

```bash
# VPSに接続
ssh root@162.43.15.173

# 以下、VPS上で実行
cd /var/www/oriental-synergy
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

セットアップが完了したら、以下を実行：

```bash
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
sudo cp nginx.conf.template /etc/nginx/sites-available/oriental-synergy
sudo ln -s /etc/nginx/sites-available/oriental-synergy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# デプロイ実行
chmod +x deploy.sh
./deploy.sh

# データベース初期化
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
docker-compose -f docker-compose.prod.yml exec backend python seed_data.py
```

---

### 方法B: SSH鍵認証でデプロイ（パスワード入力不要）

最初に1回だけパスワードを入力すれば、以降はパスワード不要になります。

#### 1. SSH鍵をセットアップ（1回のみ）

```bash
cd /Users/soedakei/madoc_line
./setup-ssh-key.sh
```

VPSのrootパスワードを1回入力するだけでOK。

#### 2. ファイルアップロード（パスワード不要）

```bash
cd /Users/soedakei/madoc_line
./quick-upload.sh
```

パスワード入力なしでアップロードされます。

#### 3. VPSでデプロイ実行

```bash
ssh root@162.43.15.173
```

以降は方法Aと同じです。

---

## ⏱️ 所要時間

- **ファイルアップロード**: 3-5分
- **VPSセットアップ**: 5分
- **環境変数設定**: 2分
- **Dockerビルド**: 8-10分
- **データベース初期化**: 1分

**合計: 約20-25分**

---

## ✅ デプロイ完了の確認

ブラウザで以下にアクセス：

1. **フロントエンド**: http://162.43.15.173/
2. **API**: http://162.43.15.173/api/v1/health
3. **APIドキュメント**: http://162.43.15.173/docs

すべて表示されれば成功です！🎉

---

## 🆘 トラブルシューティング

### パスワードが分からない

XサーバーVPSパネルで「パスワード再設定」を実行してください。

### SSH接続できない

```bash
# 詳細ログで確認
ssh -v root@162.43.15.173
```

ポート22が開いているか確認：
```bash
telnet 162.43.15.173 22
```

### ファイルアップロードが失敗する

1つずつアップロード：
```bash
cd /Users/soedakei/madoc_line
scp docker-compose.prod.yml root@162.43.15.173:/var/www/oriental-synergy/
```

### Dockerビルドが失敗する

```bash
# ログを確認
docker-compose -f docker-compose.prod.yml logs

# 再ビルド
docker-compose -f docker-compose.prod.yml build --no-cache
```

---

## 📞 サポート情報

- **詳細手順**: `DEPLOY_NOW.md` を参照
- **コマンド集**: `COMMANDS.txt` を参照
- **Xサーバーサポート**: https://www.xserver.ne.jp/support/

---

## 🎯 今すぐ始める

以下のコマンドをコピーして実行：

```bash
# まずSSH接続テスト
ssh root@162.43.15.173
```

接続できたら `exit` で抜けて：

```bash
# ファイルをアップロード
cd /Users/soedakei/madoc_line
./quick-upload.sh
```

これでデプロイが始まります！🚀






