#!/bin/bash
# ============================================================================
# VPSの状態確認スクリプト
# 使用方法: VPSにSSH接続後、このスクリプトを実行
# ============================================================================

echo "🔍 VPSの状態を確認します..."
echo ""

# Docker Composeの状態確認
echo "📦 Docker Compose コンテナの状態:"
cd /var/www/oriental-synergy 2>/dev/null || echo "⚠️  アプリケーションディレクトリが見つかりません"
docker-compose -f docker-compose.production.yml ps 2>/dev/null || docker compose -f docker-compose.production.yml ps 2>/dev/null || echo "⚠️  docker-composeコマンドが実行できません"

echo ""
echo "📊 Docker コンテナ一覧:"
docker ps -a | grep oriental || echo "⚠️  コンテナが見つかりません"

echo ""
echo "📝 最近のログ（バックエンド）:"
docker-compose -f docker-compose.production.yml logs --tail=20 backend 2>/dev/null || docker compose -f docker-compose.production.yml logs --tail=20 backend 2>/dev/null || echo "⚠️  ログを取得できません"

echo ""
echo "🔄 Dockerサービスの状態:"
systemctl status docker --no-pager -l || echo "⚠️  systemctlコマンドが実行できません"

echo ""
echo "🌐 ポート使用状況:"
netstat -tulpn | grep -E ":(8000|3000|5432|6379)" || ss -tulpn | grep -E ":(8000|3000|5432|6379)" || echo "⚠️  ポート情報を取得できません"

echo ""
echo "💾 ディスク使用状況:"
df -h | head -5

echo ""
echo "🧠 メモリ使用状況:"
free -h


