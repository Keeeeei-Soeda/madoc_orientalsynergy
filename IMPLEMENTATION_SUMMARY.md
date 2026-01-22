# 実装機能サマリー

## 📋 目次

1. [システム概要](#システム概要)
2. [実装済み機能](#実装済み機能)
3. [データモデル](#データモデル)
4. [API エンドポイント](#api-エンドポイント)
5. [ステータス管理](#ステータス管理)
6. [画面一覧](#画面一覧)
7. [主要機能の詳細](#主要機能の詳細)

---

## システム概要

オリエンタルシナジー - 企業向けマッサージ派遣管理システム

### 主要ユーザー

- **管理者**: 予約管理、スタッフ管理、企業管理
- **企業**: 予約作成、社員割り当て、評価
- **スタッフ**: オファー確認、受諾/辞退、給与確認

---

## 実装済み機能

### ✅ フェーズ1-3: 基本機能（既存）

- ユーザー認証（JWT）
- 企業管理
- スタッフ管理
- 基本的な予約管理

### ✅ フェーズ4: 企業側社員割り当て機能

**実装日**: 2026-01-21

#### 機能概要
企業が自社の社員を予約の特定の時間枠に割り当てる機能。

#### 主な実装内容
- 社員（Employee）モデルの追加
- 社員CRUD API
- 予約詳細画面での社員割り当てUI
- 時間枠ごとの社員割り当て/解除機能

#### API エンドポイント
- `GET /api/v1/employees` - 社員一覧取得
- `POST /api/v1/employees` - 社員作成
- `PUT /api/v1/employees/{id}` - 社員更新
- `DELETE /api/v1/employees/{id}` - 社員削除
- `POST /api/v1/reservations/{id}/assign-employee` - 社員を枠に割り当て
- `DELETE /api/v1/reservations/{id}/slots/{slot}/employee` - 社員の割り当て解除

#### 画面
- `/company/reservations/{id}` - 予約詳細画面（社員割り当てモーダル付き）

---

### ✅ フェーズ5: スタッフ側オファー確認・応答機能

**実装日**: 2026-01-21

#### 機能概要
管理者からスタッフへのオファー送信と、スタッフによる受諾/辞退機能。

#### 主な実装内容
- ReservationStaffモデルに`slot_number`フィールド追加
- アサイン管理API（オファー送信、ステータス更新）
- スタッフ側オファー一覧・詳細画面
- 管理者側オファー送信機能（単一・複数選択）

#### API エンドポイント
- `GET /api/v1/reservations/{id}/assignments` - 予約のアサイン一覧
- `POST /api/v1/reservations/{id}/assignments` - オファー送信
- `PUT /api/v1/assignments/{id}` - アサインステータス更新
- `DELETE /api/v1/assignments/{id}` - アサイン削除
- `GET /api/v1/staff/{id}/assignments` - スタッフのアサイン一覧

#### 画面
- `/admin/reservations/{id}` - 予約詳細（オファー送信モーダル付き）
- `/staff/jobs/offers` - スタッフ側オファー一覧
- `/staff/jobs/offers/{id}` - スタッフ側オファー詳細

#### UI改善
- チェックボックスで複数スタッフを選択
- 一括オファー送信機能
- 全選択/全解除機能
- 選択数のリアルタイム表示

---

### ✅ フェーズ6: スタッフ側給与計算機能

**実装日**: 2026-01-22

#### 機能概要
スタッフが自分の給与を確認できる機能。時間枠ベースで自動計算。

#### 主な実装内容
- 給与計算API（月別フィルター対応）
- スタッフダッシュボードに給与サマリー表示
- スタッフマイページに給与明細表示
- スタッフダミーデータ10件作成

#### 計算ロジック
```
給与 = (施術時間（分） × 時給（円）) ÷ 60

例:
- 枠1: 30分、時給1,500円
- 報酬: (30 × 1,500) ÷ 60 = 750円
```

#### API エンドポイント
- `GET /api/v1/staff/{id}/earnings?month={month}&year={year}` - 給与情報取得

#### 画面
- `/staff/dashboard` - ダッシュボード（今月の給与サマリー）
- `/staff/mypage` - マイページ（給与明細、年月選択可能）

#### データ
- スタッフダミーデータ10名追加（山田花子、佐藤美咲、鈴木健太、高橋愛、田中太郎、中村優子、渡辺健一、伊藤さくら、松本健二、林美香）

---

### ✅ フェーズ7: 管理者側予約一覧枠情報表示

**実装日**: 2026-01-22

#### 機能概要
管理者の予約一覧画面で、時間枠情報を視覚的に表示。

#### 主な実装内容
- 枠数表示（大きな数字で見やすく）
- 時給表示（緑色で強調）
- プログレスバーでアサイン状況を可視化
- 確定済み/回答待ち/空き枠の内訳表示
- 募集期限を警告バッジで表示

#### プログレスバーの色分け
- **緑色**: 確定済みの枠
- **黄色**: 回答待ちの枠
- **グレー**: 空き枠

#### 画面
- `/admin/reservations` - 予約一覧（枠情報付き）

---

## データモデル

### 主要モデル

#### User（ユーザー）
```python
- id: int
- email: str
- password_hash: str
- name: str
- role: UserRole (ADMIN | COMPANY | STAFF)
- is_active: bool
```

#### Company（企業）
```python
- id: int
- user_id: int
- company_name: str
- office_name: str
- address: str
- phone: str
- contract_start_date: str
- contract_end_date: str
```

#### Staff（スタッフ）
```python
- id: int
- user_id: int
- name: str
- phone: str
- address: str
- bank_account: str
- qualifications: str
- available_days: str
- line_id: str
- is_available: bool
- rating: int
```

#### Employee（社員）
```python
- id: int
- company_id: int
- name: str
- department: str
- position: str
- email: str
- phone: str
- line_id: str
- is_active: bool
```

#### Reservation（予約）
```python
- id: int
- company_id: int
- office_name: str
- office_address: str
- reservation_date: str
- start_time: str
- end_time: str
- application_deadline: str
- max_participants: int
# 時間枠管理フィールド
- total_duration: int
- service_duration: int
- break_duration: int
- slot_count: int
- time_slots: JSON
- slots_filled: int
- hourly_rate: int
- status: ReservationStatus
```

#### ReservationStaff（予約-スタッフ割り当て）
```python
- id: int
- reservation_id: int
- staff_id: int
- slot_number: int (nullable)
- status: AssignmentStatus
- assigned_by: int
- assigned_at: datetime
- notes: str
```

---

## API エンドポイント

### 認証
- `POST /api/v1/auth/login` - ログイン
- `POST /api/v1/auth/refresh` - トークン更新
- `GET /api/v1/auth/me` - 現在のユーザー情報

### スタッフ
- `GET /api/v1/staff` - スタッフ一覧
- `GET /api/v1/staff/{id}` - スタッフ詳細
- `POST /api/v1/staff` - スタッフ作成
- `PUT /api/v1/staff/{id}` - スタッフ更新
- `DELETE /api/v1/staff/{id}` - スタッフ削除
- `GET /api/v1/staff/{id}/earnings` - 給与情報取得

### 社員
- `GET /api/v1/employees` - 社員一覧
- `GET /api/v1/employees/{id}` - 社員詳細
- `POST /api/v1/employees` - 社員作成
- `PUT /api/v1/employees/{id}` - 社員更新
- `DELETE /api/v1/employees/{id}` - 社員削除

### 予約
- `GET /api/v1/reservations` - 予約一覧
- `GET /api/v1/reservations/{id}` - 予約詳細
- `POST /api/v1/reservations` - 予約作成
- `PUT /api/v1/reservations/{id}` - 予約更新
- `DELETE /api/v1/reservations/{id}` - 予約削除
- `POST /api/v1/reservations/{id}/assign-employee` - 社員を枠に割り当て
- `DELETE /api/v1/reservations/{id}/slots/{slot}/employee` - 社員の割り当て解除

### アサイン（スタッフ割り当て）
- `GET /api/v1/reservations/{id}/assignments` - 予約のアサイン一覧
- `POST /api/v1/reservations/{id}/assignments` - オファー送信
- `PUT /api/v1/assignments/{id}` - アサインステータス更新
- `DELETE /api/v1/assignments/{id}` - アサイン削除
- `GET /api/v1/staff/{id}/assignments` - スタッフのアサイン一覧

---

## ステータス管理

### 予約ステータス（ReservationStatus）

| ステータス | 値 | 説明 |
|-----------|-----|------|
| 募集中 | `recruiting` | 予約が作成され、スタッフを募集している状態 |
| スタッフアサイン中 | `assigning` | スタッフへのオファーを送信済み、回答待ち |
| 確定済み | `confirmed` | 必要なスタッフが全員確定した状態 |
| 施術完了 | `service_completed` | サービスが完了した状態 |
| 評価取得完了 | `evaluated` | 企業からの評価を受け取った状態 |
| 終了 | `closed` | すべての処理が完了した状態 |
| キャンセル | `cancelled` | 予約がキャンセルされた状態 |

### アサインステータス（AssignmentStatus）

| ステータス | 値 | 説明 |
|-----------|-----|------|
| 回答待ち | `pending` | 管理者がスタッフにオファーを送信、スタッフの回答待ち |
| 確定 | `confirmed` | スタッフがオファーを受諾し、確定した状態 |
| 辞退 | `rejected` | スタッフがオファーを辞退した状態 |
| キャンセル | `cancelled` | 管理者または企業が割り当てをキャンセルした状態 |

---

## 画面一覧

### 管理者画面

| パス | 画面名 | 説明 |
|-----|--------|------|
| `/admin/dashboard` | ダッシュボード | 統計情報、最近の予約 |
| `/admin/reservations` | 予約一覧 | 予約一覧（枠情報付き） |
| `/admin/reservations/new` | 予約作成 | 新規予約作成 |
| `/admin/reservations/{id}` | 予約詳細 | 予約詳細、オファー送信 |
| `/admin/reservations/{id}/edit` | 予約編集 | 予約情報編集 |
| `/admin/companies` | 企業管理 | 企業一覧、作成、編集 |
| `/admin/staff` | スタッフ管理 | スタッフ一覧、作成、編集 |

### 企業画面

| パス | 画面名 | 説明 |
|-----|--------|------|
| `/company/dashboard` | ダッシュボード | 予約状況、統計 |
| `/company/reservations` | 予約一覧 | 自社の予約一覧 |
| `/company/reservations/{id}` | 予約詳細 | 予約詳細、社員割り当て |
| `/company/employees` | 社員管理 | 社員一覧、作成、編集 |

### スタッフ画面

| パス | 画面名 | 説明 |
|-----|--------|------|
| `/staff/dashboard` | ダッシュボード | 今月の給与サマリー、統計 |
| `/staff/mypage` | マイページ | 基本情報、給与明細 |
| `/staff/jobs` | 業務一覧 | 予約一覧 |
| `/staff/jobs/offers` | オファー一覧 | オファー確認 |
| `/staff/jobs/offers/{id}` | オファー詳細 | オファー詳細、受諾/辞退 |
| `/staff/shifts` | シフト管理 | シフト登録・確認 |
| `/staff/evaluations` | 評価確認 | 企業からの評価 |

---

## 主要機能の詳細

### 1. 時間枠計算機能

予約の開始時刻、終了時刻、施術時間、休憩時間から、自動的に時間枠を計算します。

#### 計算ロジック
```python
def calculate_time_slots(start_time, end_time, service_duration, break_duration):
    total_minutes = 時刻差を分単位で計算
    slot_duration = service_duration + break_duration
    slot_count = total_minutes // slot_duration
    
    time_slots = []
    for i in range(slot_count):
        slot_start = start_time + (i * slot_duration)
        slot_end = slot_start + service_duration
        time_slots.append({
            "slot": i + 1,
            "start_time": slot_start,
            "end_time": slot_end,
            "duration": service_duration
        })
    
    return time_slots
```

#### 例
- 開始: 10:00
- 終了: 12:00
- 施術時間: 30分
- 休憩時間: 10分

結果:
```json
[
  {"slot": 1, "start_time": "10:00", "end_time": "10:30", "duration": 30},
  {"slot": 2, "start_time": "10:40", "end_time": "11:10", "duration": 30},
  {"slot": 3, "start_time": "11:20", "end_time": "11:50", "duration": 30}
]
```

### 2. 給与計算機能

スタッフの給与を時間枠ベースで自動計算します。

#### 計算式
```
給与 = (施術時間（分） × 時給（円）) ÷ 60
```

#### 例
- 枠1: 30分、時給1,500円 → 750円
- 枠2: 40分、時給1,800円 → 1,200円
- 合計: 1,950円

### 3. オファー送信機能

管理者がスタッフにオファーを送信する機能。

#### 単一送信
1. 予約詳細画面で「スタッフにオファー送信」をクリック
2. スタッフ一覧が表示される
3. スタッフをクリックして選択
4. オファーが送信される

#### 一括送信
1. 予約詳細画面で「スタッフにオファー送信」をクリック
2. チェックボックスで複数スタッフを選択
3. 「選択したスタッフにオファー送信」ボタンをクリック
4. 確認ダイアログで「OK」
5. 選択した全員にオファーが送信される

### 4. 社員割り当て機能

企業が自社の社員を予約の時間枠に割り当てる機能。

#### 使い方
1. 企業側で予約詳細画面を開く
2. 時間枠の「社員を割り当て」ボタンをクリック
3. 社員一覧が表示される
4. 社員を選択
5. 割り当てが完了

---

## 技術スタック

### バックエンド
- **Python 3.9+**
- **FastAPI** - Webフレームワーク
- **SQLAlchemy** - ORM
- **Pydantic** - データバリデーション
- **JWT** - 認証
- **SQLite** - データベース（開発環境）

### フロントエンド
- **Next.js 14** - Reactフレームワーク
- **TypeScript** - 型安全な開発
- **Bootstrap 5** - CSSフレームワーク
- **Bootstrap Icons** - アイコン
- **js-cookie** - Cookie管理

---

## デプロイ

### 開発環境

#### バックエンド
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### フロントエンド
```bash
cd frontend
npm run dev
```

### 初期データ投入

#### スタッフデータ
```bash
cd backend
python seed_staff_additional.py
```

#### 予約データ
```bash
cd backend
python seed_data.py
```

---

## 今後の実装予定

### 優先度: 高
- [ ] スタッフ希望シフト登録機能
- [ ] 勤怠管理機能（チェックイン/チェックアウト）
- [ ] 評価機能（企業→スタッフ）
- [ ] 通知機能（LINE連携）

### 優先度: 中
- [ ] レポート機能（月次レポート、売上レポート）
- [ ] カレンダービュー
- [ ] メール通知
- [ ] ファイルアップロード（プロフィール写真等）

### 優先度: 低
- [ ] チャット機能
- [ ] モバイルアプリ
- [ ] 多言語対応

---

## トラブルシューティング

### よくある問題

#### 1. スタッフが表示されない
**原因**: 認証トークンが正しく送信されていない
**解決策**: ブラウザをリフレッシュしてログインし直す

#### 2. オファー送信時に422エラー
**原因**: リクエストボディのバリデーションエラー
**解決策**: `slot_number`と`reservation_id`が正しく送信されているか確認

#### 3. 給与が表示されない
**原因**: アサインステータスが`confirmed`でない
**解決策**: スタッフがオファーを受諾し、確定済みになっているか確認

---

## 連絡先

- **開発者**: AI Assistant
- **実装日**: 2026年1月21日-22日
- **バージョン**: 1.0.0

---

## 変更履歴

### v1.0.0 (2026-01-22)
- ✅ フェーズ4-7の実装完了
- ✅ スタッフダミーデータ10件追加
- ✅ 給与計算機能実装
- ✅ オファー送信機能（単一・一括）
- ✅ 予約一覧枠情報表示

### v0.1.0 (2026-01-21)
- 🎯 基本機能実装
- 🎯 認証機能
- 🎯 予約管理
- 🎯 企業管理
- 🎯 スタッフ管理

