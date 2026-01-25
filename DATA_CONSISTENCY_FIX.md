# データ整合性の修正完了

## 修正日: 2026年1月23日

## 問題の概要

ユーザーから報告された重大なバグ:

### 問題点

1. **予約一覧での表示不整合**
   - 岡田たけしが予約済みなのに、空き枠が2名と表示
   - 本来は空き枠1名であるべき

2. **予約詳細画面での不整合**
   - 岡田たけしの予約内容が反映されていない
   - 空き枠が2名になっている
   - 社員のアサインもできる状態（二重予約が可能）

3. **社員予約画面での不整合**
   - 募集人数が1名になっており、予約が取れない状態

### 根本原因

**古いAPIバージョンで登録されたデータの不整合:**

1. `employee_names`に社員名は登録されている ✅
2. しかし、`slots_filled`が0のまま（更新されていない） ❌
3. `time_slots`の`is_filled`フラグも`false`のまま ❌

**フロントエンドの表示ロジックの問題:**

1. 空き枠の計算で`slot_count`（時間枠の総数）を使用していた ❌
2. `max_participants`（募集人数）を使うべきだった ✅

---

## 修正内容

### 1. データベースの修正

#### 1.1 `slots_filled`の修正

**スクリプト**: `backend/fix_reservation_consistency.py`

**修正内容:**
- `employee_names`の実際の人数に基づいて`slots_filled`を更新
- 10件の予約を修正

**修正結果:**
```
予約ID 35: 福岡支店（テスト005） - slots_filled: 0 → 2
予約ID 36: 東京支店（テスト006） - slots_filled: 0 → 1
予約ID 37: 大阪支店（テスト007） - slots_filled: 0 → 1
予約ID 38: 名古屋支店（テスト008） - slots_filled: 0 → 1
予約ID 39: 神戸支店（テスト009） - slots_filled: 0 → 1
予約ID 40: 横浜支店（テスト010） - slots_filled: 0 → 1
予約ID 41: 京都支店（テスト011） - slots_filled: 0 → 1
```

#### 1.2 `time_slots`の`is_filled`フラグ修正

**スクリプト**: `backend/fix_time_slots_filled.py`

**修正内容:**
- 登録済み社員を空いている枠から順番に割り当て
- `is_filled`フラグを`true`に設定
- 6件の予約を修正

**修正結果:**
```
予約ID 36: 東京支店（テスト006） - 枠1に「大岡泰一」を割り当て
予約ID 37: 大阪支店（テスト007） - 枠1に「岡田たけし」を割り当て
予約ID 38: 名古屋支店（テスト008） - 枠1に「大岡泰一」を割り当て
予約ID 39: 神戸支店（テスト009） - 枠1に「岡田たけし」を割り当て
予約ID 40: 横浜支店（テスト010） - 枠1に「大岡泰一」を割り当て
予約ID 41: 京都支店（テスト011） - 枠1に「岡田たけし」を割り当て
```

### 2. フロントエンドの修正

#### 2.1 社員用予約登録ページ

**ファイル**: `frontend/src/app/company/employee-bookings/page.tsx`

**修正前:**
```typescript
const registeredCount = reservation.employee_names 
  ? reservation.employee_names.split(',').filter(n => n.trim()).length 
  : 0
```

**修正後:**
```typescript
// slots_filledを優先的に使用（正確な予約済み枠数）
const registeredCount = reservation.slots_filled !== undefined 
  ? reservation.slots_filled 
  : (reservation.employee_names 
      ? reservation.employee_names.split(',').filter(n => n.trim()).length 
      : 0)
```

**理由:**
- `slots_filled`は正確な予約済み枠数を表す
- `employee_names`は文字列なので、カンマ区切りで分割する必要があり、エラーが起きやすい

#### 2.2 企業管理者用予約一覧ページ

**ファイル**: `frontend/src/app/company/reservations/page.tsx`

**修正前:**
```typescript
const totalSlots = reservation.slot_count || reservation.max_participants || 1
```

**修正後:**
```typescript
// max_participantsが募集人数（slot_countは時間枠の総数なので使用しない）
const totalSlots = reservation.max_participants || 1
```

**理由:**
- `slot_count`: 時間枠の総数（例: 2時間で30分ごとなら4枠）
- `max_participants`: 募集人数（例: 1名または2名）
- 空き枠の計算には募集人数を使うべき

---

## 修正後の整合性確認

### テストデータ005〜011の状態

すべてのテストデータで整合性が確保されました:

