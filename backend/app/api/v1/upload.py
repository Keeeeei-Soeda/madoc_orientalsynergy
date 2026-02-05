"""
ファイルアップロードAPI
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from datetime import datetime
from ...database import get_db
from ...models.user import User
from ..deps import get_current_active_user

router = APIRouter()

# アップロードディレクトリ
UPLOAD_DIR = "./uploads"
PROFILE_PHOTO_DIR = os.path.join(UPLOAD_DIR, "profile_photos")

# ディレクトリが存在しない場合は作成
os.makedirs(PROFILE_PHOTO_DIR, exist_ok=True)

# 許可される画像拡張子
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def is_allowed_file(filename: str) -> bool:
    """ファイル拡張子チェック"""
    ext = os.path.splitext(filename)[1].lower()
    return ext in ALLOWED_EXTENSIONS


@router.post("/upload/profile-photo")
async def upload_profile_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    プロフィール写真をアップロード
    
    Args:
        file: アップロードファイル
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        dict: アップロードされたファイルのURL
        
    Raises:
        HTTPException: ファイルが不正な場合
    """
    # ファイル名チェック
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ファイルが選択されていません"
        )
    
    # 拡張子チェック
    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"許可されていないファイル形式です。{', '.join(ALLOWED_EXTENSIONS)} のみアップロード可能です"
        )
    
    # ファイルサイズチェック
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"ファイルサイズが大きすぎます。最大 {MAX_FILE_SIZE // (1024 * 1024)}MB まで"
        )
    
    # ユニークなファイル名を生成（タイムスタンプ + UUID + 元の拡張子）
    ext = os.path.splitext(file.filename)[1].lower()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_filename = f"{current_user.id}_{timestamp}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(PROFILE_PHOTO_DIR, unique_filename)
    
    # ファイルを保存
    try:
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの保存に失敗しました: {str(e)}"
        )
    
    # URLを返す（実際の環境では、公開URLを返す）
    file_url = f"/uploads/profile_photos/{unique_filename}"
    
    return {
        "success": True,
        "file_url": file_url,
        "filename": unique_filename
    }


@router.delete("/upload/profile-photo")
async def delete_profile_photo(
    file_url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    プロフィール写真を削除
    
    Args:
        file_url: ファイルURL
        db: データベースセッション
        current_user: 現在のユーザー
        
    Returns:
        dict: 削除結果
    """
    # ファイル名を抽出
    filename = os.path.basename(file_url)
    file_path = os.path.join(PROFILE_PHOTO_DIR, filename)
    
    # ファイルが存在するかチェック
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ファイルが見つかりません"
        )
    
    # ファイルを削除
    try:
        os.remove(file_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"ファイルの削除に失敗しました: {str(e)}"
        )
    
    return {
        "success": True,
        "message": "ファイルを削除しました"
    }

