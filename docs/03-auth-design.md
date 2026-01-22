# 認証・セキュリティ設計書

## 📋 概要

オリエンタルシナジー 派遣業務管理システムの認証・セキュリティ設計書

- **認証方式**: JWT (JSON Web Token)
- **パスワードハッシュ**: bcrypt (cost factor: 12)
- **認可方式**: RBAC (Role-Based Access Control)
- **セッション管理**: Redis

## 🔐 認証フロー

### ログインフロー

```
1. ユーザーがメールアドレスとパスワードを入力
   ↓
2. フロントエンド → バックエンド: POST /api/v1/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ↓
3. バックエンド: メールアドレスでユーザー検索
   ↓
4. バックエンド: パスワード検証 (bcrypt.compare)
   ↓
5. バックエンド: JWTトークン生成
   - アクセストークン (有効期限: 15分)
   - リフレッシュトークン (有効期限: 7日間)
   ↓
6. バックエンド: Redisにリフレッシュトークンを保存
   ↓
7. バックエンド → フロントエンド: トークンを返却
   {
     "access_token": "eyJhbGc...",
     "refresh_token": "eyJhbGc...",
     "token_type": "bearer",
     "expires_in": 900,
     "user": { ... }
   }
   ↓
8. フロントエンド: トークンをHTTPOnly Cookieに保存
   ↓
9. フロントエンド: ユーザー情報をメモリ（React Context）に保存
   ↓
10. フロントエンド: ダッシュボードへリダイレクト
```

### トークンリフレッシュフロー

```
1. アクセストークンが期限切れ
   ↓
2. フロントエンド: リフレッシュトークンを確認
   ↓
3. フロントエンド → バックエンド: POST /api/v1/auth/refresh
   {
     "refresh_token": "eyJhbGc..."
   }
   ↓
4. バックエンド: リフレッシュトークン検証
   - JWT署名検証
   - Redisに存在確認
   - 有効期限確認
   ↓
5. バックエンド: 新しいアクセストークン生成
   ↓
6. バックエンド → フロントエンド: 新トークン返却
   {
     "access_token": "eyJhbGc...",
     "token_type": "bearer",
     "expires_in": 900
   }
   ↓
7. フロントエンド: 新トークンで再リクエスト
```

### ログアウトフロー

```
1. ユーザーがログアウトボタンをクリック
   ↓
2. フロントエンド → バックエンド: POST /api/v1/auth/logout
   Authorization: Bearer <access_token>
   ↓
3. バックエンド: Redisからリフレッシュトークンを削除
   ↓
4. バックエンド: アクセストークンをブラックリストに追加（有効期限まで）
   ↓
5. バックエンド → フロントエンド: 成功レスポンス
   ↓
6. フロントエンド: Cookieからトークンを削除
   ↓
7. フロントエンド: メモリからユーザー情報を削除
   ↓
8. フロントエンド: ログインページへリダイレクト
```

---

## 🎫 JWT トークン設計

### アクセストークン

**Payload:**
```json
{
  "sub": "user-uuid",           // ユーザーID
  "email": "user@example.com",  // メールアドレス
  "role": "staff",              // ロール
  "type": "access",             // トークンタイプ
  "iat": 1703318400,            // 発行日時
  "exp": 1703319300             // 有効期限（15分後）
}
```

**用途:**
- API アクセス時の認証
- 短い有効期限で安全性を確保

**保存場所:**
- フロントエンド: HTTPOnly Cookie (推奨) または localStorage

---

### リフレッシュトークン

**Payload:**
```json
{
  "sub": "user-uuid",           // ユーザーID
  "type": "refresh",            // トークンタイプ
  "jti": "refresh-token-uuid",  // トークン一意ID
  "iat": 1703318400,            // 発行日時
  "exp": 1703923200             // 有効期限（7日後）
}
```

**用途:**
- アクセストークンの更新
- 長期間のセッション維持

**保存場所:**
- フロントエンド: HTTPOnly Cookie
- バックエンド: Redis (キー: `refresh_token:{jti}`, 値: `user_id`)

