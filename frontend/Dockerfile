# ============================================================================
# オリエンタルシナジー フロントエンド Dockerfile
# ============================================================================

FROM node:18-alpine AS base

# 作業ディレクトリ設定
WORKDIR /app

# 依存関係のインストール用
FROM base AS deps

# package.json と package-lock.json をコピー
COPY package.json package-lock.json* ./
RUN npm ci

# ============================================================================
# 開発環境
# ============================================================================
FROM base AS development

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# ポート公開
EXPOSE 3000

# 開発サーバー起動
CMD ["npm", "run", "dev"]

# ============================================================================
# ビルド環境
# ============================================================================
FROM base AS builder

# 依存関係をコピー
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数設定（ビルド時）
ENV NEXT_TELEMETRY_DISABLED 1

# ビルド実行
RUN npm run build

# ============================================================================
# 本番環境
# ============================================================================
FROM base AS production

# 環境変数設定
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# 非rootユーザー作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/public ./public

# ビルド成果物をコピー
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 非rootユーザーに切り替え
USER nextjs

# ポート公開
EXPOSE 3000

# 環境変数設定
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 本番サーバー起動
CMD ["node", "server.js"]

