# API仕様書

## 📋 概要

オリエンタルシナジー 派遣業務管理システムの RESTful API 仕様書

- **フレームワーク**: FastAPI (Python 3.11+)
- **ベースURL**: `http://localhost:8000/api/v1`（開発環境）
- **認証方式**: JWT (JSON Web Token)
- **レスポンス形式**: JSON
- **文字コード**: UTF-8

## 🔐 認証

### JWT トークン

**アクセストークン**
- 有効期限: 15分
- 用途: API アクセス

**リフレッシュトークン**
- 有効期限: 7日間
- 用途: アクセストークンの更新

### ヘッダー

```
Authorization: Bearer <access_token>
```

## 📊 共通仕様

### レスポンス形式

#### 成功時

```json
{
  "success": true,
  "data": { ... },
  "message": "Success"
}
```

#### エラー時

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "エラーメッセージ",
    "details": { ... }
  }
}
```

### HTTPステータスコード

| コード | 説明 |
|--------|------|
| 200 | OK - 成功 |
| 201 | Created - 作成成功 |
| 204 | No Content - 成功（レスポンスボディなし） |
| 400 | Bad Request - リクエストエラー |
| 401 | Unauthorized - 認証エラー |
| 403 | Forbidden - 権限エラー |
| 404 | Not Found - リソースが見つからない |
| 422 | Unprocessable Entity - バリデーションエラー |
| 500 | Internal Server Error - サーバーエラー |

### ページネーション

リスト系APIは以下のクエリパラメータをサポート：

```
GET /api/v1/resource?page=1&limit=20&sort_by=created_at&order=desc
```

**パラメータ:**
- `page`: ページ番号（デフォルト: 1）
- `limit`: 1ページあたりの件数（デフォルト: 20, 最大: 100）
- `sort_by`: ソートフィールド
- `order`: ソート順（asc/desc）

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "total_pages": 8
    }
  }
}
```

---

## 🔐 認証 API

### POST /auth/login

ログイン

**リクエスト:**

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "refresh_token": "eyJhbGc...",
    "token_type": "bearer",
    "expires_in": 900,
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "staff",
      "is_active": true
    }
  }
}
```

---

### POST /auth/logout

ログアウト

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

---

### POST /auth/refresh

トークンリフレッシュ

**リクエスト:**

```json
{
  "refresh_token": "eyJhbGc..."
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "token_type": "bearer",
    "expires_in": 900
  }
}
```

---

### POST /auth/password-reset

パスワードリセット要求

**リクエスト:**

```json
{
  "email": "user@example.com"
}
```

**レスポンス:**

```json
{
  "success": true,
  "message": "パスワードリセット用のメールを送信しました"
}
```

---

### POST /auth/password-reset/confirm

パスワードリセット確認

**リクエスト:**

```json
{
  "token": "reset_token_here",
  "new_password": "new_password123"
}
```

**レスポンス:**

```json
{
  "success": true,
  "message": "パスワードを変更しました"
}
```

---

## 👤 ユーザー管理 API

### GET /users/me

現在のユーザー情報取得

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "staff",
    "is_active": true,
    "profile": {
      "first_name": "太郎",
      "last_name": "山田",
      ...
    }
  }
}
```

---

### PUT /users/me

ユーザー情報更新

**認証**: 必要

**リクエスト:**

```json
{
  "email": "newemail@example.com",
  "current_password": "old_password",
  "new_password": "new_password123"
}
```

---

### GET /users

ユーザー一覧取得

**認証**: 必要（管理者のみ）

**クエリパラメータ:**
- `role`: ロールでフィルタ（admin/company/staff）
- `is_active`: 有効/無効フィルタ（true/false）
- `search`: 検索キーワード

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "role": "staff",
        "is_active": true,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### POST /users

ユーザー作成

**認証**: 必要（管理者のみ）

**リクエスト:**

```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "role": "staff",
  "profile": {
    "first_name": "太郎",
    "last_name": "山田",
    ...
  }
}
```

---

## 🏢 企業管理 API

### GET /companies

企業一覧取得

**認証**: 必要

