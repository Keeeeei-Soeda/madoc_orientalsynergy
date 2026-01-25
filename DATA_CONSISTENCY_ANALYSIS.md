# 4つの画面のデータ使用状況分析

## 作成日: 2026年1月23日

## 問題の概要

予約ID 42（テスト012）において、以下の不整合が発生：
- データベース: 枠1が埋まっている（田中太郎が登録済み）✅
- 画面表示: 枠がすべて空いていると表示される ❌

---

## データベースの状態（正常）

```sql
予約ID 42（テスト012）
- max_participants: 3      （募集人数）
- slots_filled: 1           （予約済み枠数）
- slot_count: 3             （時間枠の総数）
- employee_names: '田中太郎' （登録社員名）
- time_slots[0]:
  - is_filled: true
  - employee_name: '田中太郎'
  - employee_department: '営業部'
  - employee_id: なし ⚠️
```

**重要**: `employee_id`がない理由は、社員が直接登録したか、古いAPIで登録されたため。

---

## 4つの画面のデータ使用状況

### 1️⃣ 管理者画面の予約詳細

**ファイル**: `frontend/src/app/admin/reservations/[id]/page.tsx`

#### データソース

| 項目 | 使用するデータ | 計算方法 |
|------|-------------|---------|
| 募集人数 | `max_participants` | そのまま表示 |
| 確定数 | `confirmedAssignments.length` | スタッフのアサイン数をカウント |
| オファー中 | `pendingAssignments.length` | pending状態のアサイン数 |

#### コード

```typescript
// 341-343行目: 募集人数（希望スタッフ数）
<span className="fw-bold">
  {reservation.max_participants || 1} 名
</span>

// 376-388行目: アサイン状況
<div className="col-md-4">
  <small className="text-muted d-block">募集人数</small>
  <span className="fs-5 fw-bold">{reservation.max_participants || 1} 名</span>
</div>
<div className="col-md-4">
  <small className="text-muted d-block">確定数</small>
  <span>{confirmedAssignments.length} 名</span>
</div>
<div className="col-md-4">
  <small className="text-muted d-block">オファー中</small>
  <span>{pendingAssignments.length} 名</span>
</div>
```

#### 時間枠の表示

```typescript
// 243行目
const timeSlots = (reservation.time_slots || []) as TimeSlotWithEmployee[]

// TimeSlotDisplayコンポーネントで表示
<TimeSlotDisplay
  slots={timeSlots}
  hourlyRate={reservation.hourly_rate}
  readOnly={true}
  hideEmployeeInfo={true}  // 社員情報は非表示
/>
```

#### ⚠️ 問題点

- **社員の登録（`employee_names`, `slots_filled`）を全く見ていない**
- スタッフのアサイン（`assignments`）のみを確認
- 社員が登録しても「確定数」に反映されない
- `TimeSlotDisplay`で`employee_id`がないと枠が空いていると判定される

---

### 2️⃣ 企業側の予約一覧

**ファイル**: `frontend/src/app/company/reservations/page.tsx`

#### データソース

| 項目 | 使用するデータ | 計算方法 |
|------|-------------|---------|
| 募集人数 | `max_participants` | そのまま表示 |
| 予約済み枠数 | `slots_filled` | そのまま使用 ✅ |
| 空き枠 | 計算値 | `max_participants - slots_filled` ✅ |

#### コード

```typescript
// 28-34行目: 空き枠の計算
const reservationsWithAvailability = data.map((reservation) => {
  // slots_filledから予約済み枠数を取得
  const filledSlots = reservation.slots_filled || 0
  // max_participantsが募集人数
  const totalSlots = reservation.max_participants || 1
  const availableSlots = totalSlots - filledSlots
  
  return {
    ...reservation,
    available_slots: availableSlots,
    assigned_count: filledSlots
  }
})

// 160-167行目: 表示
<span className="fw-bold">{reservation.max_participants || 1}名</span>
<small className={`text-${reservation.available_slots > 0 ? 'success' : 'danger'}`}>
  <i className={`bi bi-${reservation.available_slots > 0 ? 'check-circle' : 'x-circle'} me-1`}></i>
  空き{reservation.available_slots}枠
</small>
```

#### ✅ 正常

- `slots_filled`を使用しているため、正しく計算される
- 空き枠の計算も正確

---

### 3️⃣ 企業側の予約詳細

**ファイル**: `frontend/src/app/company/reservations/[id]/page.tsx`

#### データソース

予約データを取得後、`TimeSlotDisplay`コンポーネントで表示。

```typescript
// 50-51行目: ログ出力
slotsFilled: reservationData.slots_filled,
totalSlots: reservationData.slot_count
```

