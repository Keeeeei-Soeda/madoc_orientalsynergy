#!/bin/bash
# ============================================================================
# クイックアップロードスクリプト
# すべてのファイルを一度にアップロード
# ============================================================================

set -e

cd /Users/soedakei/madoc_line

echo "========================================="
echo "Oriental Synergy - VPSへアップロード"
echo "========================================="
echo ""
echo "VPSのrootパスワードを6回入力する必要があります"
echo ""
read -p "続行しますか? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 0
fi

echo ""
echo "1/6 backend/ をアップロード中..."
scp -r backend/ root@162.43.15.173:/var/www/oriental-synergy/

echo ""
echo "2/6 frontend/ をアップロード中..."
scp -r frontend/ root@162.43.15.173:/var/www/oriental-synergy/

echo ""
echo "3/6 docker-compose.prod.yml をアップロード中..."
scp docker-compose.prod.yml root@162.43.15.173:/var/www/oriental-synergy/

echo ""
echo "4/6 nginx.conf.template をアップロード中..."
scp nginx.conf.template root@162.43.15.173:/var/www/oriental-synergy/

echo ""
echo "5/6 vps-setup.sh をアップロード中..."
scp vps-setup.sh root@162.43.15.173:/var/www/oriental-synergy/

echo ""
echo "6/6 deploy.sh をアップロード中..."
scp deploy.sh root@162.43.15.173:/var/www/oriental-synergy/

echo ""
echo "========================================="
echo "✅ アップロード完了！"
echo "========================================="
echo ""
echo "次のステップ:"
echo "1. VPSにSSH接続: ssh root@162.43.15.173"
echo "2. ディレクトリ移動: cd /var/www/oriental-synergy"
echo "3. COMMANDS.txt の手順を実行"
echo ""