**クエリパラメータ:**
- `search`: 検索キーワード（企業名）
- `industry`: 業種でフィルタ
- `contract_status`: 契約状態（active/expired）

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "name": "株式会社サンプル",
        "industry": "建設業",
        "phone": "03-1234-5678",
        "contract_plan": "Aプラン",
        "total_usage_count": 10,
        "created_at": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {...}
  }
}
```

---

### POST /companies

企業作成

**認証**: 必要（管理者のみ）

**リクエスト:**

```json
{
  "email": "company@example.com",
  "password": "password123",
  "name": "株式会社サンプル",
  "name_kana": "カブシキガイシャサンプル",
  "industry": "建設業",
  "representative_name": "田中一郎",
  "postal_code": "100-0001",
  "address": "東京都千代田区...",
  "phone": "03-1234-5678",
  "contract_plan": "Aプラン",
  "contract_start_date": "2024-01-01",
  "contract_end_date": "2024-12-31"
}
```

---

### GET /companies/{id}

企業詳細取得

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "株式会社サンプル",
    "name_kana": "カブシキガイシャサンプル",
    "industry": "建設業",
    "representative_name": "田中一郎",
    "postal_code": "100-0001",
    "address": "東京都千代田区...",
    "phone": "03-1234-5678",
    "email": "company@example.com",
    "contract_plan": "Aプラン",
    "contract_start_date": "2024-01-01",
    "contract_end_date": "2024-12-31",
    "total_usage_count": 10,
    "total_amount": 1000000,
    "notes": "備考",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT /companies/{id}

企業情報更新

**認証**: 必要（管理者または該当企業）

**リクエスト:**

```json
{
  "name": "株式会社サンプル（変更後）",
  "phone": "03-9999-9999",
  ...
}
```

---

### DELETE /companies/{id}

企業削除

**認証**: 必要（管理者のみ）

**レスポンス:**

```json
{
  "success": true,
  "message": "企業を削除しました"
}
```

---

### GET /companies/{id}/offices

事業所一覧取得

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "梅田営業所",
      "address": "大阪市北区...",
      "phone": "06-1234-5678",
      "manager_name": "佐藤次郎",
      "is_active": true
    }
  ]
}
```

---

### POST /companies/{id}/offices

事業所作成

**認証**: 必要（管理者または該当企業）

**リクエスト:**

```json
{
  "name": "梅田営業所",
  "postal_code": "530-0001",
  "address": "大阪市北区...",
  "phone": "06-1234-5678",
  "manager_name": "佐藤次郎",
  "manager_phone": "090-1234-5678"
}
```

---

### GET /companies/{company_id}/employees

社員一覧取得

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "太郎",
      "last_name": "田中",
      "department": "営業部",
      "phone": "090-1234-5678",
      "is_active": true
    }
  ]
}
```

---

### POST /companies/{company_id}/employees

社員作成

**認証**: 必要（管理者または該当企業）

**リクエスト:**

```json
{
  "first_name": "太郎",
  "last_name": "田中",
  "first_name_kana": "タロウ",
  "last_name_kana": "タナカ",
  "department": "営業部",
  "phone": "090-1234-5678",
  "email": "tanaka@company.com",
  "line_user_id": "U1234567890abcdef",
  "gender": "male",
  "date_of_birth": "1990-01-01"
}
```

---

## 👥 スタッフ管理 API

### GET /staff

スタッフ一覧取得

**認証**: 必要

**クエリパラメータ:**
- `search`: 検索キーワード（名前）
- `skill`: スキルでフィルタ
- `min_rating`: 最低評価でフィルタ（例: 4.5）
- `is_active`: 有効/無効フィルタ

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "first_name": "花子",
        "last_name": "山田",
        "phone": "090-9876-5432",
        "average_rating": 4.8,
        "total_jobs": 150,
        "skills": ["リンパマッサージ", "アロマセラピー"],
        "is_active": true
      }
    ],
    "pagination": {...}
  }
}
```

---

### POST /staff

スタッフ作成

**認証**: 必要（管理者のみ）

**リクエスト:**

```json
{
  "email": "staff@example.com",
  "password": "password123",
  "first_name": "花子",
  "last_name": "山田",
  "first_name_kana": "ハナコ",
  "last_name_kana": "ヤマダ",
  "phone": "090-9876-5432",
  "date_of_birth": "1995-05-15",
  "gender": "female",
  "postal_code": "100-0001",
  "address": "東京都...",
  "emergency_contact_name": "山田太郎",
  "emergency_contact_phone": "090-1111-2222",
  "emergency_contact_relationship": "父"
}
```

---

### GET /staff/{id}

