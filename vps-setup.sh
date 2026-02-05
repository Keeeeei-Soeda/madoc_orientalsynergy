#!/bin/bash
# ============================================================================
# XサーバーVPS セットアップスクリプト
# 使用方法: VPSにSSH接続後、このスクリプトを実行
# curl -O https://raw.githubusercontent.com/your-repo/vps-setup.sh
# chmod +x vps-setup.sh
# sudo ./vps-setup.sh
# ============================================================================

set -e

# 色付きメッセージ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Oriental Synergy VPS セットアップ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# rootチェック
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}このスクリプトはrootまたはsudo権限で実行してください${NC}"
    exit 1
fi

# ステップ1: システムアップデート
echo -e "${YELLOW}📦 システムをアップデート中...${NC}"
apt update && apt upgrade -y

# ステップ2: Docker Compose インストール
echo -e "${YELLOW}🐳 Docker Composeをインストール中...${NC}"
if ! command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✓ Docker Compose ${DOCKER_COMPOSE_VERSION} をインストールしました${NC}"
else
    echo -e "${GREEN}✓ Docker Compose は既にインストールされています${NC}"
fi

# ステップ3: 必要なパッケージのインストール
echo -e "${YELLOW}📦 必要なパッケージをインストール中...${NC}"
apt install -y \
    git \
    curl \
    wget \
    vim \
    htop \
    nginx \
    certbot \
    python3-certbot-nginx \
    ufw \
    fail2ban

# ステップ4: ファイアウォール設定
echo -e "${YELLOW}🔥 ファイアウォールを設定中...${NC}"
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
echo -e "${GREEN}✓ ファイアウォールを設定しました${NC}"

# ステップ5: アプリケーションディレクトリ作成
echo -e "${YELLOW}📁 アプリケーションディレクトリを作成中...${NC}"
APP_DIR="/var/www/oriental-synergy"
mkdir -p $APP_DIR
echo -e "${GREEN}✓ ディレクトリを作成しました: ${APP_DIR}${NC}"

# ステップ6: fail2ban設定
echo -e "${YELLOW}🛡️ fail2banを設定中...${NC}"
systemctl enable fail2ban
systemctl start fail2ban
echo -e "${GREEN}✓ fail2banを設定しました${NC}"

# ステップ7: Nginx基本設定
echo -e "${YELLOW}⚙️ Nginxを設定中...${NC}"
# デフォルト設定を無効化
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Nginxのメインレート制限設定
if ! grep -q "limit_req_zone" /etc/nginx/nginx.conf; then
    sed -i '/http {/a \    # レート制限設定\n    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;\n    limit_req_zone $binary_remote_addr zone=login_limit:10m rate=5r/m;' /etc/nginx/nginx.conf
fi

systemctl enable nginx
systemctl restart nginx
echo -e "${GREEN}✓ Nginxを設定しました${NC}"

# ステップ8: Docker設定最適化
echo -e "${YELLOW}🐳 Docker設定を最適化中...${NC}"
if [ ! -f /etc/docker/daemon.json ]; then
    cat > /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF
    systemctl restart docker
    echo -e "${GREEN}✓ Docker設定を最適化しました${NC}"
fi

# ステップ9: cronジョブの設定
echo -e "${YELLOW}⏰ cronジョブを設定中...${NC}"
# SSL証明書の自動更新（ドメイン設定後に有効）
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

# Dockerログのクリーンアップ
(crontab -l 2>/dev/null; echo "0 2 * * 0 docker system prune -af --filter 'until=168h' > /dev/null 2>&1") | crontab -
echo -e "${GREEN}✓ cronジョブを設定しました${NC}"

# ステップ10: システムリソース監視の設定
echo -e "${YELLOW}📊 システム監視を設定中...${NC}"
# ログローテーション設定
cat > /etc/logrotate.d/oriental-synergy <<EOF
/var/log/nginx/oriental-synergy-*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \$(cat /var/run/nginx.pid)
    endscript
}
EOF
echo -e "${GREEN}✓ ログローテーションを設定しました${NC}"

# ステップ11: システム情報表示
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ セットアップが完了しました！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${BLUE}📋 システム情報:${NC}"
echo "  OS: $(lsb_release -d | cut -f2)"
echo "  Docker: $(docker --version)"
echo "  Docker Compose: $(docker-compose --version)"
echo "  Nginx: $(nginx -v 2>&1)"
echo ""
echo -e "${BLUE}📁 アプリケーションディレクトリ:${NC}"
echo "  ${APP_DIR}"
echo ""
echo -e "${BLUE}🔐 セキュリティ設定:${NC}"
echo "  ✓ ファイアウォール (UFW) 有効"
echo "  ✓ fail2ban 有効"
echo "  ✓ SSH (ポート 22) 許可"
echo "  ✓ HTTP/HTTPS (ポート 80/443) 許可"
echo ""
echo -e "${YELLOW}次のステップ:${NC}"
echo "1. アプリケーションファイルを ${APP_DIR} にアップロード"
echo "2. 環境変数ファイル (.env) を設定"
echo "3. Nginx設定ファイルを配置"
echo "4. docker-compose.prod.yml でアプリケーションを起動"
echo ""
echo -e "${BLUE}📝 便利なコマンド:${NC}"
echo "  ファイアウォール状態: sudo ufw status"
echo "  Dockerコンテナ一覧: docker ps"
echo "  Nginxテスト: sudo nginx -t"
echo "  システムリソース: htop"
echo ""








