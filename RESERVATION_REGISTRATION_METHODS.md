# 予約登録方法の現状

このドキュメントでは、システムにおける予約登録の 2 つの方法について説明します。

## 概要

現在のシステムでは、予約を登録する方法が **2 つ** あります:

1. **管理者側からの予約登録** - 管理者が企業の予約を代理で登録
2. **企業側からの予約登録** - 企業の担当者が直接予約を登録

**注意**: 社員（スタッフ）側からの予約登録機能は **ありません**。社員は企業が登録した予約に対して「参加登録」を行うのみです。

---

## 1. 管理者側からの予約登録

### 概要

管理者（Oriental Synergy 側）が企業の予約を代理で登録する方法です。

### 画面パス

```
/admin/reservations/new
```

### 主な機能

- **企業選択**: ドロップダウンから企業を選択
- **時間枠管理**: 複数の時間枠（スロット）を設定可能
  - 施術時間（分）
  - 休憩時間（分）
  - 時給設定
  - 自動計算による時間枠の生成
- **募集期限**: スタッフへのオファー募集期限を設定
- **詳細設定**:
  - 事業所名・住所
  - 予約日時
  - 募集人数（max_participants）
  - 要望・備考

### 実装ファイル

- フロントエンド: `frontend/src/app/admin/reservations/new/page.tsx`
- バックエンド API: `backend/app/api/v1/reservations.py` - `create_reservation()`
- 権限: `get_company_user` (企業ユーザーまたは管理者)

### 登録後の流れ

1. 管理者が予約を作成
2. ステータスは `recruiting`（募集中）
3. 管理者がスタッフにオファーを送信
4. スタッフがオファーを受諾
5. 企業が社員を時間枠に割り当て

---

## 2. 企業側からの予約登録

### 概要

企業の担当者が自社の予約を直接登録する方法です。

### 画面パス

```
/company/reservations/new
```

### 主な機能

- **簡易登録**: 基本情報のみで登録可能
  - 事業所名・住所
  - 予約日時（開始時刻・終了時刻）
  - 募集人数（max_participants）
  - 要望・備考
- **時間枠管理なし**: 管理者側のような詳細な時間枠設定は不可

### 実装ファイル

- フロントエンド: `frontend/src/app/company/reservations/new/page.tsx`
- バックエンド API: `backend/app/api/v1/reservations.py` - `create_reservation()`
- 権限: `get_company_user` (企業ユーザー)

### 登録後の流れ

1. 企業が予約を作成
2. ステータスは `recruiting`（募集中）
3. 管理者がスタッフにオファーを送信
4. スタッフがオファーを受諾
5. 企業が社員を時間枠に割り当て

---

## 3. 社員（従業員）の参加登録

### 概要

企業の社員が、企業側が登録した予約に対して「参加登録」を行う機能です。
**これは予約の新規作成ではなく、既存の予約への参加登録です。**

### 画面パス

```
/company/employee-bookings
```

### 主な機能

- **募集中の予約一覧**: 企業が登録した募集中（recruiting）の予約を表示
- **空き状況確認**:
  - 募集人数（max_participants）
  - 既に登録されている社員数
  - 残りの空き枠数
- **参加登録フォーム**:
  - 社員名
  - 部署
  - 役職
  - 電話番号
  - メールアドレス
  - 備考・要望

### 実装ファイル

- フロントエンド: `frontend/src/app/company/employee-bookings/page.tsx`
- バックエンド API: `backend/app/api/v1/reservations.py` - `addEmployee()` (未実装)

### 登録後の流れ

1. 社員が予約に参加登録
2. `employee_names` フィールドに社員名が追加される
3. 登録済み人数がカウントアップ
4. 募集人数に達したら満席となり、新規登録不可

---

## 4. スタッフ側の機能（参考）

### スタッフは予約を登録できない

スタッフ（Oriental Synergy の施術者）は予約を登録することはできません。
スタッフは以下の機能のみ利用可能です:

1. **オファー確認** (`/staff/jobs/offers`)

   - 管理者から送られたオファーを確認
   - オファーを受諾または辞退

2. **シフト確認** (`/staff/shifts`)

   - 確定済みのアサインメント（シフト）を確認
   - 予定の詳細を閲覧

3. **完了報告** (オファー詳細画面)
   - 施術完了後に報告を送信

---

## データモデル

### Reservation（予約）テーブル