スタッフ詳細取得

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "花子",
    "last_name": "山田",
    "phone": "090-9876-5432",
    "email": "staff@example.com",
    "date_of_birth": "1995-05-15",
    "gender": "female",
    "address": "東京都...",
    "average_rating": 4.8,
    "total_jobs": 150,
    "total_evaluations": 145,
    "skills": [
      {
        "skill_name": "リンパマッサージ",
        "experience_years": 5,
        "certificate_name": "リンパマッサージ師",
        "certificate_date": "2019-03-01"
      }
    ],
    "recent_jobs": [...],
    "evaluations": [...]
  }
}
```

---

### PUT /staff/{id}

スタッフ情報更新

**認証**: 必要（管理者または本人）

---

### DELETE /staff/{id}

スタッフ削除

**認証**: 必要（管理者のみ）

---

### GET /staff/search

スタッフ検索（高度な検索）

**認証**: 必要（管理者のみ）

**クエリパラメータ:**
- `skills`: スキル（カンマ区切り）
- `min_rating`: 最低評価
- `available_date`: 対応可能日
- `sort_by`: ソート（rating/jobs/last_job_date）
- `order`: ソート順（desc/asc）

**レスポンス:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "山田花子",
      "average_rating": 4.8,
      "total_jobs": 150,
      "skills": ["リンパマッサージ", "アロマセラピー"],
      "last_job_date": "2024-12-15",
      "match_score": 95
    }
  ]
}
```

---

### POST /staff/{id}/skills

スタッフのスキル追加

**認証**: 必要（管理者または本人）

**リクエスト:**

```json
{
  "skill_name": "アロマセラピー",
  "experience_years": 3,
  "certificate_name": "アロマセラピスト認定",
  "certificate_number": "ABC123",
  "certificate_date": "2021-06-01"
}
```

---

## 📅 予約管理 API

### GET /reservations

予約一覧取得

**認証**: 必要

**クエリパラメータ:**
- `company_id`: 企業IDでフィルタ
- `status`: ステータスでフィルタ
- `date_from`: 開始日（YYYY-MM-DD）
- `date_to`: 終了日（YYYY-MM-DD）

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "company_name": "株式会社サンプル",
        "office_name": "梅田営業所",
        "reservation_date": "2024-12-25",
        "start_time": "15:00",
        "end_time": "17:00",
        "total_slots": 4,
        "assigned_staff_count": 1,
        "status": "confirmed"
      }
    ],
    "pagination": {...}
  }
}
```

---

### POST /reservations

予約作成

**認証**: 必要（管理者または企業）

**リクエスト:**

```json
{
  "company_id": "uuid",
  "office_id": "uuid",
  "reservation_date": "2024-12-25",
  "start_time": "15:00",
  "end_time": "17:00",
  "slot_duration": 30,
  "slots": [
    {
      "employee_id": "uuid",
      "employee_notes": "肩こりに悩んでいます"
    },
    {
      "employee_id": "uuid",
      "employee_notes": ""
    }
  ],
  "company_notes": "駐車場は建物裏にあります"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "reservation_date": "2024-12-25",
    "start_time": "15:00",
    "end_time": "17:00",
    "total_slots": 4,
    "status": "pending"
  }
}
```

---

### GET /reservations/{id}

予約詳細取得

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "company": {
      "id": "uuid",
      "name": "株式会社サンプル"
    },
    "office": {
      "id": "uuid",
      "name": "梅田営業所",
      "address": "大阪市北区..."
    },
    "reservation_date": "2024-12-25",
    "start_time": "15:00",
    "end_time": "17:00",
    "total_slots": 4,
    "status": "confirmed",
    "slots": [
      {
        "id": "uuid",
        "slot_order": 1,
        "slot_start_time": "15:00",
        "slot_end_time": "15:30",
        "employee": {
          "id": "uuid",
          "name": "田中太郎"
        },
        "employee_notes": "肩こりに悩んでいます",
        "status": "booked"
      }
    ],
    "assignments": [
      {
        "id": "uuid",
        "staff": {
          "id": "uuid",
          "name": "山田花子",
          "average_rating": 4.8
        },
        "status": "accepted"
      }
    ],
    "company_notes": "駐車場は建物裏にあります",
    "admin_notes": "初回利用"
  }
}
```

---

### PUT /reservations/{id}

予約更新

**認証**: 必要（管理者または該当企業）

---

### DELETE /reservations/{id}

予約削除（キャンセル）

**認証**: 必要（管理者または該当企業）

---

### GET /reservations/calendar

カレンダー表示用データ取得

**認証**: 必要

