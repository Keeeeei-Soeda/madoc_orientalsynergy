# データベース設計書

## 📊 概要

オリエンタルシナジー 派遣業務管理システムのデータベース設計書

- **RDBMS**: PostgreSQL 15
- **文字コード**: UTF-8
- **タイムゾーン**: Asia/Tokyo

## 🗺 ER図

```
┌─────────────────┐
│     users       │ ユーザーアカウント（管理者・企業・スタッフ共通）
├─────────────────┤
│ id (PK)         │
│ email           │
│ hashed_password │
│ role            │ ← admin/company/staff
│ is_active       │
│ created_at      │
│ updated_at      │
└────────┬────────┘
         │
         ├───────────────────────────────────────┐
         │                                       │
┌────────▼────────┐                    ┌────────▼────────┐
│   companies     │ 企業               │     staff       │ スタッフ
├─────────────────┤                    ├─────────────────┤
│ id (PK)         │                    │ id (PK)         │
│ user_id (FK)    │                    │ user_id (FK)    │
│ name            │                    │ first_name      │
│ industry        │                    │ last_name       │
│ representative  │                    │ first_name_kana │
│ address         │                    │ last_name_kana  │
│ phone           │                    │ phone           │
│ contract_plan   │                    │ line_user_id    │
│ contract_start  │                    │ date_of_birth   │
│ contract_end    │                    │ gender          │
└────────┬────────┘                    │ postal_code     │
         │                             │ address         │
         │                             │ emergency_name  │
         │                             │ emergency_phone │
         │                             │ average_rating  │
         ├──────────────┐              └────────┬────────┘
         │              │                       │
┌────────▼────────┐ ┌──▼──────────────┐       │
│company_offices  │ │company_employees│       │
├─────────────────┤ ├─────────────────┤  ┌────▼──────────┐
│ id (PK)         │ │ id (PK)         │  │ staff_skills  │
│ company_id (FK) │ │ company_id (FK) │  ├───────────────┤
│ name            │ │ first_name      │  │ id (PK)       │
│ address         │ │ last_name       │  │ staff_id (FK) │
│ phone           │ │ department      │  │ skill_name    │
│ manager_name    │ │ phone           │  │ experience_y  │
└────────┬────────┘ │ email           │  │ certificate   │
         │          │ line_user_id    │  └───────────────┘
         │          └─────────┬───────┘
         │                    │
┌────────▼────────────────────▼────────┐
│         reservations                  │ 予約
├───────────────────────────────────────┤
│ id (PK)                               │
│ company_id (FK)                       │
│ office_id (FK)                        │
│ reservation_date                      │
│ start_time                            │
│ end_time                              │
│ slot_duration (30分固定)              │
│ status                                │ ← pending/confirmed/cancelled/completed
│ notes                                 │
│ created_by (FK → users)               │
└────────┬──────────────────────────────┘
         │
         ├──────────────────┬───────────────────┐
         │                  │                   │
┌────────▼────────┐  ┌──────▼─────────┐ ┌──────▼──────────┐
│reservation_slots│  │  assignments   │ │  evaluations    │
├─────────────────┤  ├────────────────┤ ├─────────────────┤
│ id (PK)         │  │ id (PK)        │ │ id (PK)         │
│ reservation_id  │  │ reservation_id │ │ assignment_id   │
│ employee_id (FK)│  │ staff_id (FK)  │ │ overall_rating  │
│ slot_order      │  │ status         │ │ comment         │
│ slot_start_time │  │ offered_at     │ │ want_again      │
│ slot_end_time   │  │ accepted_at    │ │ created_at      │
│ status          │  │ rejected_at    │ └─────────────────┘
└─────────────────┘  │ assigned_by    │
                     └────────┬───────┘
                              │
                     ┌────────▼────────┐
                     │   attendance    │ 勤怠
                     ├─────────────────┤
                     │ id (PK)         │
                     │ assignment_id   │
                     │ clock_in_time   │
                     │ clock_in_photo  │
                     │ clock_in_method │ ← web/line
                     │ clock_out_time  │
                     │ clock_out_photo │
                     │ break_minutes   │
                     │ work_count      │
                     │ notes           │
                     │ status          │ ← clocked_in/completed
                     └─────────────────┘

┌─────────────────┐
│ notifications   │ 通知
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ type            │ ← job_offer/shift_approved/reminder/evaluation_received
│ title           │
│ message         │
│ link_url        │
│ is_read         │
│ sent_via_email  │
│ sent_via_line   │
│ created_at      │
└─────────────────┘

┌─────────────────┐
│   line_users    │ LINE連携情報
├─────────────────┤
│ id (PK)         │
│ user_id (FK)    │
│ line_user_id    │
│ display_name    │
│ picture_url     │
│ linked_at       │
└─────────────────┘

┌─────────────────┐
│ rich_menus      │ LINEリッチメニュー
├─────────────────┤
│ id (PK)         │
│ menu_id         │
│ name            │
│ image_url       │
│ is_active       │
└─────────────────┘
```

