#!/bin/bash
# ============================================================================
# オリエンタルシナジー デプロイスクリプト
# ============================================================================

set -e  # エラーが発生したら即座に終了

echo "🚀 オリエンタルシナジー デプロイを開始します..."

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 環境変数ファイルの確認
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}⚠️  .env.production が見つかりません${NC}"
    echo "📝 .env.production.example をコピーして作成してください："
    echo "   cp .env.production.example .env.production"
    echo "   その後、実際の値を設定してください"
    exit 1
fi

# DockerとDocker Composeの確認
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Dockerがインストールされていません${NC}"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Composeがインストールされていません${NC}"
    exit 1
fi

# Docker Composeコマンドの決定
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}✅ 環境チェック完了${NC}"
echo ""

# 既存のコンテナを停止・削除
echo "🛑 既存のコンテナを停止します..."
$DOCKER_COMPOSE -f docker-compose.production.yml down

# イメージをビルド
echo "🔨 Dockerイメージをビルドします..."
$DOCKER_COMPOSE -f docker-compose.production.yml build --no-cache

# コンテナを起動
echo "🚀 コンテナを起動します..."
$DOCKER_COMPOSE -f docker-compose.production.yml up -d

# ヘルスチェック
echo "⏳ サービスが起動するまで待機します..."
sleep 10

# データベースの初期化確認
echo "📊 データベースの状態を確認します..."
$DOCKER_COMPOSE -f docker-compose.production.yml exec -T postgres psql -U oriental_user -d oriental_db -c "SELECT version();" || echo "⚠️  データベース接続に失敗しました"

# サービスの状態を表示
echo ""
echo -e "${GREEN}✅ デプロイ完了！${NC}"
echo ""
echo "📋 実行中のコンテナ："
$DOCKER_COMPOSE -f docker-compose.production.yml ps

echo ""
echo "🌐 アクセスURL："
echo "   - フロントエンド: http://162.43.15.173:3000"
echo "   - バックエンドAPI: http://162.43.15.173:8000"
echo "   - APIドキュメント: http://162.43.15.173:8000/api/docs"
echo ""
echo "📝 ログを確認するには："
echo "   $DOCKER_COMPOSE -f docker-compose.production.yml logs -f [service_name]"
echo ""
echo "🛑 停止するには："
echo "   $DOCKER_COMPOSE -f docker-compose.production.yml down"
