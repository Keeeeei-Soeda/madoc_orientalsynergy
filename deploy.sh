#!/bin/bash
# ============================================================================
# オリエンタルシナジー デプロイスクリプト
# ============================================================================

set -e  # エラー時に停止

# 色付きメッセージ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Oriental Synergy デプロイスクリプト${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 環境変数の確認
echo -e "${YELLOW}📋 環境変数の確認...${NC}"
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env が見つかりません${NC}"
    echo "backend/env.example をコピーして backend/.env を作成してください"
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${RED}❌ frontend/.env.local が見つかりません${NC}"
    echo "frontend/env.local.example をコピーして frontend/.env.local を作成してください"
    exit 1
fi

echo -e "${GREEN}✓ 環境変数ファイルが存在します${NC}"
echo ""

# 古いコンテナの停止と削除
echo -e "${YELLOW}🛑 既存のコンテナを停止中...${NC}"
docker-compose -f docker-compose.prod.yml down

# イメージのビルド
echo -e "${YELLOW}🔨 Dockerイメージをビルド中...${NC}"
docker-compose -f docker-compose.prod.yml build --no-cache

# コンテナの起動
echo -e "${YELLOW}🚀 コンテナを起動中...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# ヘルスチェック
echo -e "${YELLOW}🏥 ヘルスチェック中...${NC}"
sleep 10

# バックエンドのヘルスチェック
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ バックエンドは正常に起動しました${NC}"
else
    echo -e "${RED}❌ バックエンドの起動に失敗しました${NC}"
    echo "ログを確認してください: docker-compose -f docker-compose.prod.yml logs backend"
    exit 1
fi

# フロントエンドのヘルスチェック
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ フロントエンドは正常に起動しました${NC}"
else
    echo -e "${RED}❌ フロントエンドの起動に失敗しました${NC}"
    echo "ログを確認してください: docker-compose -f docker-compose.prod.yml logs frontend"
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ デプロイが完了しました！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📊 アクセスURL:${NC}"
echo "  フロントエンド: http://localhost:3000"
echo "  バックエンドAPI: http://localhost:8000"
echo "  API ドキュメント: http://localhost:8000/api/docs"
echo ""
echo -e "${BLUE}📝 便利なコマンド:${NC}"
echo "  ログを確認: docker-compose -f docker-compose.prod.yml logs -f"
echo "  コンテナ状態: docker-compose -f docker-compose.prod.yml ps"
echo "  停止: docker-compose -f docker-compose.prod.yml down"
echo "  再起動: docker-compose -f docker-compose.prod.yml restart"
echo ""





