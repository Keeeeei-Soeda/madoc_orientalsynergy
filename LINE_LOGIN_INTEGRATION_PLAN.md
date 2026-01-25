# LINEログイン連携 実装計画書

## 📋 概要

社員がLINEアカウントを使用してログイン・予約登録できるようにする機能の実装計画です。

---

## 🎯 目的とメリット

### なぜLINEログインを導入するのか？

1. **利便性の向上**
   - パスワード不要でログイン可能
   - LINEアプリから直接アクセス
   - 個別アカウント管理が不要

2. **セキュリティの向上**
   - LINE側の認証を利用
   - 本人確認が容易
   - パスワード漏洩リスクなし

3. **ユーザー体験の改善**
   - ワンタップログイン
   - 既存のLINEアカウントを使用
   - 社員ごとに個別管理可能

4. **トレーサビリティ**
   - 誰が登録したか追跡可能
   - LINE IDで一意に識別
   - 共通アカウントの問題を解決

---

## 🔄 LINEログインのフロー

### 基本的な認証フロー（OAuth 2.0）

```
┌──────────┐                                    ┌──────────┐
│  社員    │                                    │ システム │
│（ブラウザ）│                                    │（バックエンド）│
└──────────┘                                    └──────────┘
     │                                                │
     │ 1. ログインボタンをクリック                      │
     │ ────────────────────────────────────────────>  │
     │                                                │
     │ 2. LINE認証ページへリダイレクト                  │
     │ <────────────────────────────────────────────  │
     │                                                │
┌──────────┐                                         │
│   LINE   │                                         │
│ 認証サーバー │                                         │
└──────────┘                                         │
     │                                                │
     │ 3. LINEアプリで認証                             │
     │ （ユーザーがLINEアカウントで承認）                │
     │                                                │
     │ 4. 認可コードを返却（リダイレクト）               │
     │ ─────────────────────────────────────────────> │
     │                                                │
     │ 5. 認可コードを送信                             │
     │ ──────────────────────────────────────────────>│
     │                                                │
     │                                           ┌───────┐
     │                                           │ LINE  │
     │                                           │ API   │
     │                                           └───────┘
     │                                                │
     │                             6. アクセストークンを取得│
     │                             <───────────────────│
     │                                                │
     │                             7. ユーザー情報を取得 │
     │                             ───────────────────>│
     │                             <───────────────────│
     │                                                │
     │ 8. JWTトークンを発行                            │
     │ <──────────────────────────────────────────────│
     │                                                │
     │ 9. ログイン完了・ダッシュボードへ                 │
     │ <──────────────────────────────────────────────│
     │                                                │
```

### 詳細なステップ

1. **社員がログインボタンをクリック**
   - フロントエンド: `/login` ページ

2. **LINE認証ページへリダイレクト**
   ```
   https://access.line.me/oauth2/v2.1/authorize
     ?response_type=code
     &client_id={YOUR_CHANNEL_ID}
     &redirect_uri={YOUR_CALLBACK_URL}
     &state={RANDOM_STRING}
     &scope=profile%20openid%20email
   ```

3. **ユーザーがLINEアプリで承認**
   - LINEアプリが起動
   - 「ログインを許可しますか？」画面
   - ユーザーが承認

4. **認可コードが返却される**
   ```
   https://your-domain.com/auth/line/callback
     ?code=AUTHORIZATION_CODE
     &state=RANDOM_STRING
   ```

5. **バックエンドがアクセストークンを取得**
   ```
   POST https://api.line.me/oauth2/v2.1/token
   Content-Type: application/x-www-form-urlencoded
   
   grant_type=authorization_code
   &code=AUTHORIZATION_CODE
   &redirect_uri={YOUR_CALLBACK_URL}
   &client_id={YOUR_CHANNEL_ID}
   &client_secret={YOUR_CHANNEL_SECRET}
   ```

6. **ユーザー情報を取得**
   ```
   GET https://api.line.me/v2/profile
   Authorization: Bearer {ACCESS_TOKEN}
   ```
   
   レスポンス例：
   ```json
   {
     "userId": "U1234567890abcdef1234567890abcdef",
     "displayName": "山田太郎",
     "pictureUrl": "https://profile.line-scdn.net/...",
     "statusMessage": "Hello, LINE!"
   }
   ```

