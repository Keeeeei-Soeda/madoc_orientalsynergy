"""
FastAPI アプリケーション本体
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .api.v1 import auth, users, companies, staff, employees, reservations, attendance, ratings, assignments, upload
import os

# FastAPIアプリケーションの作成
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Oriental Synergy 派遣業務管理システム API",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ヘルスチェックエンドポイント
@app.get("/", tags=["Health"])
async def root():
    """ルートエンドポイント"""
    return {
        "message": "Oriental Synergy API",
        "version": settings.APP_VERSION,
        "status": "healthy"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """ヘルスチェック"""
    return {"status": "ok"}


# APIルーターの登録
app.include_router(auth.router, prefix="/api/v1", tags=["Authentication"])
app.include_router(users.router, prefix="/api/v1", tags=["Users"])
app.include_router(companies.router, prefix="/api/v1", tags=["Companies"])
app.include_router(staff.router, prefix="/api/v1", tags=["Staff"])
app.include_router(employees.router, prefix="/api/v1", tags=["Employees"])
app.include_router(reservations.router, prefix="/api/v1", tags=["Reservations"])
app.include_router(attendance.router, prefix="/api/v1", tags=["Attendance"])
app.include_router(ratings.router, prefix="/api/v1", tags=["Ratings"])
app.include_router(assignments.router, prefix="/api/v1", tags=["Assignments"])
app.include_router(upload.router, prefix="/api/v1", tags=["Upload"])


# 静的ファイルの配信設定（アップロードされた画像）
UPLOAD_DIR = "./uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# 起動時の処理
@app.on_event("startup")
async def startup_event():
    """アプリケーション起動時の処理"""
    print("🚀 Oriental Synergy API が起動しました")
    print(f"📝 ドキュメント: http://localhost:8000/api/docs")


# 終了時の処理
@app.on_event("shutdown")
async def shutdown_event():
    """アプリケーション終了時の処理"""
    print("👋 Oriental Synergy API が終了しました")

