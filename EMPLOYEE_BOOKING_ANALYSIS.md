# 社員単体予約機能の現状分析

## 概要
企業の社員が単体で予約に参加登録する機能（`/company/employee-bookings`）の実装状況を分析しました。

## 現状の問題点

### 1. フロントエンドの問題

**ファイル**: `frontend/src/app/company/employee-bookings/page.tsx`

#### 問題1: API呼び出しがコメントアウトされている
- **場所**: 178行目
- **現状**: `reservationsApi.addEmployee()`の呼び出しがコメントアウトされている
- **影響**: 実際にはAPIが呼ばれず、登録が行われない

```typescript
// await reservationsApi.addEmployee(selectedReservation.id, employeeData)
```

#### 問題2: モックデータを使用している
- **場所**: 14-67行目、85-91行目
- **現状**: 実際のAPIからデータを取得せず、ハードコーディングされたモックデータを使用
- **影響**: 実際の予約データが表示されない

```typescript
const mockReservations: Reservation[] = [
  // ハードコーディングされたデータ
]

// API連携版がコメントアウトされている
```

#### 問題3: 登録後のページリロードがコメントアウトされている
- **場所**: 190行目
- **現状**: 登録後、ページをリロードしないため、UIが更新されない
- **影響**: 登録後も画面に反映されない

```typescript
// window.location.reload()
```

### 2. バックエンドの問題

**ファイル**: `backend/app/api/v1/reservations.py`

#### 問題1: `slots_filled`が更新されていない ⚠️ **重要**
- **場所**: 277-338行目（`add_employee_to_reservation`関数）
- **現状**: `employee_names`フィールドには社員名を追加しているが、`slots_filled`を更新していない
- **影響**: 枠数の減少が反映されない（ユーザーが指摘している問題）

```python
# 社員名を追加（カンマ区切り）
if existing_employees:
    db_reservation.employee_names = f"{existing_employees}, {employee_data.employee_name}"
else:
    db_reservation.employee_names = employee_data.employee_name

# ❌ slots_filled の更新がない！
```

#### 問題2: 満席チェックがない
- **現状**: `max_participants`と現在の登録人数を比較していない
- **影響**: 満席でも登録できてしまう可能性がある

#### 問題3: 時間枠（`time_slots`）への反映がない
- **現状**: `employee_names`に追加するだけで、`time_slots`の各枠に社員を割り当てていない
- **影響**: 時間枠ベースの管理と整合性が取れない

## 実装されている機能

### バックエンド
✅ `/api/v1/reservations/{reservation_id}/employees` エンドポイントが存在
✅ `EmployeeRegistration`スキーマが定義されている
✅ 既存社員の重複チェックが実装されている
✅ 社員情報を`notes`フィールドに追記している

### フロントエンド
✅ 予約一覧の表示UIが実装されている
✅ 登録フォームのUIが実装されている
✅ 満席判定のロジックが実装されている（表示のみ）
✅ モーダルでの詳細表示が実装されている

## 修正が必要な箇所

### 1. バックエンド修正（優先度: 高）

#### `add_employee_to_reservation`関数の修正
1. **`slots_filled`の更新を追加**
   - 現在の登録人数をカウント
   - `slots_filled`をインクリメント

2. **満席チェックの追加**
   - `max_participants`と現在の登録人数を比較
   - 満席の場合はエラーを返す

3. **時間枠への反映（オプション）**
   - 空いている最初の枠に自動割り当て
   - または、`time_slots`の`is_filled`を更新

### 2. フロントエンド修正（優先度: 高）

1. **API呼び出しの有効化**
   - コメントアウトを解除
   - エラーハンドリングを追加

2. **モックデータの削除**
   - 実際のAPIからデータを取得
   - 認証情報を使用して企業の予約のみ取得

3. **登録後の更新処理**
   - ページをリロードするか、データを再取得
   - UIを更新

## データフロー

### 現在のフロー（問題あり）
```
1. フロントエンド: モックデータを表示
2. ユーザー: 登録ボタンをクリック
3. フロントエンド: API呼び出しがコメントアウトされているため、何もしない
4. アラート表示のみ（実際には登録されない）
```

### 期待されるフロー
```
1. フロントエンド: APIから募集中の予約を取得
2. ユーザー: 登録ボタンをクリック
3. フロントエンド: reservationsApi.addEmployee()を呼び出し
4. バックエンド: 
   - 満席チェック
   - employee_namesに追加
   - slots_filledをインクリメント
   - time_slotsを更新（オプション）
5. フロントエンド: データを再取得してUIを更新
```

## 関連ファイル

### バックエンド
- `backend/app/api/v1/reservations.py` - `add_employee_to_reservation`関数（277-338行目）
- `backend/app/schemas/reservation.py` - `EmployeeRegistration`スキーマ
- `backend/app/models/reservation.py` - `Reservation`モデル

### フロントエンド
- `frontend/src/app/company/employee-bookings/page.tsx` - 社員用予約登録画面
- `frontend/src/lib/api.ts` - `reservationsApi.addEmployee`メソッド（475-479行目）

## 次のステップ

1. **バックエンド修正**: `slots_filled`の更新と満席チェックを追加
2. **フロントエンド修正**: API呼び出しを有効化し、モックデータを削除
3. **テスト**: 登録後の枠数減少が正しく反映されることを確認