7. **システムのJWTトークンを発行**
   - LINE IDとユーザー情報を紐付け
   - 既存ユーザーならログイン
   - 新規ユーザーなら登録

8. **ログイン完了**

---

## 🛠️ 実装に必要な準備

### 1. LINE Developers への登録

#### ステップ1: プロバイダーの作成
```
1. https://developers.line.biz/ にアクセス
2. 「プロバイダーを作成」をクリック
3. プロバイダー名を入力（例: Oriental Synergy）
```

#### ステップ2: LINEログインチャネルの作成
```
1. 作成したプロバイダーを選択
2. 「チャネルを作成」→「LINEログイン」を選択
3. 必要事項を入力:
   - チャネル名: Oriental Synergy 社員ログイン
   - チャネル説明: 社員用予約登録システム
   - アプリタイプ: ウェブアプリ
```

#### ステップ3: チャネル設定
```
1. コールバックURLを設定:
   - 開発環境: http://localhost:3000/auth/line/callback
   - 本番環境: https://your-domain.com/auth/line/callback

2. 必要な権限（スコープ）を設定:
   - profile: プロフィール情報（必須）
   - openid: OpenID Connect（推奨）
   - email: メールアドレス（オプション）
```

#### ステップ4: 認証情報を取得
```
以下の情報をメモ:
- Channel ID: 1234567890
- Channel Secret: abcdef1234567890abcdef1234567890
```

---

## 📊 データベース設計

### 1. Userテーブルの修正

**追加フィールド:**

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=True)  # nullable=Trueに変更
    password_hash = Column(String(255), nullable=True)  # nullable=Trueに変更
    name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)
    
    # LINE連携用フィールド（新規追加）
    line_id = Column(String(255), unique=True, nullable=True, index=True)
    line_display_name = Column(String(100), nullable=True)
    line_picture_url = Column(Text, nullable=True)
    line_access_token = Column(Text, nullable=True)  # 暗号化推奨
    line_refresh_token = Column(Text, nullable=True)  # 暗号化推奨
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

### 2. 新しいテーブル: line_registrations（オプション）

社員がLINEアカウントを登録する際の一時データを保存

```python
class LineRegistration(Base):
    """LINE登録申請テーブル"""
    __tablename__ = "line_registrations"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    line_id = Column(String(255), unique=True, nullable=False)
    line_display_name = Column(String(100))
    line_picture_url = Column(Text)
    
    # 社員情報
    employee_name = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    position = Column(String(100))
    phone = Column(String(20))
    email = Column(String(255))
    
    # ステータス
    status = Column(String(20), default='pending')  # pending, approved, rejected
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

---

## 🔧 実装内容

### 1. バックエンド実装

#### 1-1. 環境変数の設定

**ファイル:** `backend/.env`

```bash
# LINE Login Configuration
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=abcdef1234567890abcdef1234567890
LINE_CALLBACK_URL=http://localhost:3000/auth/line/callback
LINE_LOGIN_BASE_URL=https://access.line.me/oauth2/v2.1
LINE_API_BASE_URL=https://api.line.me
```

#### 1-2. LINE認証エンドポイントの実装

**ファイル:** `backend/app/api/v1/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
import requests
import secrets

router = APIRouter()

# LINE認証URLを生成
@router.get("/auth/line/url")
def get_line_login_url():
    """
    LINE認証URLを生成して返す
    """
    state = secrets.token_urlsafe(32)  # CSRF対策用のランダム文字列
    
    # Redisなどに一時保存（5分間有効）
    # redis.setex(f"line_state:{state}", 300, "valid")
    
    params = {
        "response_type": "code",
        "client_id": settings.LINE_CHANNEL_ID,
        "redirect_uri": settings.LINE_CALLBACK_URL,
        "state": state,
        "scope": "profile openid email"
    }
    
    auth_url = f"{settings.LINE_LOGIN_BASE_URL}/authorize"
    query_string = "&".join([f"{k}={v}" for k, v in params.items()])
    
    return {
        "url": f"{auth_url}?{query_string}",
        "state": state
    }


