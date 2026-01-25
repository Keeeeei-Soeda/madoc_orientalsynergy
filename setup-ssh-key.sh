#!/bin/bash
# ============================================================================
# SSH鍵認証セットアップスクリプト
# パスワード入力なしでVPSに接続できるようになります
# ============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_HOST="162.43.15.173"
VPS_USER="root"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SSH鍵認証セットアップ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# SSH鍵の存在確認
if [ -f ~/.ssh/id_ed25519.pub ]; then
    echo -e "${GREEN}✓ SSH鍵が既に存在します${NC}"
    SSH_KEY_FILE=~/.ssh/id_ed25519.pub
elif [ -f ~/.ssh/id_rsa.pub ]; then
    echo -e "${GREEN}✓ SSH鍵が既に存在します${NC}"
    SSH_KEY_FILE=~/.ssh/id_rsa.pub
else
    echo -e "${YELLOW}SSH鍵が見つかりません。新しい鍵を作成します。${NC}"
    echo ""
    read -p "メールアドレスを入力してください: " EMAIL
    
    ssh-keygen -t ed25519 -C "$EMAIL" -f ~/.ssh/id_ed25519 -N ""
    SSH_KEY_FILE=~/.ssh/id_ed25519.pub
    echo -e "${GREEN}✓ SSH鍵を作成しました${NC}"
fi

echo ""
echo -e "${YELLOW}📤 VPSに公開鍵をコピー中...${NC}"
echo "VPSのrootパスワードを入力してください:"
echo ""

# 公開鍵をVPSにコピー
ssh-copy-id -i $SSH_KEY_FILE ${VPS_USER}@${VPS_HOST}

echo ""
echo -e "${YELLOW}🧪 SSH接続をテスト中...${NC}"

# 接続テスト
if ssh -o ConnectTimeout=5 ${VPS_USER}@${VPS_HOST} "echo 'SSH鍵認証が成功しました！'" 2>/dev/null; then
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}✅ SSH鍵認証のセットアップ完了！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo "今後はパスワードなしでVPSに接続できます："
    echo "  ssh ${VPS_USER}@${VPS_HOST}"
    echo ""
    echo -e "${BLUE}次のステップ:${NC}"
    echo "  ./quick-upload.sh でファイルをアップロード"
else
    echo -e "${RED}✗ SSH接続に失敗しました${NC}"
    echo "手動で設定してください"
    exit 1
fi






