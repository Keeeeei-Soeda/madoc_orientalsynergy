# 社員共通アカウント機能 設計書

## 📋 概要

企業ごとに社員共通のアカウントを発行し、社員が予約登録のみを行えるようにする機能の設計書です。

## 🎯 要件

1. **企業ごとに社員共通のアカウントを発行**
   - 1つの企業につき1つの社員用共通アカウント
   - 企業名 + "（社員用）" のような命名規則

2. **社員アカウントでログイン・予約登録が可能**
   - `/company/employee-bookings` ページにのみアクセス可能
   - 募集中の予約一覧を表示
   - 社員情報を入力して参加登録

3. **アクセス制限**
   - 予約登録ページ以外は閲覧不可
   - サイドバーやヘッダーのナビゲーションは非表示

---

## 🏗️ 実装アプローチ

### 方法1: 新しいロール「EMPLOYEE」を追加（推奨）

#### メリット
- 権限を明確に分離できる
- セキュリティが高い
- 将来的な拡張が容易

#### デメリット
- データベーススキーマの変更が必要
- 既存のロール管理コードの修正が必要

### 方法2: 既存の「COMPANY」ロールを使用（簡易版）

#### メリット
- データベース変更不要
- 実装が早い

#### デメリット
- 権限の分離が不十分
- セキュリティリスクがある
- 将来的な保守性が低い

**→ 方法1（EMPLOYEEロール追加）を推奨します**

---

## 📊 データベース設計

### Userテーブルの修正

**現状のUserRole enum:**
```python
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    COMPANY = "company"
    STAFF = "staff"
```

**修正後:**
```python
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    COMPANY = "company"
    STAFF = "staff"
    EMPLOYEE = "employee"  # 新規追加
```

### 社員アカウント情報

| フィールド | 型 | 説明 |
|-----------|---|------|
| id | Integer | ユーザーID |
| email | String | ログイン用メールアドレス（例: company1-employees@example.com） |
| password_hash | String | パスワードハッシュ |
| name | String | アカウント名（例: 株式会社A（社員用）） |
| role | Enum | "employee" 固定 |
| is_active | Boolean | アクティブ状態 |
| company_id | Integer | 所属企業ID（既存フィールドまたは新規追加） |

---

## 🔐 権限設計

### EMPLOYEEロールの権限

| 機能 | 権限 | 備考 |
|-----|------|------|
| `/company/employee-bookings` | ✅ 許可 | 予約登録ページのみ |
| その他の企業側ページ | ❌ 拒否 | ダッシュボード、予約管理など |
| 管理者側ページ | ❌ 拒否 | - |
| スタッフ側ページ | ❌ 拒否 | - |

### API権限

| エンドポイント | 権限 | 説明 |
|--------------|------|------|
| `GET /api/v1/reservations?status=recruiting` | ✅ 許可 | 募集中の予約一覧（自社のみ） |
| `POST /api/v1/reservations/{id}/employees` | ✅ 許可 | 社員参加登録 |
| その他の予約API | ❌ 拒否 | 作成・更新・削除は不可 |
| 企業情報API | ❌ 拒否 | - |
| 社員管理API | ❌ 拒否 | - |

---

## 💻 実装内容

### 1. バックエンド修正

#### 1-1. UserRoleの更新

**ファイル:** `backend/app/models/user.py`

```python
class UserRole(str, enum.Enum):
    ADMIN = "admin"
    COMPANY = "company"
    STAFF = "staff"
    EMPLOYEE = "employee"  # 追加
```

#### 1-2. Userモデルにcompany_idを追加（必要な場合）

**ファイル:** `backend/app/models/user.py`

```python
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(SQLEnum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=True)  # 追加
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
```

#### 1-3. 社員参加登録APIの実装