---

## 🔑 パスワード管理

### パスワード要件

```
- 最小長: 8文字
- 最大長: 128文字
- 必須文字種:
  - 英小文字 (a-z)
  - 英大文字 (A-Z)
  - 数字 (0-9)
  - 特殊文字 (!@#$%^&*) (推奨)
```

### パスワードハッシュ化

```python
import bcrypt

# ハッシュ化
hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=12))

# 検証
is_valid = bcrypt.checkpw(password.encode('utf-8'), hashed)
```

**bcrypt パラメータ:**
- Cost Factor: 12 (2^12 = 4096回の反復)
- Salt: 自動生成（16バイト）

---

### パスワードリセットフロー

```
1. ユーザーが「パスワードを忘れた」をクリック
   ↓
2. フロントエンド → バックエンド: POST /api/v1/auth/password-reset
   {
     "email": "user@example.com"
   }
   ↓
3. バックエンド: ユーザー存在確認
   ↓
4. バックエンド: リセットトークン生成 (有効期限: 1時間)
   ↓
5. バックエンド: Redisに保存
   キー: password_reset:{token}
   値: user_id
   有効期限: 1時間
   ↓
6. バックエンド: リセット用メール送信
   件名: パスワードリセットのお知らせ
   本文: 以下のリンクからパスワードをリセットしてください
         https://example.com/password-reset/confirm?token=xxxxx
   ↓
7. ユーザー: メールのリンクをクリック
   ↓
8. フロントエンド: リセットページ表示
   ↓
9. ユーザー: 新しいパスワードを入力
   ↓
10. フロントエンド → バックエンド: POST /api/v1/auth/password-reset/confirm
    {
      "token": "reset-token",
      "new_password": "new_password123"
    }
    ↓
11. バックエンド: トークン検証
    ↓
12. バックエンド: パスワード更新
    ↓
13. バックエンド: Redisからトークン削除
    ↓
14. バックエンド: 完了メール送信
    ↓
15. フロントエンド: ログインページへリダイレクト
```

---

## 👥 ロールベースアクセス制御 (RBAC)

### ロール定義

| ロール | 説明 | 権限 |
|--------|------|------|
| **admin** | 管理者 | 全機能アクセス可能 |
| **company** | 企業 | 自社の情報・予約・評価の管理 |
| **staff** | スタッフ | 自分の業務・勤怠・評価の確認 |

---

### 権限マトリックス

#### ユーザー管理

| 操作 | admin | company | staff |
|------|-------|---------|-------|
| ユーザー一覧取得 | ✅ | ❌ | ❌ |
| ユーザー作成 | ✅ | ❌ | ❌ |
| ユーザー更新 | ✅ | 🔹自分のみ | 🔹自分のみ |
| ユーザー削除 | ✅ | ❌ | ❌ |

#### 企業管理

| 操作 | admin | company | staff |
|------|-------|---------|-------|
| 企業一覧取得 | ✅ | 🔹自社のみ | ❌ |
| 企業作成 | ✅ | ❌ | ❌ |
| 企業更新 | ✅ | 🔹自社のみ | ❌ |
| 企業削除 | ✅ | ❌ | ❌ |
| 事業所管理 | ✅ | 🔹自社のみ | ❌ |
| 社員管理 | ✅ | 🔹自社のみ | ❌ |

#### スタッフ管理

| 操作 | admin | company | staff |
|------|-------|---------|-------|
| スタッフ一覧取得 | ✅ | 🔹検索のみ | ❌ |
| スタッフ作成 | ✅ | ❌ | ❌ |
| スタッフ更新 | ✅ | ❌ | 🔹自分のみ |
| スタッフ削除 | ✅ | ❌ | ❌ |
| スタッフ検索 | ✅ | ✅ | ❌ |

#### 予約管理

| 操作 | admin | company | staff |
|------|-------|---------|-------|
| 予約一覧取得 | ✅ | 🔹自社のみ | ❌ |
| 予約作成 | ✅ | ✅ | ❌ |
| 予約更新 | ✅ | 🔹自社のみ | ❌ |
| 予約削除 | ✅ | 🔹自社のみ | ❌ |

