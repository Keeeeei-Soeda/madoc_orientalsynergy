#!/bin/bash
# ============================================================================
# オリエンタルシナジー サーバーアップロードスクリプト
# ============================================================================

set -e

# 設定
SERVER_IP="162.43.15.173"
SERVER_USER="root"
SSH_KEY="/Users/soedakei/madoc_line/oriental.pem"
REMOTE_DIR="/opt/oriental-synergy"
LOCAL_DIR="/Users/soedakei/madoc_line"

# 色の定義
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📤 サーバーにアップロードを開始します..."
echo "   サーバー: ${SERVER_USER}@${SERVER_IP}"
echo "   リモートディレクトリ: ${REMOTE_DIR}"
echo ""

# SSH接続テスト
echo "🔌 SSH接続をテストします..."
ssh -i "${SSH_KEY}" -o ConnectTimeout=10 "${SERVER_USER}@${SERVER_IP}" "echo '✅ 接続成功'" || {
    echo "❌ SSH接続に失敗しました"
    exit 1
}

# リモートディレクトリの作成
echo "📁 リモートディレクトリを作成します..."
ssh -i "${SSH_KEY}" "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${REMOTE_DIR}"

# .gitignoreに基づいて除外ファイルを準備
echo "📦 ファイルをアーカイブします..."
cd "${LOCAL_DIR}"

# 除外するファイル・ディレクトリ
EXCLUDE_LIST=(
    ".git"
    "node_modules"
    ".next"
    "venv"
    "__pycache__"
    "*.pyc"
    ".env"
    ".env.local"
    ".env.production"
    "*.db"
    "*.log"
    "backend.log"
    "*.pem"
    "*.pem.backup"
    "oriental-synergy-deploy.tar.gz"
    ".DS_Store"
)

# rsyncでアップロード（より効率的）
echo "📤 ファイルをアップロードします..."
rsync -avz --progress \
    --exclude-from=<(printf '%s\n' "${EXCLUDE_LIST[@]}") \
    -e "ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no" \
    "${LOCAL_DIR}/" \
    "${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/"

echo ""
echo -e "${GREEN}✅ アップロード完了！${NC}"
echo ""
echo "次のステップ："
echo "1. サーバーにSSH接続: ssh -i ${SSH_KEY} ${SERVER_USER}@${SERVER_IP}"
echo "2. プロジェクトディレクトリに移動: cd ${REMOTE_DIR}"
echo "3. 環境変数ファイルを作成: cp .env.production.example .env.production"
echo "4. 環境変数を編集: nano .env.production"
echo "5. デプロイを実行: ./deploy.sh"