## 📋 テーブル定義

### 1. users（ユーザーアカウント）

全てのユーザー（管理者・企業・スタッフ）の認証情報を管理

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'company', 'staff')),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**カラム説明:**
- `id`: ユーザーID (UUID)
- `email`: メールアドレス（ログインID）
- `hashed_password`: ハッシュ化されたパスワード
- `role`: ユーザーロール（admin: 管理者, company: 企業, staff: スタッフ）
- `is_active`: アカウント有効フラグ
- `last_login_at`: 最終ログイン日時
- `created_at`: 作成日時
- `updated_at`: 更新日時

---

### 2. companies（企業情報）

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    industry VARCHAR(100),
    representative_name VARCHAR(100),
    postal_code VARCHAR(10),
    address TEXT,
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    contract_plan VARCHAR(50),
    contract_start_date DATE,
    contract_end_date DATE,
    total_usage_count INTEGER DEFAULT 0,
    total_amount DECIMAL(12, 2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_companies_user_id ON companies(user_id);
CREATE INDEX idx_companies_name ON companies(name);
```

**カラム説明:**
- `id`: 企業ID
- `user_id`: ユーザーIDへの外部キー
- `name`: 企業名
- `name_kana`: 企業名カナ
- `industry`: 業種
- `representative_name`: 代表者名
- `contract_plan`: 契約プラン（Aプラン、Bプランなど）
- `contract_start_date`: 契約開始日
- `contract_end_date`: 契約終了日
- `total_usage_count`: 累計利用回数
- `total_amount`: 累計金額

---

### 3. company_offices（事業所情報）

```sql
CREATE TABLE company_offices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    postal_code VARCHAR(10),
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    fax VARCHAR(20),
    email VARCHAR(255),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_offices_company_id ON company_offices(company_id);
```

**カラム説明:**
- `id`: 事業所ID
- `company_id`: 企業IDへの外部キー
- `name`: 事業所名
- `address`: 住所
- `latitude`: 緯度（地図表示用）
- `longitude`: 経度（地図表示用）
- `manager_name`: 担当者名
- `is_active`: 有効フラグ

---

### 4. company_employees（企業の社員情報）

企業側の社員（施術を受ける人）

```sql
CREATE TABLE company_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_kana VARCHAR(100),
    last_name_kana VARCHAR(100),
    department VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(255),
    line_user_id VARCHAR(255),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    date_of_birth DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_employees_company_id ON company_employees(company_id);
CREATE INDEX idx_company_employees_line_user_id ON company_employees(line_user_id);
```

**カラム説明:**
- `id`: 社員ID
- `company_id`: 企業IDへの外部キー
- `first_name`, `last_name`: 名前
- `first_name_kana`, `last_name_kana`: 名前カナ
- `department`: 所属部署
- `line_user_id`: LINE連携用ユーザーID
- `gender`: 性別
- `date_of_birth`: 生年月日
- `is_active`: 有効フラグ

---

### 5. staff（スタッフ情報）

派遣スタッフの情報

```sql
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    first_name_kana VARCHAR(100),
    last_name_kana VARCHAR(100),
    phone VARCHAR(20),
    line_user_id VARCHAR(255),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other')),
    postal_code VARCHAR(10),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    emergency_contact_relationship VARCHAR(50),
    profile_photo VARCHAR(255),
    bio TEXT,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_jobs INTEGER DEFAULT 0,
    total_evaluations INTEGER DEFAULT 0,
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    bank_account_type VARCHAR(20),
    bank_account_number VARCHAR(20),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_user_id ON staff(user_id);
CREATE INDEX idx_staff_line_user_id ON staff(line_user_id);
CREATE INDEX idx_staff_average_rating ON staff(average_rating);
```

**カラム説明:**
- `id`: スタッフID
- `user_id`: ユーザーIDへの外部キー
- `line_user_id`: LINE連携用ユーザーID
- `emergency_contact_*`: 緊急連絡先情報
- `average_rating`: 平均評価（1.00〜5.00）
- `total_jobs`: 累計業務数
- `total_evaluations`: 累計評価数
- `bank_*`: 銀行口座情報（報酬振込用）

---

### 6. staff_skills（スタッフのスキル・資格）

```sql
CREATE TABLE staff_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    experience_years INTEGER DEFAULT 0,
    certificate_name VARCHAR(255),
    certificate_number VARCHAR(100),
    certificate_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_staff_skills_staff_id ON staff_skills(staff_id);
CREATE INDEX idx_staff_skills_skill_name ON staff_skills(skill_name);
```

**カラム説明:**
- `id`: スキルID
- `staff_id`: スタッフIDへの外部キー
- `skill_name`: スキル名（例: リンパマッサージ、アロマセラピー等）
- `experience_years`: 経験年数
- `certificate_name`: 資格名
- `certificate_number`: 資格番号
- `certificate_date`: 資格取得日

---

### 7. reservations（予約情報）

```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    office_id UUID NOT NULL REFERENCES company_offices(id) ON DELETE CASCADE,
    reservation_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_duration INTEGER DEFAULT 30,
    total_slots INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
    company_notes TEXT,
    admin_notes TEXT,
    created_by UUID REFERENCES users(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_company_id ON reservations(company_id);
CREATE INDEX idx_reservations_office_id ON reservations(office_id);
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
```

**カラム説明:**
- `id`: 予約ID
- `company_id`: 企業IDへの外部キー
- `office_id`: 事業所IDへの外部キー
- `reservation_date`: 予約日
- `start_time`, `end_time`: 開始・終了時間
- `slot_duration`: 1枠の時間（分）デフォルト30分
- `total_slots`: 総枠数
- `status`: ステータス
  - `pending`: 未確認
  - `confirmed`: 確定
  - `in_progress`: 実施中
  - `completed`: 完了
  - `cancelled`: キャンセル
- `company_notes`: 企業側からの備考
- `admin_notes`: 管理者用メモ

---

### 8. reservation_slots（予約枠）

各予約の時間枠ごとの社員情報

```sql
CREATE TABLE reservation_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES company_employees(id) ON DELETE SET NULL,
    slot_order INTEGER NOT NULL,
    slot_start_time TIME NOT NULL,
    slot_end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' 
        CHECK (status IN ('available', 'booked', 'completed', 'cancelled')),
    employee_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reservation_id, slot_order)
);

