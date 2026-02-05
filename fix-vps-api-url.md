# VPSのAPI URL設定修正手順

## 現在の状況

✅ VPSのバックエンド: 正常動作中 (`http://162.43.15.173:8000`)
✅ VPSのフロントエンド: 正常動作中 (`http://162.43.15.173:3000`)
❌ ログインエラー: フロントエンドが `localhost:8000` を参照している

## 問題の原因

フロントエンドの環境変数 `NEXT_PUBLIC_API_URL` が `localhost:8000` に設定されているか、設定されていないため、デフォルト値が使用されています。

## 解決方法

### 方法1: VPS上で環境変数を設定（推奨）

VPSにSSH接続して、フロントエンドの環境変数を修正します：

```bash
# VPSにSSH接続
ssh root@162.43.15.173

# フロントエンドの環境変数ファイルを編集
cd /var/www/oriental-synergy/frontend
nano .env.local
```

以下の内容を設定：

```bash
NEXT_PUBLIC_API_URL=http://162.43.15.173:8000/api/v1
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
```

保存後、フロントエンドコンテナを再起動：

```bash
cd /var/www/oriental-synergy
docker-compose -f docker-compose.production.yml restart frontend
```

### 方法2: Docker Composeの環境変数を確認

`docker-compose.production.yml` の環境変数設定を確認：

```bash
cd /var/www/oriental-synergy
cat docker-compose.production.yml | grep -A 10 "frontend:"
```

`NEXT_PUBLIC_API_URL` が正しく設定されているか確認してください。

### 方法3: Nginxリバースプロキシを使用（最適解）

同じドメインでフロントエンドとバックエンドを提供することで、CORSの問題も解決します。

Nginx設定例：

```nginx
server {
    listen 80;
    server_name 162.43.15.173;

    # バックエンドAPI
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # フロントエンド
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

この場合、フロントエンドの環境変数は：

```bash
NEXT_PUBLIC_API_URL=/api/v1
```

または

```bash
NEXT_PUBLIC_API_URL=http://162.43.15.173/api/v1
```

## 確認方法

修正後、ブラウザの開発者ツールのコンソールで、APIリクエストが正しいURLに送信されているか確認してください。

正しいURL: `http://162.43.15.173:8000/api/v1/auth/login`
誤ったURL: `http://localhost:8000/api/v1/auth/login`

