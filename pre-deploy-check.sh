#!/bin/bash
# ============================================================================
# デプロイ前チェックスクリプト
# VPSにアップロードする前に実行して、必要なファイルが揃っているか確認
# ============================================================================

set -e

# 色付きメッセージ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Oriental Synergy デプロイ前チェック${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

ERRORS=0
WARNINGS=0

# チェック関数
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1 ${RED}(見つかりません)${NC}"
        ((ERRORS++))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/ ${RED}(見つかりません)${NC}"
        ((ERRORS++))
    fi
}

warn_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${YELLOW}⚠${NC} $1 ${YELLOW}(推奨)${NC}"
        ((WARNINGS++))
    fi
}

# 1. 必須ファイルのチェック
echo -e "${BLUE}📋 必須ファイルのチェック...${NC}"

check_file "docker-compose.prod.yml"
check_file "backend/Dockerfile"
check_file "frontend/Dockerfile"
check_file "backend/requirements.txt"
check_file "frontend/package.json"
check_file "backend/app/main.py"
check_file "backend/init_db.py"
check_file "nginx.conf.template"

echo ""

# 2. ディレクトリ構造のチェック
echo -e "${BLUE}📁 ディレクトリ構造のチェック...${NC}"

check_dir "backend"
check_dir "backend/app"
check_dir "backend/app/api"
check_dir "backend/app/models"
check_dir "backend/app/schemas"
check_dir "frontend"
check_dir "frontend/src"
check_dir "frontend/src/app"
check_dir "frontend/src/components"

echo ""

# 3. 環境変数ファイルのチェック
echo -e "${BLUE}🔐 環境変数ファイルのチェック...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠${NC} backend/.env ${YELLOW}(VPS上で作成が必要)${NC}"
    check_file "backend/env.production.example"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} backend/.env"
    
    # SECRET_KEYのチェック
    if grep -q "CHANGE_THIS_TO_RANDOM_64_CHAR_STRING" backend/.env 2>/dev/null; then
        echo -e "${RED}  ✗ SECRET_KEYがデフォルトのままです${NC}"
        ((ERRORS++))
    fi
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠${NC} frontend/.env.local ${YELLOW}(VPS上で作成が必要)${NC}"
    check_file "frontend/env.production.example"
    ((WARNINGS++))
else
    echo -e "${GREEN}✓${NC} frontend/.env.local"
fi

echo ""

# 4. デプロイスクリプトのチェック
echo -e "${BLUE}🚀 デプロイスクリプトのチェック...${NC}"

check_file "deploy.sh"
check_file "vps-setup.sh"

# 実行権限のチェック
if [ -f "deploy.sh" ]; then
    if [ -x "deploy.sh" ]; then
        echo -e "${GREEN}  ✓ deploy.sh は実行可能です${NC}"
    else
        echo -e "${YELLOW}  ⚠ deploy.sh に実行権限がありません${NC}"
        echo -e "${YELLOW}    実行: chmod +x deploy.sh${NC}"
        ((WARNINGS++))
    fi
fi

if [ -f "vps-setup.sh" ]; then
    if [ -x "vps-setup.sh" ]; then
        echo -e "${GREEN}  ✓ vps-setup.sh は実行可能です${NC}"
    else
        echo -e "${YELLOW}  ⚠ vps-setup.sh に実行権限がありません${NC}"
        echo -e "${YELLOW}    実行: chmod +x vps-setup.sh${NC}"
        ((WARNINGS++))
    fi
fi

echo ""

# 5. ドキュメントのチェック
echo -e "${BLUE}📚 ドキュメントのチェック...${NC}"

warn_file "DEPLOYMENT_GUIDE.md"
warn_file "QUICK_DEPLOY_GUIDE.md"
warn_file "README.md"

echo ""

# 6. Dockerfileの検証
echo -e "${BLUE}🐳 Dockerfileの検証...${NC}"

if [ -f "backend/Dockerfile" ]; then
    if grep -q "FROM python" backend/Dockerfile; then
        echo -e "${GREEN}✓${NC} backend/Dockerfile は有効です"
    else
        echo -e "${RED}✗${NC} backend/Dockerfile が無効です"
        ((ERRORS++))
    fi
fi

if [ -f "frontend/Dockerfile" ]; then
    if grep -q "FROM node" frontend/Dockerfile; then
        echo -e "${GREEN}✓${NC} frontend/Dockerfile は有効です"
    else
        echo -e "${RED}✗${NC} frontend/Dockerfile が無効です"
        ((ERRORS++))
    fi
fi

echo ""

# 7. 設定ファイルの検証
echo -e "${BLUE}⚙️ 設定ファイルの検証...${NC}"

if [ -f "docker-compose.prod.yml" ]; then
    if grep -q "version:" docker-compose.prod.yml && grep -q "services:" docker-compose.prod.yml; then
        echo -e "${GREEN}✓${NC} docker-compose.prod.yml は有効です"
    else
        echo -e "${RED}✗${NC} docker-compose.prod.yml が無効です"
        ((ERRORS++))
    fi
fi

if [ -f "nginx.conf.template" ]; then
    if grep -q "upstream backend" nginx.conf.template && grep -q "upstream frontend" nginx.conf.template; then
        echo -e "${GREEN}✓${NC} nginx.conf.template は有効です"
    else
        echo -e "${RED}✗${NC} nginx.conf.template が無効です"
        ((ERRORS++))
    fi
fi

echo ""

# 8. Gitの状態チェック
echo -e "${BLUE}📦 Gitの状態チェック...${NC}"

if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Gitリポジトリが初期化されています"
    
    # 未コミットの変更があるかチェック
    if [ -n "$(git status --porcelain)" ]; then
        echo -e "${YELLOW}  ⚠ 未コミットの変更があります${NC}"
        ((WARNINGS++))
    else
        echo -e "${GREEN}  ✓ すべての変更がコミットされています${NC}"
    fi
    
    # .gitignoreのチェック
    if [ -f ".gitignore" ]; then
        if grep -q "\.env" .gitignore && grep -q "node_modules" .gitignore; then
            echo -e "${GREEN}  ✓ .gitignore が適切に設定されています${NC}"
        else
            echo -e "${YELLOW}  ⚠ .gitignore の設定を確認してください${NC}"
            ((WARNINGS++))
        fi
    fi
else
    echo -e "${YELLOW}⚠${NC} Gitリポジトリが初期化されていません"
    ((WARNINGS++))
fi

echo ""

# 結果のサマリー
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}チェック結果${NC}"
echo -e "${BLUE}========================================${NC}"

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ すべてのチェックに合格しました！${NC}"
    echo -e "${GREEN}デプロイの準備が整っています。${NC}"
    echo ""
    echo -e "${BLUE}次のステップ:${NC}"
    echo "1. VPSにSSH接続"
    echo "   ssh root@162.43.15.173"
    echo ""
    echo "2. プロジェクトファイルをアップロード"
    echo "   scp -r backend/ frontend/ docker-compose.prod.yml nginx.conf.template root@162.43.15.173:/var/www/oriental-synergy/"
    echo ""
    echo "3. QUICK_DEPLOY_GUIDE.md の手順に従ってデプロイ"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠ ${WARNINGS}個の警告があります${NC}"
    echo "デプロイは可能ですが、警告を確認することを推奨します。"
    exit 0
else
    echo -e "${RED}✗ ${ERRORS}個のエラーがあります${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠ ${WARNINGS}個の警告もあります${NC}"
    fi
    echo ""
    echo "エラーを修正してから再度チェックしてください。"
    exit 1
fi