```python
class Reservation:
    id: int
    company_id: int                    # 企業ID
    office_name: str                   # 事業所名
    office_address: str                # 住所
    reservation_date: str              # 予約日（YYYY/MM/DD）
    start_time: str                    # 開始時刻（HH:MM）
    end_time: str                      # 終了時刻（HH:MM）
    application_deadline: str          # 募集期限
    max_participants: int              # 募集人数
    staff_names: str                   # アサインされたスタッフ名（カンマ区切り）
    employee_names: str                # 登録済み社員名（カンマ区切り）

    # 時間枠管理フィールド（管理者登録時のみ使用）
    total_duration: int                # 全体時間（分）
    service_duration: int              # 施術時間（分）
    break_duration: int                # 休憩時間（分）
    slot_count: int                    # 予約枠数
    time_slots: JSON                   # 時間枠情報
    slots_filled: int                  # 予約済み枠数
    hourly_rate: int                   # 時給

    status: ReservationStatus          # ステータス
    notes: str                         # 備考
    requirements: str                  # 要望
```

### ReservationStatus（予約ステータス）

```python
class ReservationStatus(str, enum.Enum):
    RECRUITING = "recruiting"          # 募集中
    CONFIRMED = "confirmed"            # 確定済み
    IN_PROGRESS = "in_progress"        # 実施中
    COMPLETED = "completed"            # 完了
    EVALUATED = "evaluated"            # 評価完了
    CLOSED = "closed"                  # 終了
    CANCELLED = "cancelled"            # キャンセル
```

---

## 予約登録フロー図

```
[管理者] ──┐
           ├─→ [予約作成] ─→ [ステータス: recruiting]
[企業]   ──┘                         │
                                     ↓
                         [管理者がスタッフにオファー送信]
                                     │
                                     ↓
                         [スタッフがオファーを受諾/辞退]
                                     │
                                     ↓
                         [企業が社員を時間枠に割り当て]
                                     │
                                     ↓
                         [ステータス: confirmed（確定済み）]
                                     │
                                     ↓
                         [施術実施]
                                     │
                                     ↓
                         [スタッフが完了報告]
                                     │
                                     ↓
                         [企業が評価入力]
                                     │
                                     ↓
                         [ステータス: closed（終了）]
```

---

## 社員参加登録フロー図

```
[企業が予約作成]
       │
       ↓
[募集中の予約一覧に表示]
       │
       ↓
[社員が予約を選択]
       │
       ↓
[参加登録フォーム入力]
  - 社員名
  - 部署
  - 役職
  - 連絡先
       │
       ↓
[employee_namesに追加]
       │
       ↓
[募集人数に達したら満席]
```

---

## API エンドポイント

### 予約作成

```
POST /api/v1/reservations
```

- **権限**: 企業ユーザーまたは管理者
- **リクエストボディ**: `ReservationCreate`
- **レスポンス**: 作成された予約情報

### 社員参加登録（未実装）

```
POST /api/v1/reservations/{reservation_id}/employees
```

- **権限**: 企業ユーザー
- **リクエストボディ**: `EmployeeRegistration`
- **レスポンス**: 更新された予約情報

---

## 今後の改善案

1. **社員参加登録 API の実装**

   - 現在はモックデータで動作
   - バックエンド API の実装が必要

2. **企業側の時間枠管理機能**

   - 企業側でも詳細な時間枠設定ができるようにする

3. **社員の自己登録機能**

   - 社員が自分のアカウントで直接参加登録できるようにする
   - 現在は企業担当者が代理で登録

4. **通知機能**
   - 社員が参加登録したときに企業担当者に通知
   - 募集人数に達したときに自動で募集終了

---

## まとめ

| 登録方法     | 画面パス                     | 実装状況              | 時間枠管理 | 備考                         |
| ------------ | ---------------------------- | --------------------- | ---------- | ---------------------------- |
| 管理者登録   | `/admin/reservations/new`    | ✅ 実装済み           | ✅ あり    | 詳細な時間枠設定が可能       |
| 企業登録     | `/company/reservations/new`  | ✅ 実装済み           | ❌ なし    | 簡易的な登録のみ             |
| 社員参加登録 | `/company/employee-bookings` | ⚠️ フロントエンドのみ | -          | API は未実装（モックデータ） |
| スタッフ登録 | -                            | ❌ なし               | -          | スタッフは予約を登録できない |

---

最終更新日: 2026 年 1 月 23 日
