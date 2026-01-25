#!/bin/bash
# ============================================================================
# VPSへのアップロードスクリプト
# ============================================================================

set -e

# 色付きメッセージ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# VPS情報
VPS_HOST="162.43.15.173"
VPS_USER="root"
VPS_DIR="/var/www/oriental-synergy"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}VPSへのアップロード${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# SSH接続テスト
echo -e "${YELLOW}📡 VPSへの接続をテスト中...${NC}"
if ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} "echo 'Connection successful'" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ VPSに接続できました${NC}"
else
    echo -e "${RED}✗ VPSに接続できません${NC}"
    echo "以下を確認してください:"
    echo "1. SSH鍵が設定されているか"
    echo "2. VPSのIPアドレスが正しいか (${VPS_HOST})"
    echo "3. ファイアウォールでSSH(22番ポート)が許可されているか"
    echo ""
    echo "手動でSSH接続を試してください:"
    echo "  ssh ${VPS_USER}@${VPS_HOST}"
    exit 1
fi

echo ""

# アップロード対象ファイルのリスト
echo -e "${YELLOW}📦 アップロード対象ファイル:${NC}"
echo "  ✓ backend/"
echo "  ✓ frontend/"
echo "  ✓ docker-compose.prod.yml"
echo "  ✓ nginx.conf.template"
echo "  ✓ vps-setup.sh"
echo "  ✓ deploy.sh"
echo ""

read -p "アップロードを開始しますか? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}キャンセルしました${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}🚀 VPSにディレクトリを作成中...${NC}"
ssh ${VPS_USER}@${VPS_HOST} "mkdir -p ${VPS_DIR}"

echo -e "${YELLOW}📤 ファイルをアップロード中...${NC}"

# backend/ をアップロード
echo -e "${BLUE}  → backend/${NC}"
rsync -avz --progress \
    --exclude='venv' \
    --exclude='__pycache__' \
    --exclude='*.pyc' \
    --exclude='.pytest_cache' \
    --exclude='*.db' \
    ./backend/ ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/backend/

# frontend/ をアップロード
echo -e "${BLUE}  → frontend/${NC}"
rsync -avz --progress \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.env.local' \
    ./frontend/ ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/frontend/

# 設定ファイルをアップロード
echo -e "${BLUE}  → 設定ファイル${NC}"
scp docker-compose.prod.yml ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/
scp nginx.conf.template ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/
scp vps-setup.sh ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/
scp deploy.sh ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/
scp backend/env.production.example ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/backend/
scp frontend/env.production.example ${VPS_USER}@${VPS_HOST}:${VPS_DIR}/frontend/

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ アップロードが完了しました！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}次のステップ:${NC}"
echo ""
echo "1. VPSにSSH接続:"
echo "   ssh ${VPS_USER}@${VPS_HOST}"
echo ""
echo "2. アップロードしたディレクトリに移動:"
echo "   cd ${VPS_DIR}"
echo ""
echo "3. VPSセットアップスクリプトを実行（初回のみ）:"
echo "   sudo chmod +x vps-setup.sh"
echo "   sudo ./vps-setup.sh"
echo ""
echo "4. 環境変数ファイルを作成:"
echo "   # バックエンド"
echo "   cp backend/env.production.example backend/.env"
echo "   nano backend/.env  # SECRET_KEYなどを設定"
echo ""
echo "   # フロントエンド"
echo "   cp frontend/env.production.example frontend/.env.local"
echo "   nano frontend/.env.local"
echo ""
echo "5. Nginx設定を配置:"
echo "   sudo cp nginx.conf.template /etc/nginx/sites-available/oriental-synergy"
echo "   sudo ln -s /etc/nginx/sites-available/oriental-synergy /etc/nginx/sites-enabled/"
echo "   sudo nginx -t"
echo "   sudo systemctl restart nginx"
echo ""
echo "6. アプリケーションをデプロイ:"
echo "   chmod +x deploy.sh"
echo "   ./deploy.sh"
echo ""
echo -e "${YELLOW}📚 詳細な手順は QUICK_DEPLOY_GUIDE.md を参照してください${NC}"
echo ""