#### 時間枠の表示

`TimeSlotDisplay`コンポーネントを使用:

```typescript
<TimeSlotDisplay
  slots={timeSlots}
  onAssignEmployee={handleAssignEmployee}
  onUnassignEmployee={handleUnassignEmployee}
/>
```

#### ⚠️ 問題点

**`TimeSlotDisplay`コンポーネントの判定ロジック:**

```typescript
// TimeSlotDisplay.tsx 51行目
const isAssigned = slot.is_filled && slot.employee_id
```

この条件により：
- ✅ `employee_id`がある場合（社員マスタから割り当て）→ 表示される
- ❌ `employee_id`がない場合（社員が自己登録）→ **表示されない**

**結果**: 田中太郎は`employee_id`がないため、枠1が空いていると判定される。

---

### 4️⃣ 社員登録画面（社員が自分で予約）

**ファイル**: `frontend/src/app/company/employee-bookings/page.tsx`

#### データソース

| 項目 | 使用するデータ | 計算方法 |
|------|-------------|---------|
| 募集人数 | `max_participants` | そのまま表示 |
| 予約済み枠数 | `slots_filled` | 優先的に使用 ✅ |
| 空き枠 | 計算値 | `max_participants - slots_filled` ✅ |

#### コード

```typescript
// 217-225行目: 予約数と空き枠の計算
// slots_filledを優先的に使用（正確な予約済み枠数）
const registeredCount = reservation.slots_filled !== undefined 
  ? reservation.slots_filled 
  : (reservation.employee_names 
      ? reservation.employee_names.split(',').filter(n => n.trim()).length 
      : 0)
const maxParticipants = reservation.max_participants || 1
const availableSlots = maxParticipants - registeredCount
const isFull = availableSlots <= 0

// 268-275行目: 表示
<small className="text-muted d-block">募集人数</small>
<div className="fw-bold">
  {registeredCount} / {maxParticipants}名
  {!isFull && (
    <span className="text-success ms-2 small">
      (空き{availableSlots}名)
    </span>
  )}
</div>
```

#### ✅ 正常

- `slots_filled`を使用しているため、正しく計算される
- 空き枠の計算も正確

---

## データフィールドの定義

### Reservationモデルの主要フィールド

| フィールド | 意味 | 用途 | 更新タイミング |
|-----------|------|------|--------------|
| `max_participants` | 募集人数 | 何名まで予約できるか | 予約作成時に設定 |
| `slots_filled` | 予約済み枠数 | 現在何名が予約しているか | 社員登録時にインクリメント |
| `slot_count` | 時間枠の総数 | 時間を何枠に分割したか | 時間枠計算時に設定 |
| `employee_names` | 登録社員名 | 予約した社員の名前（カンマ区切り） | 社員登録時に追加 |

### time_slotsの主要フィールド

| フィールド | 意味 | 更新タイミング |
|-----------|------|--------------|
| `is_filled` | 枠が埋まっているか | 社員またはスタッフが割り当てられた時 |
| `employee_id` | 社員マスタのID | 社員マスタから割り当てた時のみ |
| `employee_name` | 社員名 | 社員が登録された時 |
| `employee_department` | 社員の部署 | 社員が登録された時 |
| `staff_id` | スタッフID | スタッフがアサインされた時 |
| `staff_name` | スタッフ名 | スタッフがアサインされた時 |

---

## 問題の根本原因

### TimeSlotDisplayコンポーネントの判定ロジック

**ファイル**: `frontend/src/components/reservations/TimeSlotDisplay.tsx`  
**51行目**:

```typescript
const isAssigned = slot.is_filled && slot.employee_id
```

### 問題点

この条件では、**`employee_id`が必須**になっている。

#### 2つの社員登録パターン

| パターン | `employee_id` | `employee_name` | `is_filled` | 判定結果 |
|---------|--------------|----------------|------------|---------|
| ① 社員マスタから割り当て | ✅ あり | ✅ あり | ✅ true | ✅ **割り当て済み** |
| ② 社員が自己登録 | ❌ **なし** | ✅ あり | ✅ true | ❌ **未割り当て** |

### なぜ`employee_id`がないのか？

**パターン②（社員が自己登録）の場合:**
1. 社員が`/company/employee-bookings`から予約
2. フォームで氏名・部署などを入力
3. バックエンドAPIで`time_slots`に情報を登録
4. しかし、社員マスタ（Employeeテーブル）には登録されていない
5. そのため、`employee_id`が存在しない

---

## 不整合の具体例

### データベースの状態（予約ID 42）