**ファイル:** `backend/app/api/v1/reservations.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

# 新しいエンドポイント
@router.post("/reservations/{reservation_id}/employees")
def add_employee_to_reservation(
    reservation_id: int,
    employee_data: EmployeeRegistration,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    予約に社員を参加登録
    
    権限: EMPLOYEEまたはCOMPANYロール
    """
    # EMPLOYEEまたはCOMPANYロールのみ許可
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.COMPANY]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この機能へのアクセス権限がありません"
        )
    
    # 予約を取得
    reservation = db.query(Reservation).filter(
        Reservation.id == reservation_id
    ).first()
    
    if not reservation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="予約が見つかりません"
        )
    
    # 自社の予約かチェック
    if current_user.company_id != reservation.company_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他社の予約には登録できません"
        )
    
    # ステータスチェック
    if reservation.status != ReservationStatus.RECRUITING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="この予約は募集中ではありません"
        )
    
    # 募集人数チェック
    current_employees = reservation.employee_names.split(',') if reservation.employee_names else []
    current_employees = [e.strip() for e in current_employees if e.strip()]
    
    if len(current_employees) >= reservation.max_participants:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="募集人数に達しています"
        )
    
    # 社員を追加
    new_employee_name = employee_data.employee_name
    current_employees.append(new_employee_name)
    reservation.employee_names = ', '.join(current_employees)
    
    db.commit()
    db.refresh(reservation)
    
    return {
        "message": "社員の参加登録が完了しました",
        "reservation": reservation
    }


# 募集中の予約一覧取得（EMPLOYEEロール用）
@router.get("/reservations/recruiting")
def get_recruiting_reservations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    募集中の予約一覧を取得（自社のみ）
    
    権限: EMPLOYEE, COMPANY, ADMIN
    """
    query = db.query(Reservation).filter(
        Reservation.status == ReservationStatus.RECRUITING
    )
    
    # EMPLOYEEまたはCOMPANYロールの場合は自社のみ
    if current_user.role in [UserRole.EMPLOYEE, UserRole.COMPANY]:
        if not current_user.company_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="企業情報が設定されていません"
            )
        query = query.filter(Reservation.company_id == current_user.company_id)
    
    reservations = query.order_by(Reservation.reservation_date.asc()).all()
    return reservations
```

#### 1-4. EmployeeRegistrationスキーマの追加

**ファイル:** `backend/app/schemas/reservation.py`

```python
class EmployeeRegistration(BaseModel):
    """社員参加登録スキーマ"""
    employee_name: str = Field(..., description="社員名")
    department: str = Field(..., description="部署")
    position: Optional[str] = Field(None, description="役職")
    phone: Optional[str] = Field(None, description="電話番号")
    email: Optional[str] = Field(None, description="メールアドレス")
    notes: Optional[str] = Field(None, description="備考・要望")
```

#### 1-5. 権限チェック関数の追加

**ファイル:** `backend/app/api/dependencies.py`

```python
def get_employee_user(current_user: User = Depends(get_current_active_user)) -> User:
    """EMPLOYEEロールのユーザーのみ許可"""
    if current_user.role != UserRole.EMPLOYEE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="社員アカウントのみアクセス可能です"
        )
    return current_user

def get_employee_or_company_user(current_user: User = Depends(get_current_active_user)) -> User:
    """EMPLOYEEまたはCOMPANYロールのユーザーのみ許可"""
    if current_user.role not in [UserRole.EMPLOYEE, UserRole.COMPANY]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="この機能へのアクセス権限がありません"
        )
    return current_user
```

---

### 2. フロントエンド修正

#### 2-1. Userインターフェースの更新

**ファイル:** `frontend/src/lib/auth/AuthContext.tsx`

```typescript
export interface User {
  id: number
  email: string
  name: string
  role: 'ADMIN' | 'COMPANY' | 'STAFF' | 'EMPLOYEE'  // EMPLOYEEを追加
  is_active: boolean
  company_id?: number
}
```

#### 2-2. 社員用レイアウトの作成

**ファイル:** `frontend/src/app/employee/layout.tsx`