# LINEコールバック処理
@router.get("/auth/line/callback")
async def line_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    LINEからのコールバックを処理
    """
    # 1. stateを検証（CSRF対策）
    # stored_state = redis.get(f"line_state:{state}")
    # if not stored_state:
    #     raise HTTPException(status_code=400, detail="Invalid state")
    
    # 2. アクセストークンを取得
    token_response = requests.post(
        f"{settings.LINE_API_BASE_URL}/oauth2/v2.1/token",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.LINE_CALLBACK_URL,
            "client_id": settings.LINE_CHANNEL_ID,
            "client_secret": settings.LINE_CHANNEL_SECRET
        }
    )
    
    if token_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Failed to get access token"
        )
    
    token_data = token_response.json()
    line_access_token = token_data["access_token"]
    
    # 3. ユーザー情報を取得
    profile_response = requests.get(
        f"{settings.LINE_API_BASE_URL}/v2/profile",
        headers={"Authorization": f"Bearer {line_access_token}"}
    )
    
    if profile_response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Failed to get profile"
        )
    
    profile_data = profile_response.json()
    line_user_id = profile_data["userId"]
    line_display_name = profile_data.get("displayName")
    line_picture_url = profile_data.get("pictureUrl")
    
    # 4. ユーザーを検索または作成
    user = db.query(User).filter(User.line_id == line_user_id).first()
    
    if user:
        # 既存ユーザー: ログイン
        user.line_access_token = line_access_token
        user.line_display_name = line_display_name
        user.line_picture_url = line_picture_url
        user.updated_at = func.now()
        db.commit()
        
        # JWTトークンを発行
        access_token = create_access_token(data={"sub": str(user.id)})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }
    else:
        # 新規ユーザー: 登録画面へ
        # 一時トークンを発行
        temp_token = secrets.token_urlsafe(32)
        
        # Redisに一時保存（10分間有効）
        # redis.setex(
        #     f"line_temp:{temp_token}",
        #     600,
        #     json.dumps({
        #         "line_id": line_user_id,
        #         "display_name": line_display_name,
        #         "picture_url": line_picture_url,
        #         "access_token": line_access_token
        #     })
        # )
        
        return {
            "status": "registration_required",
            "temp_token": temp_token,
            "line_user": {
                "userId": line_user_id,
                "displayName": line_display_name,
                "pictureUrl": line_picture_url
            }
        }


# LINE登録完了
@router.post("/auth/line/register")
async def complete_line_registration(
    temp_token: str,
    company_code: str,
    employee_name: str,
    department: str,
    position: Optional[str] = None,
    phone: Optional[str] = None,
    email: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    LINE登録を完了する
    """
    # 1. 一時トークンから情報を取得
    # line_data = redis.get(f"line_temp:{temp_token}")
    # if not line_data:
    #     raise HTTPException(status_code=400, detail="Invalid or expired token")
    
    # line_info = json.loads(line_data)
    
    # 2. 企業コードを検証
    company = db.query(Company).filter(
        Company.company_code == company_code
    ).first()
    
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # 3. ユーザーを作成
    new_user = User(
        name=employee_name,
        role=UserRole.EMPLOYEE,
        is_active=True,
        company_id=company.id,
        line_id=line_info["line_id"],
        line_display_name=line_info["display_name"],
        line_picture_url=line_info["picture_url"],
        line_access_token=line_info["access_token"]
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # 4. 登録申請を記録（承認フローがある場合）
    # registration = LineRegistration(
    #     company_id=company.id,
    #     line_id=line_info["line_id"],
    #     employee_name=employee_name,
    #     department=department,
    #     ...
    # )
    # db.add(registration)
    # db.commit()
    
    # 5. JWTトークンを発行
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user
    }