**クエリパラメータ:**
- `year`: 年
- `month`: 月

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "title": "株式会社サンプル - 梅田営業所",
        "start": "2024-12-25T15:00:00",
        "end": "2024-12-25T17:00:00",
        "status": "confirmed",
        "color": "#28a745"
      }
    ]
  }
}
```

---

## 🎯 アサイン管理 API

### POST /assignments

スタッフアサイン

**認証**: 必要（管理者のみ）

**リクエスト:**

```json
{
  "reservation_id": "uuid",
  "staff_id": "uuid",
  "notes": "初回訪問です"
}
```

---

### PUT /assignments/{id}

アサイン更新

**認証**: 必要（管理者のみ）

---

### DELETE /assignments/{id}

アサイン解除

**認証**: 必要（管理者のみ）

---

### POST /assignments/{id}/accept

アサイン受諾

**認証**: 必要（該当スタッフ）

**レスポンス:**

```json
{
  "success": true,
  "message": "業務を受諾しました"
}
```

---

### POST /assignments/{id}/reject

アサイン辞退

**認証**: 必要（該当スタッフ）

**リクエスト:**

```json
{
  "rejection_reason": "別の予定が入ってしまいました"
}
```

---

### GET /assignments/my

自分のアサイン一覧取得（スタッフ用）

**認証**: 必要（スタッフ）

**クエリパラメータ:**
- `status`: ステータスでフィルタ（offered/accepted/completed）

**レスポンス:**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "reservation": {
        "company_name": "株式会社サンプル",
        "office_name": "梅田営業所",
        "reservation_date": "2024-12-25",
        "start_time": "15:00",
        "end_time": "17:00"
      },
      "status": "accepted",
      "offered_at": "2024-12-20T10:00:00Z"
    }
  ]
}
```

---

## ⏰ 勤怠管理 API

### POST /attendance/clock-in

出勤打刻

**認証**: 必要（スタッフ）

**リクエスト:**

```json
{
  "assignment_id": "uuid",
  "clock_in_time": "2024-12-25T15:00:00Z",
  "clock_in_photo": "data:image/jpeg;base64,...",
  "clock_in_method": "line",
  "notes": "現場到着しました"
}
```

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "assignment_id": "uuid",
    "clock_in_time": "2024-12-25T15:00:00Z",
    "status": "clocked_in"
  }
}
```

---

### POST /attendance/clock-out

退勤打刻

**認証**: 必要（スタッフ）

**リクエスト:**

```json
{
  "attendance_id": "uuid",
  "clock_out_time": "2024-12-25T17:00:00Z",
  "clock_out_photo": "data:image/jpeg;base64,...",
  "break_minutes": 0,
  "work_count": 4,
  "notes": "問題なく完了しました"
}
```

---

### GET /attendance

勤怠一覧取得

**認証**: 必要

**クエリパラメータ:**
- `staff_id`: スタッフIDでフィルタ（管理者のみ）
- `date_from`: 開始日
- `date_to`: 終了日
- `status`: ステータスでフィルタ

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "assignment": {
          "company_name": "株式会社サンプル",
          "reservation_date": "2024-12-25"
        },
        "clock_in_time": "2024-12-25T15:00:00Z",
        "clock_out_time": "2024-12-25T17:00:00Z",
        "work_hours": 2.0,
        "break_minutes": 0,
        "work_count": 4,
        "status": "completed"
      }
    ],
    "pagination": {...}
  }
}
```

---

### GET /attendance/{id}

勤怠詳細取得

**認証**: 必要

---

### GET /attendance/summary

勤怠サマリー取得

**認証**: 必要

**クエリパラメータ:**
- `staff_id`: スタッフID（管理者のみ）
- `year`: 年
- `month`: 月

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "year": 2024,
    "month": 12,
    "total_work_days": 20,
    "total_work_hours": 160.0,
    "total_work_count": 80,
    "estimated_earnings": 320000
  }
}
```

---

## ⭐ 評価管理 API

### POST /evaluations

評価作成

**認証**: 必要（企業）

**リクエスト:**

```json
{
  "assignment_id": "uuid",
  "overall_rating": 5,
  "comment": "とても丁寧な対応でした。また依頼したいです。",
  "want_again": true
}
```

---

### GET /evaluations

評価一覧取得

**認証**: 必要

**クエリパラメータ:**
- `staff_id`: スタッフIDでフィルタ
- `company_id`: 企業IDでフィルタ
- `min_rating`: 最低評価

---

### GET /evaluations/{id}

評価詳細取得

**認証**: 必要

---

### GET /evaluations/staff/{staff_id}

スタッフ別評価一覧取得

**認証**: 必要

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "staff": {
      "id": "uuid",
      "name": "山田花子",
      "average_rating": 4.8,
      "total_evaluations": 145
    },
    "evaluations": [
      {
        "id": "uuid",
        "overall_rating": 5,
        "comment": "とても丁寧な対応でした",
        "want_again": true,
        "company_name": "株式会社サンプル",
        "created_at": "2024-12-25T18:00:00Z"
      }
    ]
  }
}
```