CREATE INDEX idx_reservation_slots_reservation_id ON reservation_slots(reservation_id);
CREATE INDEX idx_reservation_slots_employee_id ON reservation_slots(employee_id);
```

**カラム説明:**
- `id`: 枠ID
- `reservation_id`: 予約IDへの外部キー
- `employee_id`: 社員IDへの外部キー（社員が決まったら設定）
- `slot_order`: 枠の順番（1, 2, 3...）
- `slot_start_time`, `slot_end_time`: 枠の開始・終了時間
- `status`: 枠のステータス
- `employee_notes`: 社員からの要望・相談内容

---

### 9. assignments（スタッフアサイン情報）

スタッフへの業務割り当て

```sql
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reservation_id UUID NOT NULL REFERENCES reservations(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'offered'
        CHECK (status IN ('offered', 'accepted', 'rejected', 'completed', 'cancelled')),
    offered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    assigned_by UUID NOT NULL REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_assignments_reservation_id ON assignments(reservation_id);
CREATE INDEX idx_assignments_staff_id ON assignments(staff_id);
CREATE INDEX idx_assignments_status ON assignments(status);
```

**カラム説明:**
- `id`: アサインID
- `reservation_id`: 予約IDへの外部キー
- `staff_id`: スタッフIDへの外部キー
- `status`: アサインステータス
  - `offered`: オファー中
  - `accepted`: 受諾済み
  - `rejected`: 辞退
  - `completed`: 完了
  - `cancelled`: キャンセル
- `offered_at`: オファー日時
- `accepted_at`: 受諾日時
- `rejected_at`: 辞退日時
- `assigned_by`: アサインした管理者のユーザーID

---

### 10. attendance（勤怠記録）

```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    clock_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
    clock_in_photo VARCHAR(255),
    clock_in_method VARCHAR(10) DEFAULT 'web' CHECK (clock_in_method IN ('web', 'line')),
    clock_in_location_lat DECIMAL(10, 8),
    clock_in_location_lng DECIMAL(11, 8),
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_out_photo VARCHAR(255),
    clock_out_method VARCHAR(10) CHECK (clock_out_method IN ('web', 'line')),
    clock_out_location_lat DECIMAL(10, 8),
    clock_out_location_lng DECIMAL(11, 8),
    break_minutes INTEGER DEFAULT 0,
    work_count INTEGER,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'clocked_in' 
        CHECK (status IN ('clocked_in', 'completed', 'verified')),
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_assignment_id ON attendance(assignment_id);
CREATE INDEX idx_attendance_clock_in_time ON attendance(clock_in_time);
CREATE INDEX idx_attendance_status ON attendance(status);
```

**カラム説明:**
- `id`: 勤怠ID
- `assignment_id`: アサインIDへの外部キー
- `clock_in_time`: 出勤打刻時刻
- `clock_in_photo`: 出勤時の写真URL
- `clock_in_method`: 打刻方法（web: Webブラウザ, line: LINE）
- `clock_in_location_*`: 出勤時の位置情報（将来の拡張用）
- `clock_out_time`: 退勤打刻時刻
- `clock_out_photo`: 退勤時の写真URL
- `break_minutes`: 休憩時間（分）
- `work_count`: 作業数（施術人数など）
- `status`: 勤怠ステータス
  - `clocked_in`: 出勤済み
  - `completed`: 退勤済み
  - `verified`: 確認済み

---

### 11. evaluations（評価情報）

```sql
CREATE TABLE evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
    comment TEXT,
    want_again BOOLEAN DEFAULT false,
    evaluated_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(assignment_id)
);