```

---

### 2. フロントエンド実装

#### 2-1. LINEログインボタンの追加

**ファイル:** `frontend/src/app/login/page.tsx`

```tsx
'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import { lineAuthApi } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  
  // 通常のログイン（既存）
  const handleLogin = async (e: React.FormEvent) => {
    // ... 既存のコード
  }
  
  // LINEログイン（新規）
  const handleLineLogin = async () => {
    try {
      // LINE認証URLを取得
      const { url, state } = await lineAuthApi.getLoginUrl()
      
      // stateをセッションストレージに保存
      sessionStorage.setItem('line_login_state', state)
      
      // LINE認証ページへリダイレクト
      window.location.href = url
    } catch (error) {
      console.error('LINEログインエラー:', error)
      alert('LINEログインに失敗しました')
    }
  }
  
  return (
    <div className="login-page">
      <div className="card">
        <div className="card-body">
          <h3 className="text-center mb-4">ログイン</h3>
          
          {/* 通常のログインフォーム（既存） */}
          <form onSubmit={handleLogin}>
            {/* ... */}
            <button type="submit" className="btn btn-primary w-100">
              ログイン
            </button>
          </form>
          
          {/* 区切り線 */}
          <div className="divider my-4">
            <span>または</span>
          </div>
          
          {/* LINEログインボタン（新規） */}
          <button
            type="button"
            className="btn btn-success w-100"
            onClick={handleLineLogin}
          >
            <i className="bi bi-line me-2"></i>
            LINEでログイン
          </button>
          
          <p className="text-center text-muted small mt-3">
            ※ LINEログインは社員の方のみご利用いただけます
          </p>
        </div>
      </div>
      
      <style jsx>{`
        .divider {
          text-align: center;
          position: relative;
        }
        
        .divider::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: #dee2e6;
          z-index: 0;
        }
        
        .divider span {
          background: white;
          padding: 0 1rem;
          position: relative;
          z-index: 1;
          color: #6c757d;
        }
      `}</style>
    </div>
  )
}
```

#### 2-2. LINEコールバックページの作成

**ファイル:** `frontend/src/app/auth/line/callback/page.tsx`

```tsx
'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { lineAuthApi } from '@/lib/api'
import Cookies from 'js-cookie'

export default function LineCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      
      if (!code || !state) {
        setError('認証情報が不正です')
        setLoading(false)
        return
      }
      
      // stateを検証
      const savedState = sessionStorage.getItem('line_login_state')
      if (savedState !== state) {
        setError('認証状態が一致しません')
        setLoading(false)
        return
      }
      
      try {
        // バックエンドのコールバックAPIを呼び出し
        const result = await lineAuthApi.handleCallback(code, state)
        
        if (result.status === 'registration_required') {
          // 新規ユーザー: 登録画面へ
          sessionStorage.setItem('line_temp_token', result.temp_token)
          sessionStorage.setItem('line_user', JSON.stringify(result.line_user))
          router.push('/auth/line/register')
        } else {
          // 既存ユーザー: ログイン完了
          Cookies.set('access_token', result.access_token, { expires: 7 })
          router.push('/employee/bookings')
        }
      } catch (err) {
        setError('認証処理に失敗しました')
        setLoading(false)
      }
    }
    
    handleCallback()
  }, [searchParams, router])
  
  if (loading) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" role="status">
            <span className="visually-hidden">処理中...</span>
          </div>
          <p className="text-muted">LINEログイン処理中...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <i className="bi bi-exclamation-triangle text-danger fs-1 mb-3"></i>
          <p className="text-danger">{error}</p>
          <button
            className="btn btn-primary mt-3"
            onClick={() => router.push('/login')}
          >
            ログインページへ戻る
          </button>
        </div>
      </div>
    )
  }
  
  return null
}
```

#### 2-3. LINE登録画面の作成

**ファイル:** `frontend/src/app/auth/line/register/page.tsx`

```tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { lineAuthApi } from '@/lib/api'