#### アサイン管理

| 操作 | admin | company | staff |
|------|-------|---------|-------|
| アサイン作成 | ✅ | ❌ | ❌ |
| アサイン更新 | ✅ | ❌ | ❌ |
| アサイン削除 | ✅ | ❌ | ❌ |
| アサイン受諾 | ❌ | ❌ | 🔹自分のみ |
| アサイン辞退 | ❌ | ❌ | 🔹自分のみ |
| 自分のアサイン一覧 | ❌ | ❌ | ✅ |

#### 勤怠管理

| 操作 | admin | company | staff |
|------|-------|---------|-------|
| 勤怠一覧取得 | ✅ | 🔹関連のみ | 🔹自分のみ |
| 出勤打刻 | ❌ | ❌ | ✅ |
| 退勤打刻 | ❌ | ❌ | ✅ |
| 勤怠確認 | ✅ | 🔹関連のみ | 🔹自分のみ |

#### 評価管理

| 操作 | admin | company | staff |
|------|-------|---------|-------|
| 評価作成 | ✅ | ✅ | ❌ |
| 評価一覧取得 | ✅ | 🔹自社分のみ | 🔹自分宛のみ |
| 評価詳細取得 | ✅ | 🔹自社分のみ | 🔹自分宛のみ |

凡例:
- ✅: 全てアクセス可能
- 🔹: 条件付きアクセス
- ❌: アクセス不可

---

### 権限チェック実装

#### バックエンド (FastAPI)

```python
from fastapi import Depends, HTTPException, status
from typing import List

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="権限がありません"
            )
        return current_user
    return role_checker

# 使用例
@router.get("/companies")
async def get_companies(
    current_user: User = Depends(require_role(["admin"]))
):
    # 管理者のみアクセス可能
    pass

@router.get("/companies/{company_id}")
async def get_company(
    company_id: str,
    current_user: User = Depends(get_current_user)
):
    # 管理者は全て、企業は自社のみアクセス可能
    if current_user.role == "admin":
        pass  # OK
    elif current_user.role == "company":
        company = get_company_by_user_id(current_user.id)
        if str(company.id) != company_id:
            raise HTTPException(status_code=403, detail="権限がありません")
    else:
        raise HTTPException(status_code=403, detail="権限がありません")
    
    pass
```

#### フロントエンド (React)

```tsx
// lib/auth/permissions.ts
export const hasPermission = (user: User, permission: string): boolean => {
  const permissions = {
    admin: [
      'users:read', 'users:create', 'users:update', 'users:delete',
      'companies:read', 'companies:create', 'companies:update', 'companies:delete',
      'staff:read', 'staff:create', 'staff:update', 'staff:delete',
      'reservations:read', 'reservations:create', 'reservations:update', 'reservations:delete',
      'assignments:read', 'assignments:create', 'assignments:update', 'assignments:delete',
      'attendance:read',
      'evaluations:read', 'evaluations:create',
    ],
    company: [
      'companies:read_own', 'companies:update_own',
      'offices:read', 'offices:create', 'offices:update', 'offices:delete',
      'employees:read', 'employees:create', 'employees:update', 'employees:delete',
      'reservations:read_own', 'reservations:create', 'reservations:update_own', 'reservations:delete_own',
      'staff:search',
      'attendance:read_related',
      'evaluations:read_own', 'evaluations:create',
    ],
    staff: [
      'users:update_own',
      'staff:update_own',
      'assignments:read_own', 'assignments:accept', 'assignments:reject',
      'attendance:read_own', 'attendance:clock_in', 'attendance:clock_out',
      'evaluations:read_own',
    ],
  };
  
  return permissions[user.role]?.includes(permission) || false;
};

// 使用例
import { hasPermission } from '@/lib/auth/permissions';
import { useAuth } from '@/lib/hooks/useAuth';

const CompanyList = () => {
  const { user } = useAuth();
  
  if (!user || !hasPermission(user, 'companies:read')) {
    return <div>アクセス権限がありません</div>;
  }
  
  return <div>企業一覧</div>;
};
```

