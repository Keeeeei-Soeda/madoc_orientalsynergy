# オリエンタルシナジー システム設計書

## 目次

1. [システム概要](#1-システム概要)
2. [ユーザー定義](#2-ユーザー定義)
3. [データベース設計](#3-データベース設計)
4. [機能要件詳細](#4-機能要件詳細)
5. [API設計](#5-api設計)
6. [画面設計](#6-画面設計)
7. [外部連携](#7-外部連携)
8. [セキュリティ要件](#8-セキュリティ要件)
9. [非機能要件](#9-非機能要件)
10. [開発ロードマップ](#10-開発ロードマップ)

---

## 1. システム概要

### 1.1 システムの目的

派遣業務（民泊清掃、送迎サービス等）における企業とスタッフのマッチング、業務管理、勤怠管理を一元化し、業務効率化と品質向上を実現するプラットフォーム。

### 1.2 主要機能

- 企業・スタッフ・管理者の3層ユーザー管理
- 予約・業務のマッチング
- リアルタイム通知（LINE連携）
- 勤怠管理・打刻システム
- 評価・レビューシステム
- レポート・分析機能

### 1.3 技術スタック（推奨）

```
フロントエンド: React.js / Next.js
バックエンド: Python (Flask/FastAPI)
データベース: PostgreSQL
キャッシュ: Redis
ストレージ: AWS S3 / GCS
通知: LINE Messaging API
インフラ: AWS / GCP
認証: JWT + OAuth2.0
```

---

## 2. ユーザー定義

### 2.1 管理者（オリエンタルシナジー運営）

**役割**
- システム全体の統括管理
- 企業とスタッフのマッチング最適化
- 契約管理と請求処理

**主要権限**
- 全企業・全スタッフの情報閲覧・編集
- 契約プランの設定
- システム設定の変更
- 分析レポートの閲覧

### 2.2 企業ユーザー

**役割**
- 業務依頼の登録
- スタッフの評価
- 業務進捗の確認

**主要権限**
- 自社の予約・業務管理
- 自社に紐づくスタッフの情報閲覧
- 評価の入力・閲覧
- 自社の利用状況レポート閲覧

**サブロール**
- 企業管理者: 全機能利用可能
- 企業担当者: 予約・評価のみ可能
- 閲覧者: 閲覧のみ

### 2.3 スタッフユーザー

**役割**
- 業務への応募・実施
- 勤怠打刻
- シフト希望の提出

**主要権限**
- 自分の業務情報の閲覧
- シフト希望の登録
- 勤怠打刻
- 自分の評価・実績の閲覧

---

## 3. データベース設計

### 3.1 ER図概要

```
[管理者] 1---* [企業]
[企業] 1---* [企業担当者]
[企業] 1---* [予約]
[予約] 1---* [業務]
[業務] *---1 [スタッフ]
[スタッフ] 1---* [勤怠記録]
[スタッフ] 1---* [シフト希望]
[スタッフ] 1---* [評価]
[企業] 1---* [評価]
[業務] 1---* [評価]
```

### 3.2 テーブル定義

#### 3.2.1 ユーザー関連

**users（ユーザーマスタ）**

```sql
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    user_type VARCHAR(20) NOT NULL, -- 'admin', 'company', 'staff'
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    line_user_id VARCHAR(255), -- LINE連携用
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP -- 論理削除
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_line_user_id ON users(line_user_id);
CREATE INDEX idx_users_user_type ON users(user_type);
```

**admins（管理者情報）**

```sql
CREATE TABLE admins (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- 'super_admin', 'admin', 'support'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**companies（企業マスタ）**

```sql
CREATE TABLE companies (
    id BIGSERIAL PRIMARY KEY,
    company_code VARCHAR(50) UNIQUE NOT NULL, -- 企業コード
    name VARCHAR(255) NOT NULL,
    name_kana VARCHAR(255),
    postal_code VARCHAR(10),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    contract_start_date DATE,
    contract_end_date DATE,
    contract_plan VARCHAR(50), -- 'basic', 'standard', 'premium'
    billing_amount DECIMAL(10, 2),
    billing_cycle VARCHAR(20), -- 'monthly', 'quarterly', 'yearly'
    subdomain VARCHAR(100) UNIQUE, -- 専用サイトのサブドメイン
    custom_settings JSONB, -- カスタム設定
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_companies_company_code ON companies(company_code);
CREATE INDEX idx_companies_subdomain ON companies(subdomain);
```

**company_users（企業担当者）**

```sql
CREATE TABLE company_users (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    position VARCHAR(100),
    role VARCHAR(50) DEFAULT 'member', -- 'admin', 'manager', 'member', 'viewer'
    is_primary_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_company_users_company_id ON company_users(company_id);
CREATE INDEX idx_company_users_user_id ON company_users(user_id);
```

**staffs（スタッフマスタ）**

```sql
CREATE TABLE staffs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    staff_code VARCHAR(50) UNIQUE, -- スタッフコード
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name_kana VARCHAR(50),
    first_name_kana VARCHAR(50),
    gender VARCHAR(10), -- 'male', 'female', 'other'
    date_of_birth DATE,
    postal_code VARCHAR(10),
    address TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    bank_account_type VARCHAR(20), -- 'ordinary', 'current'
    bank_account_number VARCHAR(20),
    bank_account_holder VARCHAR(100),
    hire_date DATE,
    employment_type VARCHAR(50), -- 'full_time', 'part_time', 'contract'
    skills JSONB, -- スキル情報 JSON
    certifications JSONB, -- 資格情報 JSON
    average_rating DECIMAL(3, 2) DEFAULT 0.00, -- 平均評価
    total_jobs_completed INT DEFAULT 0, -- 完了業務数
    total_work_hours DECIMAL(10, 2) DEFAULT 0.00, -- 総勤務時間
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_staffs_staff_code ON staffs(staff_code);
CREATE INDEX idx_staffs_user_id ON staffs(user_id);
CREATE INDEX idx_staffs_average_rating ON staffs(average_rating);
```

#### 3.2.2 予約・業務関連

**reservations（予約）**

```sql
CREATE TABLE reservations (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    created_by BIGINT REFERENCES company_users(id), -- 作成者
    reservation_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(100), -- 予約顧客名
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    service_type VARCHAR(50) NOT NULL, -- 'cleaning', 'transport', 'other'
    service_location TEXT NOT NULL, -- サービス提供場所
    service_date DATE NOT NULL,
    service_start_time TIME,
    service_end_time TIME,
    estimated_duration INT, -- 見積もり時間（分）
    required_staff_count INT DEFAULT 1, -- 必要スタッフ数
    special_notes TEXT, -- 特記事項
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reservations_company_id ON reservations(company_id);
CREATE INDEX idx_reservations_service_date ON reservations(service_date);
CREATE INDEX idx_reservations_status ON reservations(status);
```

**jobs（業務）**

```sql
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    reservation_id BIGINT REFERENCES reservations(id) ON DELETE CASCADE,
    staff_id BIGINT REFERENCES staffs(id) ON DELETE SET NULL,
    assigned_by BIGINT REFERENCES users(id), -- アサイン実行者
    job_code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(30) DEFAULT 'assigned', -- 'assigned', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'
    accepted_at TIMESTAMP, -- スタッフの受諾日時
    started_at TIMESTAMP, -- 開始日時
    completed_at TIMESTAMP, -- 完了日時
    actual_duration INT, -- 実際の作業時間（分）
    actual_work_count INT, -- 作業数（清掃の部屋数など）
    completion_notes TEXT, -- 完了報告
    completion_images JSONB, -- 完了時の画像URL配列
    is_modification_requested BOOLEAN DEFAULT false, -- 修正申請有無
    modification_reason TEXT, -- 修正理由
    modification_status VARCHAR(30), -- 'pending', 'approved', 'rejected'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_jobs_reservation_id ON jobs(reservation_id);
CREATE INDEX idx_jobs_staff_id ON jobs(staff_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_service_date ON jobs(service_date);
```

#### 3.2.3 シフト関連

**shift_requests（シフト希望）**

```sql
CREATE TABLE shift_requests (
    id BIGSERIAL PRIMARY KEY,
    staff_id BIGINT REFERENCES staffs(id) ON DELETE CASCADE,
    request_date DATE NOT NULL,
    shift_type VARCHAR(20), -- 'morning', 'afternoon', 'evening', 'night', 'all_day'
    start_time TIME,
    end_time TIME,
    is_available BOOLEAN DEFAULT true, -- 対応可能か
    status VARCHAR(30) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shift_requests_staff_id ON shift_requests(staff_id);
CREATE INDEX idx_shift_requests_request_date ON shift_requests(request_date);
CREATE INDEX idx_shift_requests_status ON shift_requests(status);
```

#### 3.2.4 勤怠関連

**attendance_records（勤怠記録）**

```sql
CREATE TABLE attendance_records (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
    staff_id BIGINT REFERENCES staffs(id) ON DELETE CASCADE,
    clock_in_time TIMESTAMP NOT NULL, -- 出勤打刻
    clock_in_location JSONB, -- 出勤位置情報 {lat, lng, address}
    clock_in_photo_url TEXT, -- 出勤時の写真
    clock_out_time TIMESTAMP, -- 退勤打刻
    clock_out_location JSONB, -- 退勤位置情報
    clock_out_photo_url TEXT, -- 退勤時の写真
    break_duration INT DEFAULT 0, -- 休憩時間（分）
    total_work_duration INT, -- 総勤務時間（分）
    is_approved BOOLEAN DEFAULT false, -- 承認済みか
    approved_by BIGINT REFERENCES users(id),
    approved_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_attendance_records_job_id ON attendance_records(job_id);
CREATE INDEX idx_attendance_records_staff_id ON attendance_records(staff_id);
CREATE INDEX idx_attendance_records_clock_in_time ON attendance_records(clock_in_time);
```

#### 3.2.5 評価関連

**ratings（評価）**

```sql
CREATE TABLE ratings (
    id BIGSERIAL PRIMARY KEY,
    job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
    staff_id BIGINT REFERENCES staffs(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    rated_by BIGINT REFERENCES company_users(id), -- 評価者
    overall_rating INT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
    quality_rating INT CHECK (quality_rating >= 1 AND quality_rating <= 5), -- 品質
    punctuality_rating INT CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5), -- 時間厳守
    communication_rating INT CHECK (communication_rating >= 1 AND communication_rating <= 5), -- コミュニケーション
    attitude_rating INT CHECK (attitude_rating >= 1 AND attitude_rating <= 5), -- 態度
    comment TEXT,
    would_request_again BOOLEAN, -- 再依頼希望
    is_public BOOLEAN DEFAULT false, -- 公開するか
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ratings_staff_id ON ratings(staff_id);
CREATE INDEX idx_ratings_company_id ON ratings(company_id);
CREATE INDEX idx_ratings_job_id ON ratings(job_id);
```

#### 3.2.6 通知関連

**notifications（通知）**

```sql
CREATE TABLE notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'job_assigned', 'shift_approved', 'rating_received', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_id BIGINT, -- 関連するID（job_id, reservation_idなど）
    related_type VARCHAR(50), -- 'job', 'reservation', 'rating', etc.
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    sent_via_line BOOLEAN DEFAULT false, -- LINE送信済みか
    line_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

#### 3.2.7 その他

**vehicles（車両管理）**

```sql
CREATE TABLE vehicles (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT REFERENCES companies(id) ON DELETE CASCADE,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL, -- 車両番号
    vehicle_type VARCHAR(50), -- 'sedan', 'van', 'bus', etc.
    capacity INT, -- 乗車定員
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    year INT,
    license_plate VARCHAR(50),
    insurance_expiry_date DATE,
    inspection_expiry_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vehicles_company_id ON vehicles(company_id);
```

**activity_logs（アクティビティログ）**

```sql
CREATE TABLE activity_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'login', etc.
    entity_type VARCHAR(50), -- 'job', 'reservation', 'staff', etc.
    entity_id BIGINT,
    description TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
```

---

## 4. 機能要件詳細

### 4.1 管理者機能

#### 4.1.1 企業別契約管理

**機能概要**
企業の契約情報を一元管理し、プランや請求情報を管理する。

**詳細機能**

1. **企業登録**
   - 入力項目
     - 企業名（必須）
     - 企業名カナ
     - 企業コード（自動生成または手動入力）
     - 住所
     - 電話番号
     - メールアドレス
     - 契約開始日
     - 契約終了日
     - 契約プラン（Basic/Standard/Premium）
     - 請求金額
     - 請求サイクル（月次/四半期/年次）
     - サブドメイン（企業専用サイト用）
   - バリデーション
     - 企業名: 255文字以内
     - メールアドレス: RFC5322準拠
     - サブドメイン: 英数字とハイフンのみ、3-50文字
   - 登録後処理
     - 企業専用サイトの自動生成
     - 初期管理者アカウントの発行
     - ウェルカムメール送信

2. **企業情報編集**
   - 編集可能項目: 登録時と同様
   - 編集不可項目: 企業コード、作成日時
   - 編集履歴の記録

3. **企業一覧表示**
   - 表示項目
     - 企業名
     - 契約プラン
     - 契約ステータス（有効/期限切れ）
     - 登録スタッフ数
     - 月間業務数
     - 契約開始日
   - フィルター
     - 契約プラン
     - 契約ステータス
     - 契約開始日範囲
   - ソート
     - 企業名（昇順/降順）
     - 契約開始日（新しい順/古い順）
     - 登録スタッフ数（多い順/少ない順）
   - 検索
     - 企業名
     - 企業コード
     - メールアドレス

4. **契約プラン設定**
   - プラン内容
     ```
     Basic:
     - 月間予約数: 50件まで
     - 登録スタッフ数: 10名まで
     - ストレージ: 5GB
     - サポート: メールのみ
     
     Standard:
     - 月間予約数: 200件まで
     - 登録スタッフ数: 50名まで
     - ストレージ: 20GB
     - サポート: メール + チャット
     - 分析レポート: 月次
     
     Premium:
     - 月間予約数: 無制限
     - 登録スタッフ数: 無制限
     - ストレージ: 100GB
     - サポート: 電話 + メール + チャット + 専任担当
     - 分析レポート: 週次 + カスタムレポート
     - API利用可能
     ```

5. **請求管理**
   - 請求書自動生成
   - 支払い状況管理
   - 督促メール送信

#### 4.1.2 予約管理

**機能概要**
全企業の予約を統括管理し、スタッフのマッチングを最適化する。

**詳細機能**

1. **予約一覧**
   - 表示項目
     - 予約番号
     - 企業名
     - サービス種別
     - サービス日時
     - 場所
     - 必要スタッフ数
     - アサイン状況
     - ステータス
   - フィルター
     - 企業
     - サービス種別
     - 日付範囲
     - ステータス
     - アサイン状況（未アサイン/一部アサイン/全員アサイン）
   - 表示形式
     - リスト表示
     - カレンダー表示
     - ガントチャート表示

2. **スタッフアサイン**
   - アサイン条件設定
     - 必須スキル
     - 優先スキル
     - 除外スタッフ
     - 優先スタッフ
   - 自動マッチング機能
     - マッチングスコア計算
       - スキル適合度: 40%
       - 評価: 30%
       - 距離: 15%
       - 過去の業務実績: 15%
     - 候補スタッフリスト表示
   - 手動アサイン
     - スタッフ検索
     - 候補スタッフの詳細表示
     - 複数スタッフの一括アサイン
   - アサイン後処理
     - スタッフへの通知（LINE + アプリ内）
     - 企業への通知
     - カレンダー自動更新

3. **予約カレンダー**
   - 月表示/週表示/日表示
   - 企業別・スタッフ別・サービス別表示切替
   - ドラッグ&ドロップで予約移動
   - 予約の色分け（ステータス別）

#### 4.1.3 スタッフ管理

**機能概要**
全スタッフの情報、スキル、実績を一元管理する。

**詳細機能**

1. **スタッフ登録**
   - 入力項目
     - 基本情報（氏名、フリガナ、生年月日、性別）
     - 連絡先（電話、メール、LINE ID）
     - 住所
     - 緊急連絡先
     - 銀行口座情報
     - 入社日
     - 雇用形態
     - スキル（複数選択可）
       - 民泊清掃
       - 運転（普通/中型/大型）
       - 介護
       - 多言語対応（言語選択）
       - その他
     - 資格
       - 資格名
       - 取得日
       - 有効期限
       - 証明書アップロード
   - バリデーション
     - 生年月日: 18歳以上
     - メールアドレス: 重複チェック
     - 電話番号: 形式チェック
   - 登録後処理
     - スタッフコード自動発行
     - ログインアカウント作成
     - ウェルカムメール送信
     - LINE連携案内

2. **スタッフ一覧**
   - 表示項目
     - スタッフコード
     - 氏名
     - 評価（★表示）
     - 完了業務数
     - 稼働可能状況
     - 最終勤務日
   - フィルター
     - スキル
     - 雇用形態
     - 稼働状況（稼働中/待機中/休職中）
     - 評価（4.5以上/4.0以上/3.5以上）
     - エリア
   - ソート
     - 評価（高い順/低い順）
     - 完了業務数（多い順/少ない順）
     - 登録日（新しい順/古い順）

3. **スタッフ詳細**
   - 表示情報
     - プロフィール情報
     - スキル・資格一覧
     - 評価履歴（グラフ表示）
     - 業務実績
       - 月別業務数グラフ
       - 業務種別割合（円グラフ）
       - 時間帯別実績
     - 勤怠サマリー
       - 月間勤務時間
       - 月間勤務日数
       - 遅刻・早退回数
     - 評価コメント一覧
   - 操作
     - 編集
     - 一時停止（アサイン不可にする）
     - 退職処理

4. **スタッフパフォーマンス分析**
   - ダッシュボード
     - 平均評価の推移
     - 完了率（受諾した業務の完了率）
     - 遅刻率
     - キャンセル率
   - レポート出力
     - PDF形式
     - Excel形式

---

### 4.2 企業側機能

#### 4.2.1 企業情報管理

**機能概要**
自社の情報と担当者を管理する。

**詳細機能**

1. **企業プロフィール編集**
   - 編集可能項目
     - 企業名
     - 住所
     - 電話番号
     - メールアドレス
     - ロゴ画像
     - 業種
     - 従業員数
   - 編集不可項目
     - 企業コード
     - 契約プラン
     - 契約日

2. **社員管理**
   - 社員登録
     - 氏名
     - メールアドレス
     - 部署
     - 役職
     - 権限レベル（管理者/担当者/閲覧者）
   - 社員一覧表示
   - 権限変更
   - 退職処理（アカウント無効化）

#### 4.2.2 予約管理

**機能概要**
業務の予約登録から完了まで管理する。

**詳細機能**

1. **予約登録**
   - 入力フォーム
     - サービス種別（選択）
       - 民泊清掃
       - 送迎サービス
       - その他
     - サービス日時
       - 日付（カレンダー選択）
       - 開始時間
       - 終了時間（または所要時間）
     - サービス場所
       - 住所入力
       - 地図での位置指定
     - 顧客情報
       - 顧客名
       - 電話番号
       - メールアドレス
     - 必要スタッフ数
     - スキル要件（任意）
     - 特記事項
   - バリデーション
     - 日時: 現在より未来
     - 必要スタッフ数: 1以上
   - 登録後処理
     - 予約番号自動発行
     - 管理者への通知
     - 自動マッチング開始（契約プランにより）

2. **予約一覧**
   - 表示項目
     - 予約番号
     - サービス種別アイコン
     - 日時
     - 場所
     - スタッフアサイン状況
       - 未アサイン: 「スタッフ募集中」（オレンジ）
       - 一部アサイン: 「2/3名確定」（黄色）
       - 全員アサイン: 「確定」（緑）
     - ステータス
   - フィルター
     - 日付範囲
     - サービス種別
     - ステータス
   - 表示形式
     - リスト
     - カレンダー

3. **予約詳細**
   - 表示情報
     - 予約情報
     - アサインされたスタッフ情報
       - 顔写真
       - 氏名
       - 評価
       - スキル
       - 過去の業務実績
     - 進捗状況
       - 出勤打刻時刻
       - 作業中
       - 完了報告
     - 勤怠情報
     - 完了報告内容
   - 操作
     - 編集（未確定の場合のみ）
     - キャンセル
     - スタッフへメッセージ送信
     - 評価入力（完了後）

4. **予約編集**
   - 編集可能タイミング
     - 未確定: 全項目
     - 確定済み: 特記事項のみ
     - 進行中: 編集不可
   - 編集時の処理
     - スタッフへの変更通知
     - 再マッチングの必要性判定

5. **予約キャンセル**
   - キャンセル理由入力（必須）
   - キャンセル料金の表示
     - 3日前まで: 無料
     - 2日前: 30%
     - 前日: 50%
     - 当日: 100%
   - キャンセル後処理
     - スタッフへの通知とキャンセル料支払い
     - 統計データへの反映

#### 4.2.3 スタッフ管理

**機能概要**
自社に紐づくスタッフの情報と評価を管理する。

**詳細機能**

1. **スタッフ新規入力**
   - 入力項目
     - 氏名
     - 電話番号
     - メールアドレス
     - スキル
     - 備考
   - 入力後処理
     - 管理者に新規スタッフ登録依頼を送信
     - 承認後にスタッフアカウント作成

2. **スタッフ一覧**
   - 表示項目
     - 顔写真
     - 氏名
     - 評価（★表示）
     - 自社での業務回数
     - 最終業務日
     - 再依頼意向
   - フィルター
     - スキル
     - 評価
     - 再依頼意向あり
   - ソート
     - 評価順
     - 業務回数順
     - 最終業務日順

3. **スタッフ詳細**
   - 表示情報
     - プロフィール
     - スキル・資格
     - 自社での業務履歴
       - 日時
       - 業務内容
       - 評価
       - コメント
     - 評価サマリー
       - 総合評価平均
       - 品質
       - 時間厳守
       - コミュニケーション
       - 態度
     - グラフ表示
       - 評価の推移
       - 月別業務回数

4. **スタッフ利用状況確認**
   - 表示情報
     - 月別利用統計
     - よく依頼するスタッフランキング
     - スタッフ別売上貢献度

#### 4.2.4 評価管理

**機能概要**
業務完了後にスタッフを評価し、フィードバックを提供する。

**詳細機能**

1. **評価入力**
   - 入力タイミング
     - 業務完了後24時間以内
   - 評価項目
     - 総合評価: ★1-5
     - 品質: ★1-5
     - 時間厳守: ★1-5
     - コミュニケーション: ★1-5
     - 態度: ★1-5
     - コメント（任意、1000文字以内）
     - 再依頼希望: はい/いいえ
   - 入力後処理
     - スタッフへの通知
     - スタッフの平均評価更新
     - 再依頼率の更新

2. **評価一覧**
   - 表示項目
     - 日付
     - スタッフ名
     - 業務内容
     - 評価
     - コメント
   - フィルター
     - 期間
     - スタッフ
     - 評価（4以上/3以上）

3. **評価編集**
   - 編集可能期間: 評価後7日間
   - 編集履歴の記録

#### 4.2.5 通知・コミュニケーション

**機能概要**
スタッフとのコミュニケーションと各種通知を管理する。

**詳細機能**

1. **通知一覧**
   - 通知種別
     - 予約確定
     - スタッフアサイン完了
     - 業務開始
     - 業務完了
     - 評価受信
     - システムからのお知らせ
   - 表示情報
     - タイトル
     - メッセージ
     - 日時
     - 関連情報へのリンク
   - 操作
     - 既読にする
     - 削除

2. **メッセージ機能**
   - 1対1チャット（企業担当者 ⇔ スタッフ）
   - グループチャット（複数スタッフへの一斉送信）
   - メッセージ機能
     - テキスト
     - 画像添付
     - ファイル添付
   - 既読・未読管理

3. **通知設定**
   - 受信設定
     - メール通知: ON/OFF
     - LINE通知: ON/OFF
     - アプリ内通知: ON/OFF
   - 通知種別ごとの設定
     - 予約関連
     - スタッフ関連
     - 評価関連
     - システム関連

#### 4.2.6 レポート・分析

**機能概要**
自社の利用状況を分析し、レポートを閲覧する。

**詳細機能**

1. **ダッシュボード**
   - 表示期間選択（今月/先月/過去3ヶ月/過去6ヶ月/過去1年）
   - KPI表示
     - 総予約数
     - 完了業務数
     - キャンセル率
     - 平均評価
     - 利用スタッフ数
     - 総支払額
   - グラフ
     - 月別予約数推移（折れ線グラフ）
     - サービス種別割合（円グラフ）
     - 時間帯別利用状況（棒グラフ）
     - スタッフ評価分布（ヒストグラム）

2. **詳細レポート**
   - スタッフ別レポート
     - 利用回数
     - 平均評価
     - 再依頼率
   - サービス別レポート
     - 予約数
     - 平均所要時間
     - 平均コスト
   - 時系列レポート
     - 日別/週別/月別集計

3. **レポート出力**
   - PDF形式
   - Excel形式
   - メール送信

---

### 4.3 スタッフ側機能

#### 4.3.1 シフト管理

**機能概要**
希望シフトの登録と承認状況を管理する。

**詳細機能**

1. **シフト希望登録**
   - 入力方法
     - カレンダーから日付選択
     - 時間帯選択
       - 全日
       - 午前（6:00-12:00）
       - 午後（12:00-18:00）
       - 夕方（18:00-24:00）
       - 夜間（24:00-6:00）
       - カスタム時間帯（開始・終了時刻を手動入力）
     - 対応可否（○/×/△）
     - 備考
   - 一括登録機能
     - 曜日指定で繰り返し登録
     - 期間一括登録
   - 登録後処理
     - 管理者への通知
     - LINE通知

2. **シフト一覧**
   - カレンダー表示
     - 月表示
     - 週表示
   - ステータス表示
     - 未提出: グレー
     - 申請中: オレンジ
     - 承認済み: 緑
     - 却下: 赤
   - フィルター
     - ステータス
     - 期間

3. **シフト編集・削除**
   - 編集可能期限: 対象日の3日前まで
   - 削除可能期限: 対象日の3日前まで
   - 急な変更の場合: 備考欄に理由記載

4. **LINE通知**
   - 通知内容
     - シフト承認
     - シフト却下（理由付き）
     - シフト変更依頼
   - 通知設定
     - 通知ON/OFF
     - 通知時間帯設定

#### 4.3.2 業務管理

**機能概要**
アサインされた業務への応募、確認、実施を行う。

**詳細機能**

1. **業務オファー確認**
   - オファー通知
     - LINE通知
     - アプリ内通知
   - 表示情報
     - 企業名
     - サービス種別
     - 日時
     - 場所（地図表示）
     - 所要時間
     - 報酬
     - 特記事項
   - 対応
     - 受諾
     - 辞退（理由選択）
   - 受諾期限: オファーから24時間以内

2. **業務一覧**
   - ステータス別タブ
     - オファー中（未回答）
     - 受諾済み（今後の予定）
     - 進行中
     - 完了
     - キャンセル
   - 表示項目
     - 日時
     - 企業名
     - サービス種別アイコン
     - 場所
     - ステータス
   - ソート
     - 日時順
     - 企業名順
   - フィルター
     - 期間
     - サービス種別
     - 企業

3. **業務詳細**
   - 表示情報
     - 業務番号
     - 企業情報
       - 企業名
       - 担当者名
       - 連絡先
     - サービス情報
       - 種別
       - 日時
       - 場所（地図）
       - 住所
       - 所要時間
       - 報酬
     - 特記事項
     - 企業からのメッセージ
   - 操作
     - 経路案内（Google Maps連携）
     - 企業へメッセージ送信
     - 出勤打刻
     - 退勤打刻
     - 完了報告

4. **業務受諾・辞退**
   - 受諾
     - 確認メッセージ表示
     - 受諾ボタン押下
     - カレンダーへ自動追加
   - 辞退
     - 辞退理由選択（必須）
       - スケジュールが合わない
       - スキルが不足している
       - 場所が遠い
       - その他（自由記述）
     - 辞退後処理
       - 管理者へ通知
       - 他のスタッフへ再オファー

5. **業務確認（YES/NO）**
   - 確認タイミング: 業務前日の18:00
   - 確認内容
     - 「明日の業務に参加できますか？」
     - YES/NO選択
   - NO選択時
     - キャンセル理由入力
     - ペナルティ表示
     - 管理者へ緊急通知

#### 4.3.3 勤怠管理

**機能概要**
出退勤打刻と勤務実績を管理する。

**詳細機能**

1. **出勤打刻**
   - 打刻タイミング: 業務開始15分前から可能
   - 打刻情報
     - 打刻時刻（自動取得）
     - 位置情報（GPS）
       - 指定場所から100m以内: OK
       - 100m以上離れている: 警告表示
     - 顔写真撮影（任意）
   - 打刻完了後
     - 確認メッセージ表示
     - 企業・管理者へ通知

2. **退勤打刻**
   - 打刻情報
     - 打刻時刻（自動取得）
     - 位置情報（GPS）
     - 作業完了写真（任意）
   - 追加情報入力
     - 作業数（清掃の部屋数など）
     - 休憩時間
   - 打刻完了後
     - 勤務時間自動計算
     - 企業・管理者へ通知
     - 完了報告画面へ遷移

3. **勤怠一覧**
   - 表示期間選択（今月/先月/期間指定）
   - 表示項目
     - 日付
     - 企業名
     - 出勤時刻
     - 退勤時刻
     - 勤務時間
     - 休憩時間
     - 実労働時間
     - ステータス（承認済み/未承認/修正申請中）
   - 月間サマリー
     - 総勤務日数
     - 総勤務時間
     - 総報酬（予定）

4. **勤怠詳細**
   - 表示情報
     - 業務情報
     - 出退勤時刻
     - 位置情報（地図表示）
     - 勤務時間
     - 休憩時間
     - 作業数
     - 報酬
     - 承認状況
   - 操作
     - 修正申請

5. **修正申請**
   - 申請可能期間: 勤務日から7日以内
   - 修正内容
     - 出勤時刻
     - 退勤時刻
     - 休憩時間
     - 作業数
   - 修正理由入力（必須）
   - 申請後処理
     - 管理者へ通知
     - 承認待ちステータスに変更

#### 4.3.4 完了報告

**機能概要**
業務完了時に報告を行う。

**詳細機能**

1. **完了報告入力**
   - 入力タイミング: 退勤打刻直後
   - 入力項目
     - 作業内容（テキスト、500文字以内）
     - 作業数（数値）
     - 完了写真（最大5枚）
     - 特記事項（任意、500文字以内）
   - 報告後処理
     - 企業・管理者へ通知
     - 業務ステータスを「完了」に変更

2. **完了報告一覧**
   - 表示項目
     - 日付
     - 企業名
     - 作業内容
     - 評価（企業から）
   - フィルター
     - 期間
     - 企業
     - 評価有無

#### 4.3.5 マイページ

**機能概要**
自分の情報、実績、評価を確認・編集する。

**詳細機能**

1. **プロフィール**
   - 表示情報
     - 顔写真
     - 氏名
     - スタッフコード
     - メールアドレス
     - 電話番号
     - LINE ID
     - 住所
     - 生年月日
     - スキル
     - 資格
     - 自己PR
   - 編集可能項目
     - 顔写真
     - 電話番号
     - 住所
     - 自己PR
   - 編集不可項目
     - 氏名
     - スタッフコード
     - メールアドレス

2. **実績サマリー**
   - 表示情報
     - 総業務回数
     - 総勤務時間
     - 平均評価（★表示）
     - ランク（ブロンズ/シルバー/ゴールド/プラチナ）
     - 獲得バッジ
   - グラフ
     - 月別業務回数（棒グラフ）
     - 評価の推移（折れ線グラフ）
     - サービス種別割合（円グラフ）

3. **評価一覧**
   - 表示項目
     - 日付
     - 企業名
     - 業務内容
     - 総合評価（★）
     - 品質（★）
     - 時間厳守（★）
     - コミュニケーション（★）
     - 態度（★）
     - コメント
   - 平均評価表示
   - フィルター
     - 期間
     - 企業
     - 評価（4以上/3以上）

4. **収入管理**
   - 表示情報
     - 月間収入（予定）
     - 月間収入（確定）
     - 累計収入
   - 収入明細
     - 日付
     - 企業名
     - 勤務時間
     - 報酬
     - ステータス（未払い/支払済み）
   - 月別推移グラフ

5. **バッジ・ランク**
   - ランク制度
     ```
     ブロンズ: 業務回数 0-49回
     シルバー: 業務回数 50-199回
     ゴールド: 業務回数 200-499回
     プラチナ: 業務回数 500回以上
     ```
   - バッジ種類
     - 皆勤賞: 1ヶ月欠勤なし
     - 高評価: 平均評価4.5以上を3ヶ月継続
     - 早起き: 早朝シフト（6-8時）を月10回以上
     - 多言語: 外国語対応業務を10回以上
     - リピーター: 同じ企業から10回以上依頼

6. **通知設定**
   - LINE通知設定
     - オファー通知: ON/OFF
     - シフト承認通知: ON/OFF
     - 業務リマインダー: ON/OFF
     - 評価受信通知: ON/OFF
   - 通知時間帯設定
     - 通知を受け取る時間帯を指定

---

## 5. API設計

### 5.1 認証API

#### POST /api/auth/register
ユーザー登録

**リクエスト**
```json
{
  "user_type": "staff",
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "phone": "090-1234-5678",
  "name": "山田太郎"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "登録完了。確認メールを送信しました。",
  "user_id": 12345
}
```

#### POST /api/auth/login
ログイン

**リクエスト**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**レスポンス**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 12345,
    "user_type": "staff",
    "email": "user@example.com",
    "name": "山田太郎"
  }
}
```

#### POST /api/auth/refresh
トークンリフレッシュ

**リクエスト**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**レスポンス**
```json
{
  "success": true,
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/auth/logout
ログアウト

**レスポンス**
```json
{
  "success": true,
  "message": "ログアウトしました"
}
```

---

### 5.2 予約API（企業側）

#### POST /api/companies/{company_id}/reservations
予約作成

**リクエスト**
```json
{
  "customer_name": "田中花子",
  "customer_phone": "080-9876-5432",
  "customer_email": "tanaka@example.com",
  "service_type": "cleaning",
  "service_location": "東京都渋谷区xxx-xxx",
  "service_date": "2024-12-15",
  "service_start_time": "10:00",
  "service_end_time": "14:00",
  "estimated_duration": 240,
  "required_staff_count": 2,
  "special_notes": "ペットがいるため事前連絡必要"
}
```

**レスポンス**
```json
{
  "success": true,
  "reservation": {
    "id": 67890,
    "reservation_code": "RES-20241201-001",
    "status": "pending",
    "created_at": "2024-12-01T10:30:00Z"
  }
}
```

#### GET /api/companies/{company_id}/reservations
予約一覧取得

**クエリパラメータ**
- `page`: ページ番号（デフォルト: 1）
- `per_page`: 1ページあたりの件数（デフォルト: 20）
- `status`: ステータスフィルター
- `service_type`: サービス種別フィルター
- `date_from`: 開始日フィルター
- `date_to`: 終了日フィルター

**レスポンス**
```json
{
  "success": true,
  "reservations": [
    {
      "id": 67890,
      "reservation_code": "RES-20241201-001",
      "service_type": "cleaning",
      "service_date": "2024-12-15",
      "service_start_time": "10:00",
      "service_location": "東京都渋谷区xxx-xxx",
      "required_staff_count": 2,
      "assigned_staff_count": 1,
      "status": "assigned"
    }
  ],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### GET /api/companies/{company_id}/reservations/{reservation_id}
予約詳細取得

**レスポンス**
```json
{
  "success": true,
  "reservation": {
    "id": 67890,
    "reservation_code": "RES-20241201-001",
    "customer_name": "田中花子",
    "service_type": "cleaning",
    "service_date": "2024-12-15",
    "service_start_time": "10:00",
    "service_end_time": "14:00",
    "service_location": "東京都渋谷区xxx-xxx",
    "status": "assigned",
    "assigned_staff": [
      {
        "staff_id": 123,
        "name": "山田太郎",
        "rating": 4.8,
        "profile_image_url": "https://..."
      }
    ],
    "created_at": "2024-12-01T10:30:00Z",
    "updated_at": "2024-12-02T15:20:00Z"
  }
}
```

#### PUT /api/companies/{company_id}/reservations/{reservation_id}
予約更新

**リクエスト**
```json
{
  "service_start_time": "11:00",
  "service_end_time": "15:00",
  "special_notes": "開始時間変更のため"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "予約を更新しました",
  "reservation": { ... }
}
```

#### DELETE /api/companies/{company_id}/reservations/{reservation_id}
予約キャンセル

**リクエスト**
```json
{
  "cancel_reason": "顧客都合によりキャンセル"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "予約をキャンセルしました",
  "cancellation_fee": 5000
}
```

---

### 5.3 業務API（スタッフ側）

#### GET /api/staffs/{staff_id}/jobs
業務一覧取得

**クエリパラメータ**
- `status`: ステータスフィルター（offered/accepted/in_progress/completed）
- `date_from`: 開始日フィルター
- `date_to`: 終了日フィルター

**レスポンス**
```json
{
  "success": true,
  "jobs": [
    {
      "id": 11111,
      "job_code": "JOB-20241201-001",
      "company_name": "ABC株式会社",
      "service_type": "cleaning",
      "service_date": "2024-12-15",
      "service_start_time": "10:00",
      "service_location": "東京都渋谷区xxx-xxx",
      "estimated_payment": 8000,
      "status": "accepted"
    }
  ]
}
```

#### GET /api/staffs/{staff_id}/jobs/{job_id}
業務詳細取得

**レスポンス**
```json
{
  "success": true,
  "job": {
    "id": 11111,
    "job_code": "JOB-20241201-001",
    "company": {
      "name": "ABC株式会社",
      "contact_name": "鈴木一郎",
      "contact_phone": "03-1234-5678"
    },
    "service_type": "cleaning",
    "service_date": "2024-12-15",
    "service_start_time": "10:00",
    "service_end_time": "14:00",
    "service_location": "東京都渋谷区xxx-xxx",
    "service_location_lat": 35.6585,
    "service_location_lng": 139.7454,
    "estimated_duration": 240,
    "estimated_payment": 8000,
    "special_notes": "ペットがいるため事前連絡必要",
    "status": "accepted"
  }
}
```

#### POST /api/staffs/{staff_id}/jobs/{job_id}/accept
業務受諾

**レスポンス**
```json
{
  "success": true,
  "message": "業務を受諾しました"
}
```

#### POST /api/staffs/{staff_id}/jobs/{job_id}/reject
業務辞退

**リクエスト**
```json
{
  "reject_reason": "schedule_conflict"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "業務を辞退しました"
}
```

#### POST /api/staffs/{staff_id}/jobs/{job_id}/clock-in
出勤打刻

**リクエスト**
```json
{
  "latitude": 35.6585,
  "longitude": 139.7454,
  "photo_url": "https://..."
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "出勤を打刻しました",
  "clock_in_time": "2024-12-15T10:00:00Z"
}
```

#### POST /api/staffs/{staff_id}/jobs/{job_id}/clock-out
退勤打刻

**リクエスト**
```json
{
  "latitude": 35.6585,
  "longitude": 139.7454,
  "break_duration": 30,
  "work_count": 5,
  "photo_url": "https://..."
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "退勤を打刻しました",
  "clock_out_time": "2024-12-15T14:00:00Z",
  "total_work_duration": 210
}
```

#### POST /api/staffs/{staff_id}/jobs/{job_id}/completion-report
完了報告

**リクエスト**
```json
{
  "work_description": "全5室の清掃を完了しました",
  "work_count": 5,
  "completion_photos": [
    "https://...",
    "https://..."
  ],
  "special_notes": "特に問題ありませんでした"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "完了報告を送信しました"
}
```

---

### 5.4 勤怠API

#### GET /api/staffs/{staff_id}/attendance
勤怠一覧取得

**クエリパラメータ**
- `month`: 年月（YYYY-MM形式）

**レスポンス**
```json
{
  "success": true,
  "attendance_records": [
    {
      "id": 22222,
      "job_id": 11111,
      "company_name": "ABC株式会社",
      "service_date": "2024-12-15",
      "clock_in_time": "2024-12-15T10:00:00Z",
      "clock_out_time": "2024-12-15T14:00:00Z",
      "break_duration": 30,
      "total_work_duration": 210,
      "is_approved": true
    }
  ],
  "summary": {
    "total_days": 20,
    "total_hours": 160.5,
    "total_payment": 200000
  }
}
```

#### GET /api/staffs/{staff_id}/attendance/{attendance_id}
勤怠詳細取得

#### POST /api/staffs/{staff_id}/attendance/{attendance_id}/modification-request
勤怠修正申請

**リクエスト**
```json
{
  "modification_type": "clock_out_time",
  "original_value": "2024-12-15T14:00:00Z",
  "new_value": "2024-12-15T15:00:00Z",
  "reason": "打刻を忘れていたため"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "修正申請を送信しました"
}
```

---

### 5.5 評価API

#### POST /api/companies/{company_id}/ratings
評価作成

**リクエスト**
```json
{
  "job_id": 11111,
  "staff_id": 123,
  "overall_rating": 5,
  "quality_rating": 5,
  "punctuality_rating": 5,
  "communication_rating": 4,
  "attitude_rating": 5,
  "comment": "非常に丁寧な対応でした",
  "would_request_again": true
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "評価を送信しました",
  "rating_id": 33333
}
```

#### GET /api/staffs/{staff_id}/ratings
評価一覧取得（スタッフ用）

**レスポンス**
```json
{
  "success": true,
  "ratings": [
    {
      "id": 33333,
      "company_name": "ABC株式会社",
      "service_date": "2024-12-15",
      "overall_rating": 5,
      "quality_rating": 5,
      "punctuality_rating": 5,
      "communication_rating": 4,
      "attitude_rating": 5,
      "comment": "非常に丁寧な対応でした",
      "created_at": "2024-12-16T10:00:00Z"
    }
  ],
  "average": {
    "overall": 4.8,
    "quality": 4.7,
    "punctuality": 4.9,
    "communication": 4.6,
    "attitude": 4.8
  }
}
```

---

### 5.6 シフトAPI

#### POST /api/staffs/{staff_id}/shift-requests
シフト希望登録

**リクエスト**
```json
{
  "request_date": "2024-12-20",
  "shift_type": "all_day",
  "start_time": "09:00",
  "end_time": "18:00",
  "is_available": true,
  "notes": "終日対応可能です"
}
```

**レスポンス**
```json
{
  "success": true,
  "message": "シフト希望を登録しました",
  "shift_request_id": 44444
}
```

#### GET /api/staffs/{staff_id}/shift-requests
シフト希望一覧取得

**クエリパラメータ**
- `month`: 年月（YYYY-MM形式）
- `status`: ステータスフィルター

**レスポンス**
```json
{
  "success": true,
  "shift_requests": [
    {
      "id": 44444,
      "request_date": "2024-12-20",
      "shift_type": "all_day",
      "start_time": "09:00",
      "end_time": "18:00",
      "status": "approved",
      "approved_at": "2024-12-10T12:00:00Z"
    }
  ]
}
```

#### PUT /api/staffs/{staff_id}/shift-requests/{shift_request_id}
シフト希望更新

#### DELETE /api/staffs/{staff_id}/shift-requests/{shift_request_id}
シフト希望削除

---

### 5.7 通知API

#### GET /api/users/{user_id}/notifications
通知一覧取得

**クエリパラメータ**
- `is_read`: 既読フィルター（true/false）
- `limit`: 取得件数

**レスポンス**
```json
{
  "success": true,
  "notifications": [
    {
      "id": 55555,
      "notification_type": "job_assigned",
      "title": "新しい業務がアサインされました",
      "message": "2024年12月15日の清掃業務にアサインされました",
      "related_id": 11111,
      "related_type": "job",
      "is_read": false,
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "unread_count": 5
}
```

#### PUT /api/users/{user_id}/notifications/{notification_id}/read
通知を既読にする

**レスポンス**
```json
{
  "success": true,
  "message": "通知を既読にしました"
}
```

#### PUT /api/users/{user_id}/notifications/read-all
全通知を既読にする

---

### 5.8 LINE連携API

#### POST /api/line/webhook
LINE Webhook（LINE Messaging API用）

**処理内容**
- ユーザーからのメッセージ受信
- 業務確認の回答（YES/NO）
- 通知の配信

---

## 6. 画面設計

### 6.1 管理者画面

#### 6.1.1 ダッシュボード

**レイアウト**
```
┌──────────────────────────────────────────┐
│ ヘッダー（ロゴ、ユーザー名、ログアウト） │
├──────────────────────────────────────────┤
│ サイドメニュー │      メインコンテンツ    │
│               │                          │
│ - ダッシュボード│  KPIカード（4つ横並び）  │
│ - 企業管理    │  ┌─────┬─────┬─────┐  │
│ - 予約管理    │  │総企業│総スタ│月間業│  │
│ - スタッフ管理│  │  数  │  数  │  務数 │  │
│ - レポート    │  └─────┴─────┴─────┘  │
│ - 設定        │                          │
│               │  グラフエリア            │
│               │  ┌──────────────────┐  │
│               │  │月別業務数推移      │  │
│               │  │（折れ線グラフ）    │  │
│               │  └──────────────────┘  │
│               │                          │
│               │  最近のアクティビティ    │
│               │  ┌──────────────────┐  │
│               │  │・企業Aが新規登録   │  │
│               │  │・予約123が完了     │  │
│               │  └──────────────────┘  │
└──────────────────────────────────────────┘
```

**主要コンポーネント**
1. KPIカード
   - 総企業数
   - 総スタッフ数
   - 月間業務数
   - 平均評価

2. グラフ
   - 月別業務数推移
   - サービス種別割合
   - スタッフ稼働率

3. アクティビティフィード
   - 最新10件の重要なアクティビティ

#### 6.1.2 企業管理画面

**企業一覧**
```
┌──────────────────────────────────────────┐
│ 企業管理                    ＋新規登録   │
├──────────────────────────────────────────┤
│ 検索: [              ] 🔍               │
│ フィルター: [契約プラン▼] [ステータス▼] │
├──────────────────────────────────────────┤
│ 企業名     │プラン│ステ│スタ│業務│操作│
│────────────┼─────┼───┼───┼───┼───┤
│ABC株式会社 │Std   │有効│ 25 │150 │詳細│
│XYZ商事    │Pre   │有効│ 50 │300 │詳細│
│───────────────────────────────────────│
│ ページネーション    < 1 2 3 4 5 >      │
└──────────────────────────────────────────┘
```

**企業詳細**
```
┌──────────────────────────────────────────┐
│ ABC株式会社                   [編集]    │
├──────────────────────────────────────────┤
│ タブ: [基本情報] [担当者] [統計]       │
├──────────────────────────────────────────┤
│ 企業コード: COM-001                      │
│ 契約プラン: Standard                     │
│ 契約期間: 2024/01/01 - 2024/12/31       │
│ 請求金額: ¥50,000/月                     │
│ サブドメイン: abc.oriental-synergy.jp   │
│                                          │
│ 住所: 東京都渋谷区xxx-xxx                │
│ 電話: 03-1234-5678                       │
│ メール: info@abc.co.jp                   │
│                                          │
│ 月間利用状況:                            │
│ ┌────────────────────────────┐         │
│ │予約数: 45/200                │         │
│ │スタッフ数: 25/50             │         │
│ │ストレージ: 12GB/20GB         │         │
│ └────────────────────────────┘         │
└──────────────────────────────────────────┘
```

#### 6.1.3 予約管理画面

**予約カレンダー**
```
┌──────────────────────────────────────────┐
│ 予約管理      [リスト] [カレンダー]     │
├──────────────────────────────────────────┤
│ 2024年12月                    < 今日 >  │
│                                          │
│ 日  月  火  水  木  金  土              │
│ 1   2   3   4   5   6   7              │
│     🟢  🟡                             │
│     3件 1件                             │
│                                          │
│ 8   9  10  11  12  13  14              │
│ 🟢  🟡  🟢                             │
│ 5件 2件 4件                             │
│                                          │
│ 凡例:                                   │
│ 🟢 確定  🟡 調整中  🔴 キャンセル     │
│                                          │
│ クリックで詳細表示                       │
└──────────────────────────────────────────┘
```

**予約詳細 + スタッフアサイン**
```
┌──────────────────────────────────────────┐
│ 予約詳細: RES-20241201-001              │
├──────────────────────────────────────────┤
│ 企業: ABC株式会社                        │
│ サービス: 民泊清掃                       │
│ 日時: 2024/12/15 10:00-14:00            │
│ 場所: 東京都渋谷区xxx-xxx                │
│ 必要スタッフ: 2名                        │
│ ステータス: 一部アサイン                │
│                                          │
│ アサイン済みスタッフ:                    │
│ ┌────────────────────────────┐         │
│ │ [写真] 山田太郎              │         │
│ │ 評価: ★★★★★ 4.8          │         │
│ │ スキル: 清掃、多言語         │         │
│ └────────────────────────────┘         │
│                                          │
│ 候補スタッフ (自動マッチング):           │
│ ┌────────────────────────────┐         │
│ │ [写真] 佐藤花子              │         │
│ │ 評価: ★★★★☆ 4.5          │         │
│ │ マッチスコア: 85%            │         │
│ │ 理由: 高評価、近隣エリア     │         │
│ │               [アサイン]     │         │
│ └────────────────────────────┘         │
│                                          │
│ [手動でスタッフを検索]                   │
└──────────────────────────────────────────┘
```

---

### 6.2 企業側画面

#### 6.2.1 ダッシュボード

```
┌──────────────────────────────────────────┐
│ ABC株式会社 - ダッシュボード             │
├──────────────────────────────────────────┤
│ 今月の予約状況                           │
│ ┌──────┬──────┬──────┬──────┐         │
│ │予約数 │完了数 │評価  │利用額│         │
│ │ 45   │ 38   │ 4.7  │¥380K │         │
│ └──────┴──────┴──────┴──────┘         │
│                                          │
│ 今後の予約                               │
│ ┌────────────────────────────┐         │
│ │12/15 10:00 民泊清掃 渋谷    │         │
│ │   スタッフ: 山田太郎        │         │
│ │   ステータス: 確定          │         │
│ │─────────────────────────│         │
│ │12/16 14:00 送迎サービス 新宿│         │
│ │   スタッフ: 募集中          │         │
│ │   ステータス: 調整中        │         │
│ └────────────────────────────┘         │
│                                          │
│ お気に入りスタッフ                       │
│ [山田太郎] [佐藤花子] [鈴木一郎]       │
│                                          │
│         [新しい予約を作成]               │
└──────────────────────────────────────────┘
```

#### 6.2.2 予約管理画面

**予約一覧**
```
┌──────────────────────────────────────────┐
│ 予約管理                    ＋新規予約   │
├──────────────────────────────────────────┤
│ フィルター: [日付▼] [種別▼] [ステ▼]   │
├──────────────────────────────────────────┤
│ 日時     │種別  │場所  │スタフ│ステ│操│
│──────────┼─────┼─────┼─────┼───┼─┤
│12/15 10:00│清掃  │渋谷  │山田  │確定│詳│
│12/16 14:00│送迎  │新宿  │募集中│調整│詳│
│──────────────────────────────────────│
│ ページネーション    < 1 2 3 >          │
└──────────────────────────────────────────┘
```

**予約作成フォーム**
```
┌──────────────────────────────────────────┐
│ 新しい予約を作成                         │
├──────────────────────────────────────────┤
│ サービス種別 *                           │
│ ○ 民泊清掃  ○ 送迎サービス  ○ その他 │
│                                          │
│ サービス日時 *                           │
│ 日付: [2024/12/15 📅]                   │
│ 開始: [10:00 🕐]  終了: [14:00 🕐]     │
│                                          │
│ サービス場所 *                           │
│ 住所: [                              ] │
│ [地図で選択]                             │
│                                          │
│ 顧客情報                                 │
│ 氏名: [                ]                │
│ 電話: [                ]                │
│ Email: [                ]               │
│                                          │
│ 必要スタッフ数 *                         │
│ [2 ▼] 名                                │
│                                          │
│ 特記事項                                 │
│ ┌────────────────────────────┐         │
│ │                                │         │
│ └────────────────────────────┘         │
│                                          │
│    [キャンセル]      [予約を作成]       │
└──────────────────────────────────────────┘
```

#### 6.2.3 スタッフ管理画面

**スタッフ一覧**
```
┌──────────────────────────────────────────┐
│ スタッフ一覧                ＋新規登録   │
├──────────────────────────────────────────┤
│ フィルター: [スキル▼] [評価▼]          │
├──────────────────────────────────────────┤
│ [写真] 山田太郎                          │
│        評価: ★★★★★ 4.8             │
│        業務回数: 150回                   │
│        スキル: 清掃、運転、多言語        │
│        再依頼意向: あり                  │
│        [詳細を見る]                      │
│──────────────────────────────────────│
│ [写真] 佐藤花子                          │
│        評価: ★★★★☆ 4.5             │
│        業務回数: 80回                    │
│        スキル: 清掃、介護                │
│        再依頼意向: あり                  │
│        [詳細を見る]                      │
└──────────────────────────────────────────┘
```

**スタッフ詳細**
```
┌──────────────────────────────────────────┐
│ スタッフ詳細: 山田太郎                   │
├──────────────────────────────────────────┤
│ [写真]  山田太郎                         │
│         評価: ★★★★★ 4.8             │
│         スキル: 清掃、運転、多言語       │
│                                          │
│ 当社での実績:                            │
│ ・業務回数: 150回                        │
│ ・最終業務: 2024/12/01                   │
│ ・平均評価: 4.8                          │
│ ・再依頼率: 95%                          │
│                                          │
│ 評価の内訳:                              │
│ ┌────────────────────────────┐         │
│ │品質:         ★★★★★ 4.9    │         │
│ │時間厳守:     ★★★★☆ 4.7    │         │
│ │コミュニケ:   ★★★★★ 4.8    │         │
│ │態度:         ★★★★★ 5.0    │         │
│ └────────────────────────────┘         │
│                                          │
│ 過去の業務履歴:                          │
│ ┌────────────────────────────┐         │
│ │12/01 清掃 渋谷  評価: ★★★★★│         │
│ │11/28 清掃 新宿  評価: ★★★★★│         │
│ └────────────────────────────┘         │
│                                          │
│    [メッセージを送る]  [優先依頼に追加] │
└──────────────────────────────────────────┘
```

#### 6.2.4 評価入力画面

```
┌──────────────────────────────────────────┐
│ 業務評価: RES-20241215-001              │
├──────────────────────────────────────────┤
│ スタッフ: 山田太郎                       │
│ 業務: 2024/12/15 10:00 民泊清掃         │
│                                          │
│ 総合評価 *                               │
│ ☆☆☆☆☆ タップして評価してください │
│                                          │
│ 詳細評価 *                               │
│ 品質:           ☆☆☆☆☆             │
│ 時間厳守:       ☆☆☆☆☆             │
│ コミュニケーション: ☆☆☆☆☆         │
│ 態度:           ☆☆☆☆☆             │
│                                          │
│ コメント                                 │
│ ┌────────────────────────────┐         │
│ │とても丁寧な対応でした。        │         │
│ │また依頼したいです。            │         │
│ └────────────────────────────┘         │
│                                          │
│ 再依頼希望                               │
│ ○ はい  ○ いいえ                      │
│                                          │
│    [キャンセル]      [評価を送信]       │
└──────────────────────────────────────────┘
```

---

### 6.3 スタッフ側画面（モバイル対応）

#### 6.3.1 ホーム画面

```
┌──────────────────────┐
│  Oriental Synergy    │
│  こんにちは、山田さん │
├──────────────────────┤
│ 今日の予定           │
│ ┌──────────────────┐ │
│ │10:00-14:00       │ │
│ │民泊清掃          │ │
│ │ABC株式会社       │ │
│ │渋谷区xxx-xxx     │ │
│ │                  │ │
│ │ [地図を見る]     │ │
│ │ [出勤打刻]       │ │
│ └──────────────────┘ │
│                      │
│ 新しいオファー (2)   │
│ ┌──────────────────┐ │
│ │12/20 10:00       │ │
│ │清掃業務          │ │
│ │報酬: ¥8,000     │ │
│ │ [詳細] [受諾]    │ │
│ └──────────────────┘ │
│                      │
│ あなたの実績         │
│ ┌─────┬─────┬───┐ │
│ │評価   │業務数 │収入│ │
│ │★4.8  │150回 │¥1M │ │
│ └─────┴─────┴───┘ │
│                      │
│ [シフト] [業務] [実績]│
└──────────────────────┘
```

#### 6.3.2 業務オファー詳細

```
┌──────────────────────┐
│  ← 業務オファー      │
├──────────────────────┤
│ ABC株式会社          │
│ 民泊清掃             │
│                      │
│ 📅 日時              │
│ 2024年12月20日       │
│ 10:00 - 14:00 (4h)  │
│                      │
│ 📍 場所              │
│ 東京都渋谷区xxx-xxx  │
│ [地図を見る]         │
│ 現在地から 2.5km     │
│                      │
│ 💰 報酬              │
│ ¥8,000               │
│                      │
│ 📝 業務内容          │
│ 5室の清掃業務        │
│ ベッドメイキング含む │
│                      │
│ ⚠️ 特記事項          │
│ ペットがいるため     │
│ 事前連絡必要         │
│                      │
│ 回答期限: 12/18 18:00│
│                      │
│  [辞退する]  [受諾]  │
└──────────────────────┘
```

#### 6.3.3 出勤打刻画面

```
┌──────────────────────┐
│  ← 出勤打刻          │
├──────────────────────┤
│ 民泊清掃             │
│ ABC株式会社          │
│ 2024/12/15 10:00-14:00│
│                      │
│ 📍 現在地を確認中... │
│                      │
│ ✓ 指定場所の近くです │
│   (誤差: 50m)        │
│                      │
│ 📷 写真を撮影        │
│ [カメラ起動]         │
│ ┌──────────────────┐ │
│ │                  │ │
│ │  [撮影した写真]  │ │
│ │                  │ │
│ └──────────────────┘ │
│                      │
│ 打刻時刻:            │
│ 2024/12/15 10:00:00 │
│                      │
│    [出勤を打刻]      │
└──────────────────────┘
```

#### 6.3.4 退勤打刻 + 完了報告

```
┌──────────────────────┐
│  ← 退勤打刻          │
├──────────────────────┤
│ 業務情報             │
│ 出勤: 10:00          │
│ 現在: 14:00          │
│ 勤務時間: 4時間      │
│                      │
│ 休憩時間 (分)        │
│ [30 ▼]              │
│                      │
│ 作業数               │
│ [5] 室               │
│                      │
│ 📷 完了写真          │
│ [+ 写真を追加]       │
│ ┌────┐┌────┐      │
│ │写真1││写真2│      │
│ └────┘└────┘      │
│                      │
│ 作業内容             │
│ ┌──────────────────┐ │
│ │全5室の清掃完了   │ │
│ │特に問題なし       │ │
│ └──────────────────┘ │
│                      │
│  [キャンセル] [完了] │
└──────────────────────┘
```

#### 6.3.5 マイページ

```
┌──────────────────────┐
│  マイページ          │
├──────────────────────┤
│ ┌────────────────┐   │
│ │ [写真]         │   │
│ │ 山田太郎       │   │
│ │ スタッフコード:│   │
│ │ STF-001        │   │
│ └────────────────┘   │
│                      │
│ 今月の実績           │
│ ┌─────┬─────┬───┐ │
│ │勤務日 │時間   │収入│ │
│ │20日  │160h  │¥200K││
│ └─────┴─────┴───┘ │
│                      │
│ 評価                 │
│ ★★★★★ 4.8       │
│ 総業務数: 150回      │
│                      │
│ ランク               │
│ 🥇 ゴールド          │
│                      │
│ 獲得バッジ (3)       │
│ 🏅 皆勤賞            │
│ 🌟 高評価            │
│ 🌅 早起き            │
│                      │
│ [プロフィール編集]   │
│ [評価を見る]         │
│ [実績を見る]         │
│ [設定]               │
└──────────────────────┘
```

#### 6.3.6 シフト登録画面

```
┌──────────────────────┐
│  ← シフト希望登録    │
├──────────────────────┤
│    2024年12月        │
│  日 月 火 水 木 金 土│
│      1  2  3  4  5  6│
│  7  8  9 10 11 12 13│
│ 14 15 16 17 18 19 20│
│ 21 22 23 24 25 26 27│
│ 28 29 30 31         │
│                      │
│ 凡例:                │
│ ○ 対応可能           │
│ △ 要相談             │
│ × 対応不可           │
│ ✓ 承認済み           │
│                      │
│ 選択した日: 12/20    │
│ 時間帯:              │
│ ○ 全日               │
│ ○ 午前 (6-12時)     │
│ ● 午後 (12-18時)    │
│ ○ 夕方 (18-24時)    │
│ ○ カスタム           │
│                      │
│ 備考:                │
│ [午後のみ対応可能]   │
│                      │
│ [一括登録] [登録]    │
└──────────────────────┘
```

---

## 7. 外部連携

### 7.1 LINE Messaging API連携

**目的**
スタッフへのリアルタイム通知とインタラクティブなコミュニケーション

**連携内容**

1. **通知送信**
   - 業務オファー
   - シフト承認・却下
   - 業務開始リマインダー
   - 評価受信
   - システムからのお知らせ

2. **インタラクティブメッセージ**
   - 業務確認（YES/NO）
     ```
     明日の業務に参加できますか？
     [はい] [いいえ]
     ```
   - 簡単な返信
     ```
     到着しました
     遅れます（15分程度）
     ```

3. **実装方法**
   - Webhook URLの設定
   - リッチメニューの活用
   - クイックリプライの利用

**サンプルメッセージ**
```python
from linebot import LineBotApi
from linebot.models import TextSendMessage, QuickReply, QuickReplyButton, MessageAction

line_bot_api = LineBotApi('YOUR_CHANNEL_ACCESS_TOKEN')

# 業務オファー通知
message = TextSendMessage(
    text='新しい業務オファーがあります\n\n日時: 12/20 10:00-14:00\n場所: 渋谷区\n報酬: ¥8,000\n\n詳細はアプリでご確認ください。',
    quick_reply=QuickReply(items=[
        QuickReplyButton(action=MessageAction(label="詳細を見る", text="詳細")),
        QuickReplyButton(action=MessageAction(label="受諾する", text="受諾")),
    ])
)

line_bot_api.push_message('USER_ID', messages=message)
```

---

### 7.2 Google Maps API連携

**目的**
位置情報の取得と経路案内

**連携内容**

1. **地図表示**
   - サービス場所の地図表示
   - 現在地からのルート表示

2. **住所検索**
   - 住所入力時の候補表示
   - 緯度経度の取得

3. **距離計算**
   - スタッフの現在地からサービス場所までの距離
   - 移動時間の見積もり

**実装例**
```javascript
// 地図初期化
function initMap() {
  const location = { lat: 35.6585, lng: 139.7454 };
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: location,
  });
  
  // マーカー追加
  new google.maps.Marker({
    position: location,
    map: map,
    title: "サービス場所"
  });
}

// 住所から緯度経度を取得
function geocodeAddress(address) {
  const geocoder = new google.maps.Geocoder();
  geocoder.geocode({ address: address }, (results, status) => {
    if (status === "OK") {
      const location = results[0].geometry.location;
      console.log("緯度:", location.lat());
      console.log("経度:", location.lng());
    }
  });
}
```

---

### 7.3 決済システム連携（将来的）

**目的**
企業からの支払いとスタッフへの報酬支払いを自動化

**候補サービス**
- Stripe
- PayPal
- GMOペイメント

**連携内容**
1. 企業からの月次請求の自動処理
2. スタッフへの報酬の自動振込
3. 決済履歴の管理

---

## 8. セキュリティ要件

### 8.1 認証・認可

**認証方式**
- JWT (JSON Web Token) ベースの認証
- アクセストークン有効期限: 1時間
- リフレッシュトークン有効期限: 30日

**パスワードポリシー**
- 最低8文字以上
- 英大文字、英小文字、数字、記号をそれぞれ1文字以上含む
- 過去3回のパスワードは再利用不可
- ハッシュ化: bcrypt（コスト: 12）

**多要素認証（オプション）**
- SMS認証
- メール認証
- Google Authenticator

### 8.2 データ保護

**暗号化**
- 通信: TLS 1.3
- データベース: PostgreSQL の透過的データ暗号化（TDE）
- パスワード: bcrypt
- 機密情報（銀行口座等）: AES-256

**個人情報の取り扱い**
- 最小限のデータ収集
- GDPR/個人情報保護法への準拠
- データ保持期間の設定（退職後1年でアーカイブ、3年で削除）

### 8.3 アクセス制御

**ロールベースアクセス制御（RBAC）**
```
管理者:
- 全データの閲覧・編集
- システム設定の変更

企業管理者:
- 自社データの閲覧・編集
- 社員の管理
- 予約の作成・編集・削除

企業担当者:
- 自社データの閲覧
- 予約の作成・編集
- 評価の入力

企業閲覧者:
- 自社データの閲覧のみ

スタッフ:
- 自分のデータの閲覧・編集
- アサインされた業務の閲覧
- 勤怠打刻・完了報告
```

### 8.4 監査ログ

**記録対象**
- ログイン・ログアウト
- データの作成・更新・削除
- 重要な操作（アサイン、評価入力、支払い処理等）
- セキュリティイベント（ログイン失敗、権限エラー等）

**ログ項目**
- タイムスタンプ
- ユーザーID
- IPアドレス
- User-Agent
- 操作内容
- 操作対象
- 結果（成功/失敗）

**ログ保持期間**
- 1年間（法令要件に応じて延長）

### 8.5 脆弱性対策

**一般的な脆弱性への対策**
- SQLインジェクション: パラメータ化クエリ使用
- XSS: 出力のエスケープ処理
- CSRF: CSRFトークンの使用
- クリックジャッキング: X-Frame-Options ヘッダー
- セッションハイジャック: HTTPOnly、Secure フラグ

**定期的なセキュリティ対応**
- 依存ライブラリの脆弱性スキャン（週次）
- ペネトレーションテスト（年2回）
- セキュリティアップデートの適用（月次）

---

## 9. 非機能要件

### 9.1 パフォーマンス

**レスポンスタイム**
- 画面表示: 2秒以内
- API応答: 500ms以内
- 検索機能: 1秒以内
- レポート生成: 10秒以内

**スループット**
- 同時接続ユーザー数: 1,000人
- 秒間リクエスト数: 100 req/sec
- データベースクエリ: 1,000 queries/sec

**負荷試験**
- ピーク時の3倍の負荷で動作確認

### 9.2 可用性

**稼働率**
- 目標稼働率: 99.5%以上（月間ダウンタイム: 3.6時間以内）

**バックアップ**
- データベース: 毎日フルバックアップ + 5分ごとの差分バックアップ
- 保持期間: 30日間
- リストアテスト: 月1回

**災害対策**
- マルチリージョン構成
- RTO (Recovery Time Objective): 4時間
- RPO (Recovery Point Objective): 5分

### 9.3 スケーラビリティ

**水平スケーリング**
- アプリケーションサーバー: オートスケーリング対応
- データベース: リードレプリカによる読み取り分散

**垂直スケーリング**
- 必要に応じてサーバースペックを増強

### 9.4 互換性

**対応ブラウザ**
- Chrome（最新版）
- Firefox（最新版）
- Safari（最新版）
- Edge（最新版）

**対応デバイス**
- デスクトップ（Windows, Mac）
- タブレット（iPad, Android）
- スマートフォン（iOS 14以上, Android 10以上）

**レスポンシブデザイン**
- 画面幅 320px〜2560px に対応

### 9.5 保守性

**コード品質**
- コーディング規約の遵守
- コードレビューの実施
- 単体テストカバレッジ: 80%以上
- 静的解析ツールの使用

**ドキュメント**
- API仕様書
- データベース設計書
- 運用手順書
- トラブルシューティングガイド

---

## 10. 開発ロードマップ

### Phase 1: 基本機能開発（3ヶ月）

**Month 1: 基盤構築**
- Week 1-2: 開発環境構築、CI/CD パイプライン構築
- Week 3-4: データベース設計・構築、認証システム開発

**Month 2: コア機能開発**
- Week 1-2: 企業管理機能、スタッフ管理機能
- Week 3-4: 予約管理機能、基本的なマッチング機能

**Month 3: UI/UX開発**
- Week 1-2: 管理者画面、企業側画面
- Week 3-4: スタッフ側画面（モバイル対応）、テスト

**成果物**
- ユーザー登録・認証
- 企業管理
- スタッフ管理
- 予約作成・一覧
- 手動マッチング

---

### Phase 2: 高度な機能開発（2ヶ月）

**Month 4: 勤怠・通知機能**
- Week 1-2: 勤怠打刻機能、LINE API 連携
- Week 3-4: 通知システム、メッセージ機能

**Month 5: 評価・レポート機能**
- Week 1-2: 評価システム、レポート機能
- Week 3-4: ダッシュボード、分析機能

**成果物**
- 勤怠管理システム
- LINE 通知連携
- 評価システム
- レポート・分析機能

---

### Phase 3: 最適化・改善（2ヶ月）

**Month 6: 自動化・最適化**
- Week 1-2: 自動マッチングアルゴリズム改善
- Week 3-4: パフォーマンス最適化

**Month 7: テスト・リリース準備**
- Week 1-2: 統合テスト、負荷テスト
- Week 3-4: セキュリティ監査、本番リリース

**成果物**
- 自動マッチング機能
- パフォーマンス最適化
- 本番環境リリース

---

### Phase 4: 追加機能（継続的）

**将来的な機能追加**
- 決済システム連携
- 多言語対応（英語、中国語等）
- AI による需要予測
- スタッフ向けトレーニング機能
- 企業向けAPI提供
- モバイルアプリ（ネイティブ）

---

## 11. まとめ

本システム設計書では、オリエンタルシナジーの全機能について詳細に記述しました。

### 主要なポイント

1. **3層ユーザー構造**
   - 管理者、企業、スタッフそれぞれに最適化された機能

2. **リアルタイム性**
   - LINE 連携による即時通知
   - 勤怠打刻とGPS連携

3. **データ駆動**
   - 評価システムによる品質管理
   - レポート・分析による意思決定支援

4. **スケーラビリティ**
   - クラウドネイティブ設計
   - マイクロサービス指向

5. **セキュリティ**
   - 多層防御
   - 個人情報保護

### 次のステップ

1. 技術スタックの最終決定
2. 開発チームの編成
3. プロトタイプ開発
4. ユーザーテスト
5. 段階的リリース

本設計書を基に、効率的で高品質なシステム開発を進めてください。