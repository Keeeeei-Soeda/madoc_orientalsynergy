#!/bin/bash
# oriental.pemを使ってVPSに接続し、ログインエラーを修正するスクリプト

PEM_FILE="/Users/soedakei/madoc_line/oriental.pem"
VPS_HOST="162.43.15.173"
VPS_USER="root"

echo "🔧 ログインエラーを修正します..."
echo ""

# SSH接続して環境変数を修正
ssh -i "$PEM_FILE" -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'SSH_CMD'
set -e

echo "📋 現在の状態を確認..."
cd /var/www/oriental-synergy

# フロントエンドの環境変数を修正
echo ""
echo "🔧 フロントエンドの環境変数を修正中..."
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://162.43.15.173:8000/api/v1
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
EOF

echo "✅ .env.local を更新しました"
cat .env.local

# フロントエンドコンテナを再ビルド
echo ""
echo "🔨 フロントエンドコンテナを再ビルド中..."
cd /var/www/oriental-synergy
docker-compose -f docker-compose.production.yml stop frontend
docker-compose -f docker-compose.production.yml build frontend
docker-compose -f docker-compose.production.yml up -d frontend

echo ""
echo "✅ 修正完了！"
echo ""
echo "📊 コンテナの状態:"
docker-compose -f docker-compose.production.yml ps

echo ""
echo "📝 ログを確認（Ctrl+Cで終了）:"
echo "docker-compose -f docker-compose.production.yml logs -f frontend"
SSH_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 修正が完了しました！"
    echo ""
    echo "🌐 ブラウザで以下にアクセスして確認してください:"
    echo "   http://162.43.15.173:3000/login"
    echo ""
    echo "📝 ログを確認するには:"
    echo "   ssh -i $PEM_FILE ${VPS_USER}@${VPS_HOST} 'cd /var/www/oriental-synergy && docker-compose -f docker-compose.production.yml logs -f frontend'"
else
    echo ""
    echo "❌ エラーが発生しました"
    exit 1
fi

