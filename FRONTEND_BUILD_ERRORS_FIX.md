# フロントエンドビルドエラー修正レポート

**日付**: 2026-01-22  
**対象**: Next.js フロントエンドアプリケーション

## 概要

Next.js の production ビルド時に発生した型エラーを修正しました。主に、Company モデルの変更に伴うプロパティ名の不一致と、ReservationStatus の enum 値の不一致が原因でした。

---

## 修正内容

### 1. Company インターフェイスの更新

**ファイル**: `frontend/src/lib/api.ts`

**問題**: バックエンドの`Company`モデルと一致しないプロパティ名を使用していた

**修正前**:

```typescript
export interface Company {
  id: number;
  user_id: number;
  company_name: string;
  address: string;
  phone: string;
  representative_name: string;
  contract_start_date: string;
  contract_end_date?: string;
  usage_status: string;
  line_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**修正後**:

```typescript
export interface Company {
  id: number;
  user_id: number;
  name: string;
  office_name: string;
  industry: string;
  plan: string;
  contract_start_date: string;
  contract_end_date?: string;
  usage_count: number;
  representative: string;
  address: string;
  phone: string;
  email: string;
  contact_person?: string;
  contact_phone?: string;
  contact_email?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

**影響範囲**: 以下のファイルで`company_name` → `name`, `representative_name` → `representative`に変更

- `frontend/src/app/admin/companies/page.tsx`
- `frontend/src/app/admin/reservations/page.tsx`
- `frontend/src/app/admin/reservations/[id]/edit/page.tsx`
- `frontend/src/app/admin/reservations/new/page.tsx`
- `frontend/src/app/staff/jobs/offers/[id]/page.tsx`

---

### 2. Employee インターフェイスのプロパティ名修正

**ファイル**: `frontend/src/app/company/employees/page.tsx`

**問題**: `lineId` → `line_id`, `status` → `is_active`, `line_linked`に修正

**修正内容**:

- `selectedEmployee.lineId` → `selectedEmployee.line_id`
- `selectedEmployee.status === '有効'` → `selectedEmployee.is_active`
- `selectedEmployee.status === '連携済'` → `selectedEmployee.line_linked`
- `editFormData.lineId` → `editFormData.line_id`

---

### 3. ReservationStatus の enum 値修正

**問題**: `'pending'`, `'completed'`, `'evaluated'`が存在しないステータス

**修正内容**:

- `'pending'` → `'recruiting'`
- `'completed'` → `'confirmed'`（または削除）
- `'evaluated'` → `'recruiting'`（または削除）

**影響ファイル**:

- `frontend/src/app/company/employee-bookings/page.tsx`
- `frontend/src/app/company/evaluations/page.tsx`
- `frontend/src/app/company/reservations/[id]/page.tsx`
- `frontend/src/app/company/reservations/[id]/evaluate/[assignmentId]/page.tsx`
- `frontend/src/app/company/reservations/new/page.tsx`
- `frontend/src/app/staff/shifts/page.tsx`

---

### 4. Assignment インターフェイスの拡張

**ファイル**: `frontend/src/lib/api.ts`

**問題**: `Assignment`インターフェイスに`reservation`プロパティが欠けていた

**追加内容**:

```typescript
export interface Assignment {
  id: number;
  reservation_id: number;
  staff_id: number;
  staff_name: string;
  status: "pending" | "confirmed" | "rejected" | "cancelled";
  assigned_by: number;
  assigned_at: string;
  slot_number?: number;
  notes?: string;
  reservation?: {
    id: number;
    company_id: number;
    company_name?: string;
    office_name: string;
    office_address?: string;
    reservation_date: string;
    start_time: string;
    end_time: string;
    hourly_rate?: number;
    status: ReservationStatus;
    time_slots?: Array<any>;
    [key: string]: any;
  };
}
```

---

### 5. 募集人数バリデーションの型安全性向上

**ファイル**: `frontend/src/app/admin/reservations/new/page.tsx`

**問題**: `formData.slot_count`が`undefined`の可能性がある

**修正内容**:

```typescript
// 修正前
if (formData.max_participants > formData.slot_count)

// 修正後
if (formData.max_participants > (formData.slot_count || 1))
```

---

### 6. StatCardProps の型拡張

**ファイル**: `frontend/src/components/common/StatCard.tsx`

**問題**: `changeType`に`'warning'`を追加

**修正内容**:

```typescript
interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  change?: string;
  changeType?: "positive" | "negative" | "warning"; // 'warning' を追加
}
```

---

### 7. window.bootstrap の型エラー修正

**ファイル**: `frontend/src/app/company/employees/page.tsx`

**問題**: `window.bootstrap`が TypeScript で認識されない

**修正内容**:

```typescript
// 修正前
const modal = window.bootstrap?.Modal?.getInstance(modalElement);

// 修正後
const modal = (window as any).bootstrap?.Modal?.getInstance(modalElement);
```

---

### 8. API リクエストヘッダーの型修正

**ファイル**: `frontend/src/lib/api.ts`

**問題**: `HeadersInit`型が`Authorization`プロパティの追加を許可しない

**修正内容**:

```typescript
// 修正前
const headers: HeadersInit = {
  "Content-Type": "application/json",
  ...fetchOptions.headers,
};

// 修正後
const headers: Record<string, string> = {
  "Content-Type": "application/json",
  ...(fetchOptions.headers as Record<string, string>),
};
```

---

### 9. Staff スキルフィルターの State 型修正

**ファイル**: `frontend/src/app/admin/staff/search/page.tsx`

**問題**: `searchParams`に`skills`プロパティがない

**修正内容**:

```typescript
const [searchParams, setSearchParams] = useState({
  name: "",
  minRating: "",
  is_available: true,
  sortBy: "rating",
  skills: [] as string[], // 追加
});
```

---

### 10. RatingCreate インターフェイスの修正

**ファイル**: `frontend/src/app/company/evaluations/[id]/page.tsx`

**問題**: `RatingCreate`に`rating`プロパティが存在しない

**修正内容**:

```typescript
// 修正前
await ratingsApi.create({
  reservation_id: reservationId,
  company_id: companyId,
  staff_id: staffId,
  rating: ratingData.rating,
  comment: ratingData.comment || undefined,
});

// 修正後
await ratingsApi.create({
  reservation_id: reservationId,
  company_id: companyId,
  staff_id: staffId,
  cleanliness: ratingData.rating,
  responsiveness: ratingData.rating,
  satisfaction: ratingData.rating,
  punctuality: ratingData.rating,
  skill: ratingData.rating,
  comment: ratingData.comment || undefined,
});
```

---

### 11. Shift 管理画面のステータス修正

**ファイル**: `frontend/src/app/staff/shifts/page.tsx`

**問題**: `'completed'`ステータスが`AssignmentStatus`に存在しない

**修正内容**:

- `'completed'`ステータスへの参照をすべて削除または`'confirmed'`に変更
- 完了済みフィルターは将来の実装として`false`を返すように変更

```typescript
if (filterStatus === "completed") {
  // 完了済み: 完了報告済みのマーカーがあるもの（現在の実装では confirmed のみ）
  // TODO: 将来的に completed ステータスを追加予定
  return false;
}
```

---

## ビルド結果

✅ **ビルド成功**

```
 ✓ Compiled successfully
 ✓ Linting and checking validity of types
 ✓ Collecting page data
 ✓ Generating static pages (38/38)
 ✓ Finalizing page optimization
```

**総ページ数**: 38 ページ  
**First Load JS**: 87.3 kB (共通)  
**最大ページサイズ**: 106 kB (`/admin/reservations/[id]/edit`)

---

## 今後の推奨事項

1. **型定義の一元管理**:

   - バックエンドとフロントエンドでモデルの型定義を共有する仕組みの導入を検討
   - OpenAPI / Swagger からの型自動生成を検討

2. **ステータス管理の整理**:

   - `ReservationStatus`, `AssignmentStatus`の enum 定義をバックエンドと完全一致させる
   - `'completed'`ステータスの実装を検討

3. **テスト導入**:

   - 型の不整合を早期に検出するため、単体テストの導入を推奨
   - E2E テストでビルドエラーを防ぐ

4. **CI/CD パイプライン**:
   - GitHub Actions 等でビルドチェックを自動化
   - プルリクエスト時に型チェックを必須化

---

## まとめ

本修正により、Next.js の production ビルドが正常に完了するようになりました。主な修正内容は、バックエンド API とフロントエンドの型定義の不一致を解消し、TypeScript の厳密な型チェックに対応したことです。

今後は、型定義の一元管理と CI/CD パイプラインの導入により、同様の問題を未然に防ぐことが推奨されます。
