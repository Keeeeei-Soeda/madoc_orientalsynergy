#!/bin/bash
# ============================================================================
# Docker Composeをsystemdサービスとして設定するスクリプト
# これにより、VPS再起動時に自動的にDocker Composeが起動します
# 使用方法: VPSにSSH接続後、rootで実行
# ============================================================================

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# rootチェック
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}このスクリプトはrootまたはsudo権限で実行してください${NC}"
    exit 1
fi

APP_DIR="/var/www/oriental-synergy"
SERVICE_NAME="oriental-synergy"

echo -e "${YELLOW}📝 systemdサービスを作成中...${NC}"

# systemdサービスファイルの作成
cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=Oriental Synergy Application
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=${APP_DIR}
ExecStart=/usr/bin/docker compose -f docker-compose.production.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.production.yml down
TimeoutStartSec=0
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Docker Composeコマンドの確認と調整
if command -v docker-compose &> /dev/null; then
    sed -i 's|docker compose|docker-compose|g' /etc/systemd/system/${SERVICE_NAME}.service
fi

# systemdをリロード
systemctl daemon-reload

# サービスを有効化
systemctl enable ${SERVICE_NAME}.service

echo -e "${GREEN}✅ systemdサービスを作成しました${NC}"
echo ""
echo -e "${YELLOW}📋 次のコマンドでサービスを管理できます:${NC}"
echo "  起動: sudo systemctl start ${SERVICE_NAME}"
echo "  停止: sudo systemctl stop ${SERVICE_NAME}"
echo "  再起動: sudo systemctl restart ${SERVICE_NAME}"
echo "  状態確認: sudo systemctl status ${SERVICE_NAME}"
echo "  ログ確認: sudo journalctl -u ${SERVICE_NAME} -f"
echo ""
echo -e "${YELLOW}🚀 サービスを起動しますか？ (y/n)${NC}"
read -r response
if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
    systemctl start ${SERVICE_NAME}
    systemctl status ${SERVICE_NAME} --no-pager -l
    echo ""
    echo -e "${GREEN}✅ サービスを起動しました${NC}"
fi