#### ルートガード (Next.js)

```tsx
// app/admin/layout.tsx
import { redirect } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <Loading />;
  }
  
  if (!user) {
    redirect('/login');
  }
  
  if (user.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return (
    <div className="admin-layout">
      <Sidebar />
      <main>{children}</main>
    </div>
  );
}
```

---

## 🔒 セキュリティ対策

### 1. パスワードセキュリティ

**実装:**
- bcrypt によるハッシュ化（cost factor: 12）
- パスワード強度チェック
- パスワード履歴管理（過去3回分）
- 定期的なパスワード変更の推奨

---

### 2. トークンセキュリティ

**実装:**
- JWT 署名検証（HS256 または RS256）
- トークンの有効期限管理
- リフレッシュトークンのローテーション
- ログアウト時のトークン無効化（ブラックリスト）

---

### 3. セッション管理

**実装:**
- Redis によるセッション管理
- 同時ログイン数の制限（オプション）
- 不正なアクセスの検知とログ記録

---

### 4. ブルートフォース攻撃対策

**実装:**
- ログイン試行回数の制限（5回まで）
- ロックアウト機能（15分間）
- CAPTCHA 導入（オプション）

```python
# Redis でログイン試行回数を管理
login_attempts_key = f"login_attempts:{email}"
attempts = redis.get(login_attempts_key) or 0

if int(attempts) >= 5:
    raise HTTPException(
        status_code=429,
        detail="ログイン試行回数が上限に達しました。15分後に再試行してください。"
    )

# ログイン失敗時
redis.incr(login_attempts_key)
redis.expire(login_attempts_key, 900)  # 15分

# ログイン成功時
redis.delete(login_attempts_key)
```

---

### 5. CSRF対策

**実装:**
- CSRFトークンの生成と検証
- SameSite Cookie 属性の設定

```python
# FastAPI
from fastapi.middleware.csrf import CSRFProtect

csrf_protect = CSRFProtect()

@app.post("/api/v1/auth/login")
async def login(
    request: Request,
    csrf_token: str = Depends(csrf_protect.validate_csrf_token)
):
    pass
```

---

### 6. XSS対策

**実装:**
- 入力値のサニタイゼーション
- Content Security Policy (CSP) ヘッダー
- HTTPOnly Cookie の使用

```python
# CSP ヘッダー設定
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline';"
    )
    return response
```

---

### 7. SQLインジェクション対策

**実装:**
- ORM（SQLAlchemy）の使用
- プリペアドステートメント
- 入力値のバリデーション

---

### 8. レート制限

**実装:**
- API エンドポイントごとのレート制限
- IP アドレスベースの制限
- ユーザーベースの制限

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")
async def login(request: Request):
    pass