CREATE INDEX idx_evaluations_assignment_id ON evaluations(assignment_id);
CREATE INDEX idx_evaluations_overall_rating ON evaluations(overall_rating);
```

**カラム説明:**
- `id`: 評価ID
- `assignment_id`: アサインIDへの外部キー（1アサインにつき1評価）
- `overall_rating`: 総合評価（1〜5）
- `comment`: コメント（最大1000文字）
- `want_again`: 再依頼希望
- `evaluated_by`: 評価したユーザーID

---

### 12. notifications（通知情報）

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'job_offer',
        'shift_approved',
        'shift_rejected',
        'job_reminder',
        'evaluation_received',
        'system_announcement'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_url VARCHAR(255),
    related_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    sent_via_email BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP WITH TIME ZONE,
    sent_via_line BOOLEAN DEFAULT false,
    line_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

**カラム説明:**
- `id`: 通知ID
- `user_id`: ユーザーIDへの外部キー
- `type`: 通知タイプ
  - `job_offer`: 業務オファー
  - `shift_approved`: シフト承認
  - `shift_rejected`: シフト却下
  - `job_reminder`: 業務リマインダー
  - `evaluation_received`: 評価受信
  - `system_announcement`: システムからのお知らせ
- `title`: 通知タイトル
- `message`: 通知本文
- `link_url`: リンクURL
- `related_id`: 関連エンティティのID（汎用）
- `is_read`: 既読フラグ
- `sent_via_email`: メール送信済みフラグ
- `sent_via_line`: LINE送信済みフラグ

---

### 13. line_users（LINE連携情報）

```sql
CREATE TABLE line_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    line_user_id VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    picture_url VARCHAR(255),
    status_message TEXT,
    linked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_interaction_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_line_users_user_id ON line_users(user_id);