```json
{
  "id": 42,
  "max_participants": 3,
  "slots_filled": 1,
  "employee_names": "田中太郎",
  "time_slots": [
    {
      "slot": 1,
      "start_time": "12:00",
      "end_time": "12:30",
      "duration": 30,
      "is_filled": true,
      "employee_name": "田中太郎",
      "employee_department": "営業部"
      // ❌ employee_id がない
    },
    {
      "slot": 2,
      "start_time": "12:40",
      "end_time": "13:10",
      "duration": 30,
      "is_filled": false
    },
    {
      "slot": 3,
      "start_time": "13:20",
      "end_time": "13:50",
      "duration": 30,
      "is_filled": false
    }
  ]
}
```

### 各画面の表示結果

| 画面 | 募集人数 | 予約済み | 空き枠 | 枠1の表示 | 正確性 |
|------|---------|---------|--------|----------|--------|
| 管理者画面（予約詳細） | 3名 | 0名（スタッフのみカウント） | - | ⚪ 未割り当て | ❌ 不正確 |
| 企業側（予約一覧） | 3名 | 1名 | 2名 | - | ✅ 正確 |
| 企業側（予約詳細） | 3名 | - | - | ⚪ 未割り当て | ❌ 不正確 |
| 社員登録画面 | 3名 | 1名 | 2名 | - | ✅ 正確 |

---

## データの共通化の現状

### ✅ 共通化されているデータ

1. **募集人数**: すべての画面で`max_participants`を使用
2. **予約済み枠数**: 企業側の一覧と社員登録画面で`slots_filled`を使用

### ❌ 共通化されていないデータ

1. **管理者画面の「確定数」**: 
   - スタッフのアサイン数（`assignments`）のみをカウント
   - 社員の予約（`slots_filled`）を見ていない
   
2. **時間枠の判定ロジック**:
   - `TimeSlotDisplay`コンポーネントが`employee_id`を必須としている
   - `is_filled`フラグだけでは判定していない

---

## 推奨される修正方針

### 優先度: 🔴 最高

#### 1. `TimeSlotDisplay`コンポーネントの修正

**ファイル**: `frontend/src/components/reservations/TimeSlotDisplay.tsx`  
**51行目**

**修正前:**
```typescript
const isAssigned = slot.is_filled && slot.employee_id
```

**修正後（案1 - 推奨）:**
```typescript
const isAssigned = slot.is_filled || slot.employee_name || slot.staff_name
```

**修正後（案2）:**
```typescript
const isAssigned = slot.is_filled && (slot.employee_id || slot.employee_name || slot.staff_id || slot.staff_name)
```

**修正理由:**
- `is_filled`が`true`なら割り当て済みと判定
- または、名前が設定されていれば割り当て済みと判定
- `employee_id`の有無に関わらず正しく判定できる

#### 2. 管理者画面の「確定数」の計算修正

**ファイル**: `frontend/src/app/admin/reservations/[id]/page.tsx`

**現在の問題:**
- スタッフのアサイン数のみをカウント
- 社員の予約数を考慮していない

**修正案:**
```typescript
// 380-383行目を修正
const totalAssigned = (reservation.slots_filled || 0) + confirmedAssignments.length

<div className="col-md-4">
  <small className="text-muted d-block">確定数（社員+スタッフ）</small>
  <span className={`fs-5 fw-bold ${totalAssigned > (reservation.max_participants || 1) ? 'text-danger' : 'text-success'}`}>
    {totalAssigned} 名
  </span>
  <small className="text-muted d-block">
    社員: {reservation.slots_filled || 0}名 / スタッフ: {confirmedAssignments.length}名
  </small>
</div>
```

---

## まとめ

### 現状の問題点

1. ✅ **データベース**: 正常（整合性あり）
2. ❌ **TimeSlotDisplayコンポーネント**: `employee_id`が必須になっている
3. ❌ **管理者画面**: 社員の予約を考慮していない
4. ✅ **企業側の予約一覧**: 正常
5. ✅ **社員登録画面**: 正常

### データの共通化

- `max_participants`（募集人数）: ✅ 全画面で共通
- `slots_filled`（予約済み枠数）: ⚠️ 一部の画面のみ使用
- 時間枠の判定: ❌ `employee_id`依存で不統一

### 修正の優先順位

1. 🔴 **最優先**: `TimeSlotDisplay`コンポーネントの判定ロジック修正
2. 🟠 **高**: 管理者画面の確定数に社員の予約を含める
3. 🟡 **中**: すべての画面で`slots_filled`を統一的に使用

---

**作成日**: 2026年1月23日  
**ステータス**: 分析完了  
**次のアクション**: コード修正の実施

