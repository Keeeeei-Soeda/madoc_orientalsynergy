# ============================================================================
# オリエンタルシナジー バックエンド Dockerfile
# ============================================================================

FROM python:3.11-slim as base

# 環境変数設定
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# 作業ディレクトリ設定
WORKDIR /app

# システムパッケージのインストール
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ============================================================================
# 開発環境
# ============================================================================
FROM base as development

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードをコピー
COPY . .

# アップロードディレクトリ作成
RUN mkdir -p /app/uploads /app/logs

# ポート公開
EXPOSE 8000

# 開発サーバー起動
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# ============================================================================
# 本番環境
# ============================================================================
FROM base as production

# 非rootユーザー作成
RUN useradd -m -u 1000 appuser

# 依存関係のインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn

# アプリケーションコードをコピー
COPY --chown=appuser:appuser . .

# アップロードディレクトリ作成
RUN mkdir -p /app/uploads /app/logs \
    && chown -R appuser:appuser /app/uploads /app/logs

# 非rootユーザーに切り替え
USER appuser

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/v1/health || exit 1

# ポート公開
EXPOSE 8000

# 本番サーバー起動
CMD ["gunicorn", "app.main:app", \
     "--workers", "4", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]