CREATE INDEX idx_line_users_line_user_id ON line_users(line_user_id);
```

**カラム説明:**
- `id`: レコードID
- `user_id`: ユーザーIDへの外部キー
- `line_user_id`: LINE側のユーザーID
- `display_name`: LINEの表示名
- `picture_url`: プロフィール画像URL
- `linked_at`: 連携日時
- `last_interaction_at`: 最終やり取り日時

---

### 14. rich_menus（LINEリッチメニュー）

```sql
CREATE TABLE rich_menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    line_rich_menu_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    target_role VARCHAR(20) CHECK (target_role IN ('staff', 'company_employee', 'all')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rich_menus_is_active ON rich_menus(is_active);
```

**カラム説明:**
- `id`: レコードID
- `line_rich_menu_id`: LINE API側のリッチメニューID
- `name`: メニュー名
- `description`: 説明
- `image_url`: メニュー画像URL
- `target_role`: 対象ロール（staff: スタッフ用、company_employee: 社員用）
- `is_active`: 有効フラグ

---

## 🔗 リレーションシップ

### 主要な関連

1. **users → companies (1:1)**
   - 1ユーザーにつき1企業情報

2. **users → staff (1:1)**
   - 1ユーザーにつき1スタッフ情報

3. **companies → company_offices (1:N)**
   - 1企業は複数の事業所を持つ

4. **companies → company_employees (1:N)**
   - 1企業は複数の社員を持つ

5. **staff → staff_skills (1:N)**
   - 1スタッフは複数のスキルを持つ

6. **reservations → reservation_slots (1:N)**
   - 1予約は複数の時間枠を持つ

7. **reservations → assignments (1:N)**
   - 1予約に対して複数のスタッフをアサイン可能

8. **assignments → attendance (1:1)**
   - 1アサインにつき1勤怠記録

9. **assignments → evaluations (1:1)**
   - 1アサインにつき1評価

10. **users → line_users (1:1)**
    - 1ユーザーにつき1LINE連携情報

---

## 📊 インデックス戦略

### パフォーマンス重視のインデックス

1. **検索頻度の高いカラム**
   - users.email
   - users.role
   - staff.average_rating
   - reservations.reservation_date
   - reservations.status

2. **外部キー**
   - 全ての外部キーカラムにインデックス作成

3. **複合インデックス**
   - (reservation_id, slot_order) - 予約枠の一意性保証
   - (user_id, is_read, created_at) - 通知一覧取得の高速化

---

## 🔒 セキュリティ考慮事項

### データ保護

1. **パスワード**
   - bcrypt でハッシュ化
   - コスト係数: 12

2. **個人情報**
   - 必要に応じて暗号化
   - アクセスログ記録

3. **削除ポリシー**
   - 論理削除（is_active = false）
   - CASCADE 削除は慎重に設定

### バックアップ

1. **自動バックアップ**
   - 日次: フルバックアップ
   - 時間: トランザクションログ

2. **保持期間**
   - 日次: 30日間
   - 週次: 3ヶ月
   - 月次: 1年間

---

## 📈 スケーラビリティ

### 想定規模

- **ユーザー数**: 10,000〜50,000
- **企業数**: 100〜500
- **スタッフ数**: 1,000〜5,000
- **月間予約数**: 5,000〜20,000
- **月間通知数**: 50,000〜200,000

### パーティショニング計画

大規模化した場合の対策：

1. **通知テーブル**
   - 月ごとにパーティション分割
   - 古いデータはアーカイブ

2. **勤怠テーブル**
   - 年ごとにパーティション分割

3. **評価テーブル**
   - スタッフIDでパーティション分割（将来）

---

## 🔄 マイグレーション戦略

### 初期セットアップ

```bash
# Alembic 初期化
alembic init alembic

# 初期マイグレーション作成
alembic revision --autogenerate -m "Initial schema"

# マイグレーション実行
alembic upgrade head
```

### バージョン管理

- 全てのスキーマ変更は Alembic で管理
- マイグレーションファイルは Git で管理
- 本番適用前に必ず検証環境でテスト

---

## 📝 次のステップ

1. ✅ データベース設計書作成
2. ⏭ スキーマSQL作成
3. ⏭ シードデータ作成
4. ⏭ バックエンドモデル実装
5. ⏭ マイグレーションスクリプト作成