```

---

### 9. HTTPS強制

**実装:**
- 全通信をHTTPSで暗号化
- HSTS (HTTP Strict Transport Security) ヘッダー

```python
@app.middleware("http")
async def add_hsts_header(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = (
        "max-age=31536000; includeSubDomains"
    )
    return response
```

---

### 10. 監査ログ

**実装:**
- 認証イベントのログ記録
- 重要な操作のログ記録
- 異常なアクセスパターンの検知

```python
import logging

logger = logging.getLogger("audit")

# ログイン成功
logger.info(f"Login success: user={user.email}, ip={request.client.host}")

# ログイン失敗
logger.warning(f"Login failed: email={email}, ip={request.client.host}, reason={reason}")

# 権限エラー
logger.error(f"Permission denied: user={user.email}, action={action}, resource={resource}")
```

---

## 🔄 セッション管理

### Redisデータ構造

```
# リフレッシュトークン
refresh_token:{token_jti} → user_id (TTL: 7日間)

# ログイン試行回数
login_attempts:{email} → count (TTL: 15分)

# トークンブラックリスト
token_blacklist:{access_token} → 1 (TTL: トークンの残り有効期限)

# パスワードリセットトークン
password_reset:{token} → user_id (TTL: 1時間)
```

---

## 📱 LINE連携認証

### LINE ログインフロー

```
1. ユーザーがLINEログインボタンをクリック
   ↓
2. フロントエンド: LINE認証画面へリダイレクト
   https://access.line.me/oauth2/v2.1/authorize
   ?response_type=code
   &client_id={LINE_CHANNEL_ID}
   &redirect_uri={CALLBACK_URL}
   &state={STATE}
   &scope=profile%20openid
   ↓
3. ユーザー: LINEでログイン・認可
   ↓
4. LINE: コールバックURLへリダイレクト
   {CALLBACK_URL}?code={CODE}&state={STATE}
   ↓
5. フロントエンド → バックエンド: POST /api/v1/auth/line/callback
   {
     "code": "authorization_code",
     "state": "state_value"
   }
   ↓
6. バックエンド → LINE: アクセストークン取得
   POST https://api.line.me/oauth2/v2.1/token
   ↓
7. バックエンド → LINE: ユーザープロフィール取得
   GET https://api.line.me/v2/profile
   ↓
8. バックエンド: LINE User IDでユーザー検索
   - 存在する: ログイン
   - 存在しない: 新規登録またはエラー
   ↓
9. バックエンド: JWTトークン生成
   ↓
10. バックエンド → フロントエンド: トークン返却
```

### LIFF認証フロー

```
1. ユーザーがLIFFアプリを開く
   ↓
2. LIFF SDK初期化
   liff.init({ liffId: 'LIFF_ID' })
   ↓
3. ログイン状態確認
   liff.isLoggedIn()
   ↓
4. LIFFアクセストークン取得
   const accessToken = liff.getAccessToken()
   ↓
5. フロントエンド → バックエンド: GET /api/v1/line/liff-token
   ?line_access_token={LINE_ACCESS_TOKEN}
   ↓
6. バックエンド → LINE: トークン検証
   GET https://api.line.me/oauth2/v2.1/verify
   ↓
7. バックエンド → LINE: ユーザープロフィール取得
   ↓
8. バックエンド: LINE User IDでユーザー検索
   ↓
9. バックエンド: JWTトークン生成
   ↓
10. バックエンド → フロントエンド: トークン返却
    ↓
11. LIFF: トークンで打刻APIを呼び出し
```

---

## 🧪 テストケース

### ログインテスト

```python
# tests/test_auth.py
import pytest
from fastapi.testclient import TestClient

def test_login_success(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data["data"]
    assert "refresh_token" in data["data"]

def test_login_invalid_email(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "invalid@example.com",
        "password": "password123"
    })
    assert response.status_code == 401

def test_login_invalid_password(client: TestClient):
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrong_password"
    })
    assert response.status_code == 401

def test_login_too_many_attempts(client: TestClient):
    for _ in range(5):
        client.post("/api/v1/auth/login", json={
            "email": "test@example.com",
            "password": "wrong_password"
        })
    
    response = client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "password123"
    })
    assert response.status_code == 429
```

### 権限テスト

```python
def test_admin_can_access_all_companies(client: TestClient, admin_token):
    response = client.get(
        "/api/v1/companies",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200

def test_company_cannot_access_other_company(client: TestClient, company_token):
    response = client.get(
        "/api/v1/companies/other-company-id",
        headers={"Authorization": f"Bearer {company_token}"}
    )
    assert response.status_code == 403

def test_staff_cannot_access_companies(client: TestClient, staff_token):
    response = client.get(
        "/api/v1/companies",
        headers={"Authorization": f"Bearer {staff_token}"}
    )
    assert response.status_code == 403
```

---

## 📚 参考リンク

- [JWT.io](https://jwt.io/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [FastAPI Security](https://fastapi.tiangolo.com/tutorial/security/)
- [LINE Login Documentation](https://developers.line.biz/ja/docs/line-login/)
- [LIFF Documentation](https://developers.line.biz/ja/docs/liff/)

