#!/bin/bash
# ============================================================================
# ログインエラーの診断スクリプト
# ============================================================================

echo "🔍 ログインエラーの原因を診断します..."
echo ""

# 1. ローカル環境の確認
echo "📋 ローカル環境の確認:"
echo "  - バックエンドサーバー（ポート8000）:"
if lsof -i :8000 2>/dev/null | grep -q LISTEN; then
    echo "    ✅ 起動中"
    curl -s http://localhost:8000/health | head -1 || echo "    ⚠️  ヘルスチェックに失敗"
else
    echo "    ❌ 停止中"
fi

echo ""
echo "  - フロントエンドサーバー（ポート3000）:"
if lsof -i :3000 2>/dev/null | grep -q LISTEN; then
    echo "    ✅ 起動中"
else
    echo "    ❌ 停止中"
fi

echo ""
echo "📋 フロントエンドの環境変数確認:"
if [ -f "frontend/.env.local" ]; then
    echo "  ✅ .env.local が存在します"
    echo "  NEXT_PUBLIC_API_URL:"
    grep NEXT_PUBLIC_API_URL frontend/.env.local || echo "    ⚠️  設定されていません"
else
    echo "  ⚠️  .env.local が存在しません"
    echo "  → デフォルトで localhost:8000 が使用されます"
fi

echo ""
echo "🌐 VPSの状態確認（SSH接続が必要）:"
echo "  以下のコマンドをVPSで実行してください:"
echo ""
echo "  ssh root@162.43.15.173"
echo "  cd /var/www/oriental-synergy"
echo "  docker-compose -f docker-compose.production.yml ps"
echo "  docker-compose -f docker-compose.production.yml logs --tail=20 backend"
echo ""

echo "💡 考えられる原因:"
echo "  1. ローカル環境で開発している場合:"
echo "     → バックエンドサーバーが起動していない"
echo "     → 解決: cd backend && source venv/bin/activate && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo ""
echo "  2. VPSで実行している場合:"
echo "     → Dockerコンテナが停止している"
echo "     → 解決: ssh root@162.43.15.173 'cd /var/www/oriental-synergy && docker-compose -f docker-compose.production.yml up -d'"
echo ""
echo "  3. 環境変数の設定が間違っている場合:"
echo "     → NEXT_PUBLIC_API_URL が localhost:8000 になっている"
echo "     → 解決: frontend/.env.local に NEXT_PUBLIC_API_URL=http://162.43.15.173:8000/api/v1 を設定"

