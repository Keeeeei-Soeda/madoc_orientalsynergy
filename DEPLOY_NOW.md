# Oriental Synergy - 今すぐデプロイ手順

## 📋 現在の状況

✅ ローカル環境の準備完了
- すべての必要なファイルが揃っています
- デプロイスクリプトが準備できています
- 設定ファイルが準備できています

## 🔐 必要な情報

XサーバーVPSから以下の情報を確認してください：

- **IPアドレス**: 162.43.15.173 ✅
- **rootパスワード**: Xサーバーのコントロールパネルから確認
- **または SSH秘密鍵**: 鍵認証を使用する場合

## 🚀 デプロイ開始（3つの方法）

### 方法1: ワンライナーデプロイ（最速）

以下のコマンドをコピーして、**1つずつ**実行してください：

```bash
# 1. VPSにSSH接続（パスワードを入力）
ssh root@162.43.15.173

# 2. 作業ディレクトリ作成
mkdir -p /var/www/oriental-synergy && cd /var/www/oriental-synergy

# 3. 別のターミナルでファイルをアップロード（ローカル環境で実行）
# 新しいターミナルウィンドウを開いて以下を実行：
cd /Users/soedakei/madoc_line && \
scp -r backend frontend docker-compose.prod.yml nginx.conf.template vps-setup.sh deploy.sh root@162.43.15.173:/var/www/oriental-synergy/

# 4. VPSのターミナルに戻って、セットアップ実行
chmod +x vps-setup.sh && sudo ./vps-setup.sh

# 5. 環境変数設定
python3 -c "import secrets; print(secrets.token_urlsafe(64))" > /tmp/secret.txt
SECRET_KEY=$(cat /tmp/secret.txt)

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

# 6. Nginx設定
sudo cp nginx.conf.template /etc/nginx/sites-available/oriental-synergy
sudo ln -s /etc/nginx/sites-available/oriental-synergy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 7. デプロイ実行
chmod +x deploy.sh && ./deploy.sh

# 8. データベース初期化
docker-compose -f docker-compose.prod.yml exec backend python init_db.py
docker-compose -f docker-compose.prod.yml exec backend python seed_data.py
```

### 方法2: ステップバイステップ（推奨・確実）

#### ステップ1: VPSにSSH接続 (1分)

```bash
ssh root@162.43.15.173
```

rootパスワードを入力してください。

#### ステップ2: 作業ディレクトリ準備 (30秒)

VPS上で実行：

```bash
mkdir -p /var/www/oriental-synergy
cd /var/www/oriental-synergy
ls -la  # 空であることを確認
```

#### ステップ3: ファイルをアップロード (3分)

**新しいターミナルウィンドウ**を開いて、ローカル環境で実行：

```bash
cd /Users/soedakei/madoc_line

# backend をアップロード
scp -r backend/ root@162.43.15.173:/var/www/oriental-synergy/

# frontend をアップロード  
scp -r frontend/ root@162.43.15.173:/var/www/oriental-synergy/

# 設定ファイルをアップロード
scp docker-compose.prod.yml root@162.43.15.173:/var/www/oriental-synergy/
scp nginx.conf.template root@162.43.15.173:/var/www/oriental-synergy/
scp vps-setup.sh root@162.43.15.173:/var/www/oriental-synergy/
scp deploy.sh root@162.43.15.173:/var/www/oriental-synergy/
```

各コマンドでパスワードの入力を求められます。

#### ステップ4: VPSセットアップ (5分)

VPSのターミナルに戻って実行：

```bash
cd /var/www/oriental-synergy
ls -la  # ファイルがアップロードされたことを確認

# セットアップスクリプトを実行
chmod +x vps-setup.sh
sudo ./vps-setup.sh
```

このスクリプトが以下を自動実行します：
- システムアップデート
- Docker Compose インストール
- Nginx、Certbot インストール
- ファイアウォール設定
- セキュリティ設定

#### ステップ5: 環境変数の設定 (3分)

VPS上で実行：