export default function LineRegisterPage() {
  const router = useRouter()
  const [lineUser, setLineUser] = useState<any>(null)
  const [formData, setFormData] = useState({
    company_code: '',
    employee_name: '',
    department: '',
    position: '',
    phone: '',
    email: '',
  })
  const [submitting, setSubmitting] = useState(false)
  
  useEffect(() => {
    // LINEユーザー情報を取得
    const lineUserData = sessionStorage.getItem('line_user')
    if (lineUserData) {
      setLineUser(JSON.parse(lineUserData))
    } else {
      // LINEユーザー情報がない場合はログインページへ
      router.push('/login')
    }
  }, [router])
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.company_code || !formData.employee_name || !formData.department) {
      alert('必須項目を入力してください')
      return
    }
    
    try {
      setSubmitting(true)
      
      const tempToken = sessionStorage.getItem('line_temp_token')
      if (!tempToken) {
        throw new Error('一時トークンが見つかりません')
      }
      
      const result = await lineAuthApi.completeRegistration({
        temp_token: tempToken,
        ...formData
      })
      
      // トークンを保存
      Cookies.set('access_token', result.access_token, { expires: 7 })
      
      // セッションストレージをクリア
      sessionStorage.removeItem('line_temp_token')
      sessionStorage.removeItem('line_user')
      sessionStorage.removeItem('line_login_state')
      
      alert('登録が完了しました！')
      router.push('/employee/bookings')
    } catch (error) {
      alert('登録に失敗しました: ' + (error instanceof Error ? error.message : ''))
    } finally {
      setSubmitting(false)
    }
  }
  
  if (!lineUser) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">読み込み中...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8 col-lg-6">
          <div className="card">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">
                <i className="bi bi-line me-2"></i>
                LINE登録
              </h4>
            </div>
            <div className="card-body">
              {/* LINEユーザー情報表示 */}
              <div className="alert alert-info mb-4">
                <div className="d-flex align-items-center">
                  {lineUser.pictureUrl && (
                    <img
                      src={lineUser.pictureUrl}
                      alt="プロフィール画像"
                      className="rounded-circle me-3"
                      style={{ width: 50, height: 50 }}
                    />
                  )}
                  <div>
                    <strong>LINEアカウント</strong>
                    <br />
                    {lineUser.displayName}
                  </div>
                </div>
              </div>
              
              {/* 登録フォーム */}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="company_code" className="form-label">
                    企業コード <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="company_code"
                    value={formData.company_code}
                    onChange={(e) => setFormData({...formData, company_code: e.target.value})}
                    required
                    placeholder="例: COMP001"
                  />
                  <small className="text-muted">
                    ※ 企業担当者から提供された企業コードを入力してください
                  </small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="employee_name" className="form-label">
                    氏名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="employee_name"
                    value={formData.employee_name}
                    onChange={(e) => setFormData({...formData, employee_name: e.target.value})}
                    required
                    placeholder="例: 山田太郎"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="department" className="form-label">
                    部署 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required
                    placeholder="例: 営業部"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="position" className="form-label">
                    役職
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData({...formData, position: e.target.value})}
                    placeholder="例: 課長"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">
                    電話番号
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="例: 090-1234-5678"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="例: yamada@example.com"
                  />
                </div>
                
                <div className="d-grid gap-2">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        登録中...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2"></i>
                        登録する
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => router.push('/login')}
                    disabled={submitting}
                  >
                    キャンセル
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

## 📱 運用フロー

### パターン1: 初回登録（承認フローなし）

```
1. 社員がLINEログインボタンをクリック
   ↓
2. LINEアプリで認証
   ↓
3. 登録画面へリダイレクト
   ↓
4. 企業コード + 社員情報を入力
   ↓
5. 登録完了
   ↓
6. /employee/bookings へ自動遷移
```

### パターン2: 初回登録（承認フローあり）

```
1. 社員がLINEログインボタンをクリック
   ↓
2. LINEアプリで認証
   ↓
3. 登録画面へリダイレクト
   ↓
4. 企業コード + 社員情報を入力
   ↓
5. 「登録申請を送信しました」メッセージ
   ↓
6. 企業担当者または管理者が承認
   ↓
7. 承認後、社員にLINE通知
   ↓
8. 再度LINEログインでアクセス可能
```

### パターン3: 2回目以降のログイン

```
1. 社員がLINEログインボタンをクリック
   ↓
2. LINEアプリで認証
   ↓
3. /employee/bookings へ自動遷移
   （登録画面は表示されない）
```

---

