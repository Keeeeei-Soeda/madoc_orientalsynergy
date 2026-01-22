"""
ユーザー管理API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ...database import get_db
from ...models.user import User as UserModel
from ...schemas.user import User, UserCreate, UserUpdate
from ...core.security import get_password_hash
from ..deps import get_admin_user

router = APIRouter()


@router.get("/users", response_model=List[User])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """
    ユーザー一覧を取得（管理者のみ）
    
    Args:
        skip: スキップする件数
        limit: 取得する最大件数
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        List[User]: ユーザーのリスト
    """
    users = db.query(UserModel).offset(skip).limit(limit).all()
    return users


@router.get("/users/{user_id}", response_model=User)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """
    ユーザー詳細を取得（管理者のみ）
    
    Args:
        user_id: ユーザーID
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        User: ユーザー情報
        
    Raises:
        HTTPException: ユーザーが見つからない場合
    """
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    return user


@router.post("/users", response_model=User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: UserCreate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """
    ユーザーを作成（管理者のみ）
    
    Args:
        user: 作成するユーザー情報
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        User: 作成されたユーザー
        
    Raises:
        HTTPException: メールアドレスが既に存在する場合
    """
    # メールアドレスの重複チェック
    existing_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # パスワードをハッシュ化
    db_user = UserModel(
        email=user.email,
        password_hash=get_password_hash(user.password),
        name=user.name,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.put("/users/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user: UserUpdate,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """
    ユーザー情報を更新（管理者のみ）
    
    Args:
        user_id: ユーザーID
        user: 更新するユーザー情報
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Returns:
        User: 更新されたユーザー
        
    Raises:
        HTTPException: ユーザーが見つからない場合
    """
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    # 更新
    update_data = user.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if key == "password":
            # パスワードをハッシュ化
            setattr(db_user, "password_hash", get_password_hash(value))
        else:
            setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserModel = Depends(get_admin_user)
):
    """
    ユーザーを削除（管理者のみ）
    
    Args:
        user_id: ユーザーID
        db: データベースセッション
        current_user: 現在のユーザー（管理者権限必須）
        
    Raises:
        HTTPException: ユーザーが見つからない場合
    """
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if db_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with id {user_id} not found"
        )
    
    db.delete(db_user)
    db.commit()
    return None

