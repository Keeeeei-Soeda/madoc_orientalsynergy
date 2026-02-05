#!/bin/bash
# SSH接続テストスクリプト

echo "🔍 VPSへのSSH接続をテストします..."
echo ""

VPS_HOST="162.43.15.173"
VPS_USER="root"

echo "接続先: ${VPS_USER}@${VPS_HOST}"
echo ""

# 接続テスト
echo "接続を試みます（パスワード入力が必要な場合があります）..."
ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} << 'SSH_CMD'
echo "✅ SSH接続成功！"
echo ""
echo "📋 システム情報:"
hostname
uname -a
echo ""
echo "📦 Dockerコンテナの状態:"
cd /var/www/oriental-synergy 2>/dev/null && docker-compose -f docker-compose.production.yml ps || echo "Docker Composeが見つかりません"
SSH_CMD

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 接続テスト成功！"
else
    echo ""
    echo "❌ 接続に失敗しました"
    echo ""
    echo "考えられる原因:"
    echo "  1. パスワードが間違っている"
    echo "  2. VPSが停止している"
    echo "  3. ファイアウォールでSSHポートがブロックされている"
    echo ""
    echo "手動で接続を試みてください:"
    echo "  ssh ${VPS_USER}@${VPS_HOST}"
fi