```tsx
'use client'

import React from 'react'
import { AuthGuard } from '@/lib/auth/AuthGuard'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { logout } = useAuth()
  
  const handleLogout = () => {
    logout()
    router.push('/login')
  }
  
  return (
    <AuthGuard allowedRoles={['EMPLOYEE']}>
      <div className="employee-layout">
        {/* シンプルなヘッダーのみ */}
        <header className="employee-header">
          <div className="container">
            <div className="d-flex justify-content-between align-items-center py-3">
              <h4 className="mb-0">予約登録（社員用）</h4>
              <button 
                className="btn btn-outline-secondary btn-sm"
                onClick={handleLogout}
              >
                <i className="bi bi-box-arrow-right me-2"></i>
                ログアウト
              </button>
            </div>
          </div>
        </header>
        
        {/* メインコンテンツ */}
        <main className="employee-content">
          <div className="container py-4">
            {children}
          </div>
        </main>
        
        {/* シンプルなフッター */}
        <footer className="employee-footer text-center py-3 mt-auto">
          <p className="text-muted small mb-0">
            © 2026 Oriental Synergy
          </p>
        </footer>
      </div>
      
      <style jsx global>{`
        .employee-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: #f8f9fa;
        }
        
        .employee-header {
          background-color: #fff;
          border-bottom: 1px solid #dee2e6;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        
        .employee-content {
          flex: 1;
        }
        
        .employee-footer {
          background-color: #fff;
          border-top: 1px solid #dee2e6;
        }
      `}</style>
    </AuthGuard>
  )
}
```

#### 2-3. employee-bookingsページを移動

**移動元:** `frontend/src/app/company/employee-bookings/page.tsx`  
**移動先:** `frontend/src/app/employee/bookings/page.tsx`

```tsx
// ページ内容は同じですが、APIを実際に呼び出すように修正
'use client'

import React, { useState, useEffect } from 'react'
import { reservationsApi, employeeBookingsApi } from '@/lib/api'
import { useAuth } from '@/lib/auth/AuthContext'
// ... (以下、既存のコードを実APIに接続)
```

#### 2-4. APIクライアントの追加

**ファイル:** `frontend/src/lib/api.ts`

```typescript
// 社員予約登録API
export const employeeBookingsApi = {
  // 募集中の予約一覧取得
  getRecruitingReservations: async (): Promise<Reservation[]> => {
    const response = await apiClient.get('/reservations/recruiting')
    return response.data
  },
  
  // 社員参加登録
  registerEmployee: async (
    reservationId: number, 
    data: EmployeeRegistration
  ): Promise<Reservation> => {
    const response = await apiClient.post(
      `/reservations/${reservationId}/employees`,
      data
    )
    return response.data
  },
}

export interface EmployeeRegistration {
  employee_name: string
  department: string
  position?: string
  phone?: string
  email?: string
  notes?: string
}
```

#### 2-5. ログイン後のリダイレクト処理の更新

**ファイル:** `frontend/src/app/login/page.tsx`

```typescript
// ログイン成功後のリダイレクト
const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault()
  
  try {
    const userData = await login(email, password)
    
    // ロールに応じてリダイレクト
    switch (userData.role) {
      case 'ADMIN':
        router.push('/admin/dashboard')
        break
      case 'COMPANY':
        router.push('/company/dashboard')
        break
      case 'STAFF':
        router.push('/staff/dashboard')
        break
      case 'EMPLOYEE':
        router.push('/employee/bookings')  // 社員用ページへ
        break
      default:
        router.push('/')
    }
  } catch (error) {
    setError('ログインに失敗しました')
  }
}
```

---

### 3. 社員アカウント作成機能

#### 3-1. 管理者画面に社員アカウント作成機能を追加

**ファイル:** `frontend/src/app/admin/companies/[id]/page.tsx`

企業詳細ページに「社員用アカウントを作成」ボタンを追加

```tsx
<button
  className="btn btn-success"
  onClick={handleCreateEmployeeAccount}
>
  <i className="bi bi-people me-2"></i>
  社員用アカウントを作成
</button>
```

#### 3-2. バックエンドAPIの追加

**ファイル:** `backend/app/api/v1/companies.py`

```python
@router.post("/companies/{company_id}/employee-account")
def create_employee_account(
    company_id: int,
    password: str = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    """
    企業の社員用共通アカウントを作成
    
    権限: 管理者のみ
    """
    # 企業を取得
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="企業が見つかりません"
        )
    
    # 既に社員アカウントが存在するかチェック
    existing_account = db.query(User).filter(
        User.company_id == company_id,
        User.role == UserRole.EMPLOYEE
    ).first()
    
    if existing_account:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="既に社員アカウントが存在します"
        )
    
    # メールアドレスを生成（例: company_1_employees@example.com）
    email = f"company_{company_id}_employees@example.com"
    
    # 社員アカウントを作成
    employee_account = User(
        email=email,
        password_hash=get_password_hash(password),
        name=f"{company.name}（社員用）",
        role=UserRole.EMPLOYEE,
        is_active=True,
        company_id=company_id
    )
    
    db.add(employee_account)
    db.commit()
    db.refresh(employee_account)
    
    return {
        "message": "社員アカウントを作成しました",
        "account": {
            "id": employee_account.id,
            "email": employee_account.email,
            "name": employee_account.name,
            "company_id": employee_account.company_id
        }
    }
```

---

## 🚀 実装手順

### ステップ1: データベース準備

1. UserRoleにEMPLOYEEを追加
2. マイグレーションを実行
3. 既存データへの影響確認

```bash
# マイグレーション作成
alembic revision --autogenerate -m "Add EMPLOYEE role to UserRole enum"

# マイグレーション実行
alembic upgrade head
```

### ステップ2: バックエンド実装

1. ユーザーモデルの更新
2. 社員参加登録APIの実装
3. 権限チェック関数の追加
4. 社員アカウント作成APIの実装

### ステップ3: フロントエンド実装

1. AuthContextの更新（EMPLOYEEロール追加）
2. 社員用レイアウトの作成
3. employee-bookingsページの移動と修正
4. APIクライアントの追加
5. ログイン後のリダイレクト処理更新

### ステップ4: 管理者画面の更新

1. 企業詳細ページに社員アカウント作成ボタン追加
2. アカウント作成モーダルの実装
3. 作成後のアカウント情報表示

### ステップ5: テスト

1. 社員アカウントの作成
2. 社員アカウントでのログイン
3. 予約一覧の表示
4. 社員参加登録
5. アクセス制限の確認

---

## 🔒 セキュリティ考慮事項

1. **パスワード管理**
   - 社員用アカウントのパスワードは企業担当者に通知
   - 定期的なパスワード変更を推奨

2. **アクセス制限**
   - AuthGuardで確実にロールチェック
   - バックエンドでも二重チェック

3. **データ分離**
   - 社員アカウントは自社の予約のみ閲覧可能
   - company_idで厳格にフィルタリング

4. **ログ記録**
   - 社員アカウントの作成履歴
   - 予約登録の履歴

---

## 📝 運用フロー

### 1. 社員アカウント作成

```
1. 管理者が企業詳細ページにアクセス
   ↓
2. 「社員用アカウントを作成」ボタンをクリック
   ↓
3. パスワードを設定
   ↓
4. アカウント情報（メールアドレス、パスワード）を企業担当者に通知
```

### 2. 社員による予約登録

```
1. 社員が共通アカウントでログイン
   ↓
2. /employee/bookings に自動的にリダイレクト
   ↓
3. 募集中の予約一覧を表示
   ↓
4. 予約を選択して詳細を確認
   ↓
5. 社員情報を入力して登録
   ↓
6. 登録完了
```

---

## ⚠️ 注意事項

1. **共通アカウントのリスク**
   - 複数の社員が同じアカウントを使用
   - 誰が登録したか追跡できない
   - 将来的には個別アカウントへの移行を推奨

2. **将来の拡張性**
   - 個別の社員アカウント機能
   - LINEログイン連携
   - シングルサインオン (SSO)

---

## 📈 実装工数見積もり

| タスク | 工数 |
|-------|------|
| データベース設計・マイグレーション | 2時間 |
| バックエンドAPI実装 | 4時間 |
| フロントエンド実装 | 6時間 |
| 管理者画面の更新 | 3時間 |
| テスト・デバッグ | 4時間 |
| ドキュメント作成 | 1時間 |
| **合計** | **約20時間（2.5日）** |

---

## ✅ まとめ

ご要望の機能は **実現可能** です。

### 推奨実装方法
- 新しいロール「EMPLOYEE」を追加
- 企業ごとに社員用共通アカウントを発行
- 専用レイアウトで予約登録ページのみアクセス可能

### 主な開発内容
1. バックエンド: UserRoleの追加、API実装
2. フロントエンド: 社員用レイアウト、APIクライアント
3. 管理者画面: アカウント作成機能

### セキュリティ
- ロールベースのアクセス制御
- company_idによるデータ分離
- AuthGuardとバックエンドの二重チェック

実装を進めてよろしいでしょうか？

---

最終更新日: 2026年1月23日