---

## 🔔 通知管理 API

### GET /notifications

通知一覧取得

**認証**: 必要

**クエリパラメータ:**
- `is_read`: 既読/未読フィルタ（true/false）
- `type`: 通知タイプでフィルタ

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "type": "job_offer",
        "title": "新しい業務オファー",
        "message": "株式会社サンプルから業務オファーが届きました",
        "link_url": "/assignments/uuid",
        "is_read": false,
        "created_at": "2024-12-20T10:00:00Z"
      }
    ],
    "unread_count": 5
  }
}
```

---

### PUT /notifications/{id}/read

通知を既読にする

**認証**: 必要

---

### POST /notifications/send

通知送信

**認証**: 必要（管理者のみ）

**リクエスト:**

```json
{
  "user_ids": ["uuid1", "uuid2"],
  "type": "system_announcement",
  "title": "システムメンテナンスのお知らせ",
  "message": "12月30日にシステムメンテナンスを実施します",
  "send_email": true,
  "send_line": true
}
```

---

## 📱 LINE連携 API

### POST /line/webhook

LINE Webhook エンドポイント

**認証**: LINE署名検証

**処理内容:**
- メッセージ受信
- フォロー/アンフォロー
- ポストバック処理

---

### POST /line/send-message

LINEメッセージ送信

**認証**: 必要（管理者のみ）

**リクエスト:**

```json
{
  "user_ids": ["uuid1", "uuid2"],
  "message_type": "text",
  "text": "業務オファーが届きました",
  "quick_replies": [
    {
      "label": "確認する",
      "action": "postback",
      "data": "action=view_offer&id=uuid"
    }
  ]
}
```

---

### GET /line/liff-token

LIFF認証トークン取得

**認証**: 必要

**クエリパラメータ:**
- `line_access_token`: LINE LIFF アクセストークン

**レスポンス:**

```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGc...",
    "user": {
      "id": "uuid",
      "name": "山田花子",
      "role": "staff"
    }
  }
}
```

---

### POST /line/link-account

LINE アカウント連携

**認証**: 必要

**リクエスト:**

```json
{
  "line_user_id": "U1234567890abcdef"
}
```

---

## 🔧 ユーティリティ API

### GET /health

ヘルスチェック

**認証**: 不要

**レスポンス:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": "2024-12-23T12:00:00Z"
}
```

---

### GET /docs

API ドキュメント（Swagger UI）

**認証**: 不要（開発環境のみ）

---

## 🔒 権限マトリックス

| エンドポイント | 管理者 | 企業 | スタッフ |
|--------------|--------|------|---------|
| GET /users | ✅ | ❌ | ❌ |
| POST /companies | ✅ | ❌ | ❌ |
| GET /companies | ✅ | 🔹自社のみ | ❌ |
| POST /reservations | ✅ | ✅ | ❌ |
| GET /staff/search | ✅ | ❌ | ❌ |
| POST /assignments | ✅ | ❌ | ❌ |
| POST /assignments/{id}/accept | ❌ | ❌ | 🔹本人のみ |
| POST /attendance/clock-in | ❌ | ❌ | ✅ |
| POST /evaluations | ✅ | ✅ | ❌ |
| GET /evaluations | ✅ | 🔹自社分のみ | 🔹自分宛のみ |

凡例:
- ✅: 全てアクセス可能
- 🔹: 条件付きアクセス
- ❌: アクセス不可

---

## 📝 エラーコード一覧

| コード | 説明 |
|--------|------|
| AUTH_001 | 認証エラー |
| AUTH_002 | トークン期限切れ |
| AUTH_003 | 権限不足 |
| VALID_001 | バリデーションエラー |
| VALID_002 | 必須フィールドが不足 |
| NOT_FOUND_001 | リソースが見つからない |
| CONFLICT_001 | データが既に存在 |
| BUSINESS_001 | ビジネスロジックエラー |
| SERVER_001 | サーバー内部エラー |

---

## 🚀 レート制限

- **通常API**: 1000リクエスト/時間
- **認証API**: 10リクエスト/分
- **LINE Webhook**: 制限なし

レート制限を超えた場合:
- HTTPステータス: 429 Too Many Requests
- ヘッダー: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

---

## 📚 参考リンク

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [LINE Messaging API](https://developers.line.biz/ja/docs/messaging-api/)