```bash
cd /var/www/oriental-synergy

# SECRET_KEYを生成
SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_urlsafe(64))")
echo "生成されたSECRET_KEY: $SECRET_KEY"
# ↑このキーをメモしておいてください

# バックエンドの環境変数ファイル作成
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

# フロントエンドの環境変数ファイル作成
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://162.43.15.173/api/v1
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
EOF

# 確認
echo "✓ backend/.env 作成完了"
echo "✓ frontend/.env.local 作成完了"
```

#### ステップ6: Nginx設定 (2分)

VPS上で実行：

```bash
# Nginx設定ファイルを配置
sudo cp nginx.conf.template /etc/nginx/sites-available/oriental-synergy

# シンボリックリンク作成
sudo ln -s /etc/nginx/sites-available/oriental-synergy /etc/nginx/sites-enabled/

# 設定テスト
sudo nginx -t

# Nginx再起動
sudo systemctl restart nginx

echo "✓ Nginx設定完了"
```

#### ステップ7: Dockerコンテナのデプロイ (8分)

VPS上で実行：

```bash
cd /var/www/oriental-synergy

# デプロイスクリプトを実行
chmod +x deploy.sh
./deploy.sh
```

このスクリプトが以下を実行します：
- Dockerイメージのビルド
- コンテナの起動
- ヘルスチェック

#### ステップ8: データベース初期化 (2分)

VPS上で実行：

```bash
# バックエンドコンテナに入る
docker-compose -f docker-compose.prod.yml exec backend bash

# データベース初期化
python init_db.py

# サンプルデータ投入
python seed_data.py

# コンテナから抜ける
exit
```

#### ステップ9: 動作確認 (1分)

ブラウザで以下にアクセス：

1. **フロントエンド**: http://162.43.15.173/
2. **API**: http://162.43.15.173/api/v1/health
3. **APIドキュメント**: http://162.43.15.173/docs

すべて表示されれば完了です！🎉

### 方法3: rsyncを使用（高速）

SSH鍵が設定されている場合のみ：

```bash
cd /Users/soedakei/madoc_line
./upload-to-vps.sh
```

その後、VPSにSSH接続して上記のステップ4以降を実行。

## 🔍 トラブルシューティング

### SSH接続できない

```bash
# ポート22が開いているか確認
telnet 162.43.15.173 22

# SSH詳細ログで接続
ssh -v root@162.43.15.173
```

### ファイルアップロードが失敗する

```bash
# 1つずつアップロード
scp docker-compose.prod.yml root@162.43.15.173:/var/www/oriental-synergy/
# 成功したら次へ...
```

### Dockerコンテナが起動しない

```bash
# ログ確認
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend

# コンテナ状態確認
docker-compose -f docker-compose.prod.yml ps

# 再起動
docker-compose -f docker-compose.prod.yml restart
```

### Nginxエラー

```bash
# エラーログ確認
sudo tail -50 /var/log/nginx/error.log

# 設定テスト
sudo nginx -t

# 再起動
sudo systemctl restart nginx
```

## 📞 次のアクション

デプロイ完了後：

1. **テストログイン**を実行
2. **各機能の動作確認**
3. **SSL証明書の設定**（独自ドメインがある場合）
4. **バックアップの設定**
5. **監視の設定**（UptimeRobotなど）

## 💡 重要なコマンド

```bash
# ログ確認
docker-compose -f docker-compose.prod.yml logs -f

# コンテナ再起動
docker-compose -f docker-compose.prod.yml restart

# コンテナ停止
docker-compose -f docker-compose.prod.yml down

# システムリソース確認
docker stats
htop
```

## ✅ 完了チェックリスト

- [ ] VPSにSSH接続できた
- [ ] ファイルをアップロードできた
- [ ] VPSセットアップスクリプトが成功した
- [ ] 環境変数ファイルを作成した
- [ ] Nginx設定が完了した
- [ ] Dockerコンテナが起動した
- [ ] データベースを初期化した
- [ ] フロントエンドにアクセスできた
- [ ] APIドキュメントにアクセスできた
- [ ] ログインできた

すべてチェックできたら、デプロイ完了です！🎉