## 🎨 ユーザー体験

### メリット

1. **超簡単ログイン**
   - パスワード不要
   - LINEアプリでワンタップ
   - 覚えるのは企業コードだけ

2. **個別管理**
   - 社員ごとに個別アカウント
   - 誰が登録したか追跡可能
   - 共通アカウントの問題を解決

3. **セキュリティ**
   - LINE側の認証を利用
   - 本人確認が容易
   - パスワード漏洩リスクなし

### デメリット

1. **LINE必須**
   - LINEアカウントがないと使えない
   - 日本国内限定（海外では普及率低い）

2. **初回登録の手間**
   - 企業コードの入力が必要
   - 社員情報の入力が必要

---

## 🔒 セキュリティ対策

### 1. CSRF対策
- `state`パラメータを使用
- ランダム文字列を生成して検証

### 2. トークン管理
- アクセストークンは暗号化して保存
- 定期的なトークン更新

### 3. 企業コード
- 推測困難なランダム文字列
- 企業ごとに一意
- 定期的な更新を推奨

### 4. 承認フロー（オプション）
- 管理者承認が必要
- なりすまし防止

---

## 💰 コスト

### LINE Developersの利用料金

**無料**
- LINEログイン機能は無料で利用可能
- API呼び出し制限なし
- ユーザー数制限なし

### 開発・運用コスト

| 項目 | 工数/コスト |
|------|-----------|
| LINE Developers登録 | 1時間 |
| バックエンド実装 | 8時間 |
| フロントエンド実装 | 8時間 |
| テスト | 4時間 |
| ドキュメント作成 | 2時間 |
| **合計** | **約23時間（3日）** |

---

## 📊 実装優先度

### Phase 1: 基本的なLINEログイン
- LINEログインボタンの追加
- 認証フロー実装
- 新規ユーザー登録
- **工数: 約16時間（2日）**

### Phase 2: 承認フロー
- 登録申請機能
- 管理者承認画面
- LINE通知機能
- **工数: 約8時間（1日）**

### Phase 3: 既存ユーザー連携
- 既存の社員共通アカウントからLINEへの移行
- データマイグレーション
- **工数: 約4時間**

---

## ⚠️ 注意点

### 1. LINE Business IDが必要
- LINE Developersへの登録にはLINE Business IDが必要
- 企業の代表者または担当者が登録

### 2. プライバシーポリシー必須
- LINEログインを使用する場合、プライバシーポリシーの掲載が必須
- LINE Developersの審査で確認される

### 3. 企業コードの管理
- 企業コードの生成・管理方法
- 紛失時の対応フロー
- セキュリティ対策

### 4. テスト環境
- LINE Developersで開発用チャネルを作成
- 本番環境とは別のチャネルを使用

---

## 🚀 実装開始前のチェックリスト

- [ ] LINE Business IDの取得
- [ ] LINE Developersへの登録
- [ ] LINEログインチャネルの作成
- [ ] Channel ID / Channel Secretの取得
- [ ] コールバックURLの設定
- [ ] プライバシーポリシーの準備
- [ ] 企業コード生成ルールの決定
- [ ] 承認フローの有無を決定
- [ ] 既存ユーザーの移行方針を決定

---

## 📝 まとめ

### LINEログイン連携は以下の流れで進めます:

1. **準備**（1時間）
   - LINE Developersへの登録
   - チャネル作成
   - 認証情報取得

2. **実装**（16時間 / 2日）
   - バックエンドAPI実装
   - フロントエンド実装
   - 認証フロー構築

3. **テスト**（4時間）
   - 新規登録テスト
   - ログインテスト
   - エラーハンドリング確認

4. **運用開始**
   - 企業コードの発行
   - 社員への案内
   - サポート体制の構築

### メリット
- ✅ パスワード不要で簡単ログイン
- ✅ 個別アカウント管理
- ✅ セキュリティ向上
- ✅ ユーザー体験の改善

### 推奨タイミング
- 社員共通アカウント（EMPLOYEE）の実装後
- ある程度ユーザーが増えてから
- セキュリティ要件が高まったとき

---

最終更新日: 2026年1月23日