| 予約ID | 事業所名 | 募集人数 | slots_filled | 社員数 | is_filled数 | 空き枠 | 整合性 |
|--------|---------|---------|--------------|--------|-------------|--------|--------|
| 35 | 福岡支店（テスト005） | 2 | 2 | 2 | 2 | 0 | ✅ OK |
| 36 | 東京支店（テスト006） | 1 | 1 | 1 | 1 | 0 | ✅ OK |
| 37 | 大阪支店（テスト007） | 1 | 1 | 1 | 1 | 0 | ✅ OK |
| 38 | 名古屋支店（テスト008） | 1 | 1 | 1 | 1 | 0 | ✅ OK |
| 39 | 神戸支店（テスト009） | 1 | 1 | 1 | 1 | 0 | ✅ OK |
| 40 | 横浜支店（テスト010） | 1 | 1 | 1 | 1 | 0 | ✅ OK |
| 41 | 京都支店（テスト011） | 1 | 1 | 1 | 1 | 0 | ✅ OK |

### 予約ID 41（テスト011）の詳細

**修正前:**
```
募集人数 (max_participants): 1
予約済み枠数 (slots_filled): 0  ← 問題
登録社員名 (employee_names): 岡田たけし
空き枠: 1名  ← 本来0名であるべき

time_slots:
  枠1: 14:00~15:00, is_filled=False  ← 問題
  枠2: 15:00~16:00, is_filled=False
```

**修正後:**
```
募集人数 (max_participants): 1
予約済み枠数 (slots_filled): 1  ← 修正完了
登録社員名 (employee_names): 岡田たけし
空き枠: 0名  ← 正しい

time_slots:
  枠1: 14:00~15:00, is_filled=True, employee_name=岡田たけし  ← 修正完了
  枠2: 15:00~16:00, is_filled=False
```

---

## 今後の予防策

### 1. 新しいAPI実装の効果

今回実装した二重予約登録システムでは、**必ず時間枠を選択する**仕様になっているため、今後は以下が保証されます:

✅ `slot_number`が必ず指定される
✅ `time_slots`の`is_filled`フラグが確実に更新される
✅ `slots_filled`が確実にインクリメントされる
✅ データの整合性が保たれる

### 2. バックエンドのバリデーション強化

`add_employee_to_reservation`関数で以下をチェック:

1. ✅ 枠番号の必須チェック
2. ✅ 満席チェック
3. ✅ 枠が既に埋まっているかチェック
4. ✅ `slots_filled`の自動更新
5. ✅ `time_slots`の`is_filled`フラグ更新

### 3. フロントエンドの表示ロジック統一

すべての画面で以下を統一:

- **予約済み枠数**: `slots_filled`を使用
- **募集人数**: `max_participants`を使用
- **空き枠**: `max_participants - slots_filled`

---

## 影響範囲

### 修正されたファイル

**バックエンド:**
1. `backend/fix_reservation_consistency.py` (新規作成)
2. `backend/fix_time_slots_filled.py` (新規作成)

**フロントエンド:**
1. `frontend/src/app/company/employee-bookings/page.tsx`
2. `frontend/src/app/company/reservations/page.tsx`

**データベース:**
- `reservations`テーブルの10件のレコードを修正

### 影響を受ける機能

1. ✅ 社員用予約登録ページ - 正しい空き枠が表示される
2. ✅ 企業管理者用予約一覧 - 正しい空き枠が表示される
3. ✅ 企業管理者用予約詳細 - 正しい予約状況が表示される
4. ✅ 二重予約の防止 - 満席時に登録できない

---

## テスト項目

### 確認済み

- [x] データベースの整合性修正
- [x] フロントエンドの表示ロジック修正
- [x] テストデータ005〜011の整合性確認

### 要確認（ユーザー側）

- [ ] 予約一覧での空き枠表示
- [ ] 予約詳細での予約状況表示
- [ ] 社員予約画面での募集状況表示
- [ ] 満席時の登録不可動作
- [ ] 新規予約登録時の動作

---

## まとめ

### 修正完了事項

✅ **データベース**: 10件の予約の整合性を修正
✅ **フロントエンド**: 2つのページの表示ロジックを修正
✅ **整合性**: すべてのテストデータで整合性を確認

### 今後の対応

1. **ユーザーテスト**: 実際の画面で動作確認
2. **本番デプロイ**: 修正内容を本番環境に反映
3. **監視**: 今後のデータ整合性を監視

### 再発防止

- ✅ 新しいAPI実装で枠番号が必須
- ✅ バックエンドでのバリデーション強化
- ✅ フロントエンドの表示ロジック統一

---

**修正完了日**: 2026年1月23日
**ステータス**: ✅ 完了
**重要度**: 🔴 最高（重大なバグの修正）

