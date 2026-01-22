# フロントエンド設計書

## 📋 概要

オリエンタルシナジー 派遣業務管理システムのフロントエンド設計書

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript 5.x
- **UIライブラリ**: React 18 + Bootstrap 5
- **状態管理**: React Context + SWR
- **スタイリング**: SCSS + Bootstrap カスタマイズ

## 🎨 デザインシステム

### カラーパレット

```scss
// Primary Colors
$primary: #476C5E;      // メインカラー（緑系）
$secondary: #6C757D;    // セカンダリ（グレー）
$success: #28A745;      // 成功（緑）
$danger: #DC3545;       // 危険（赤）
$warning: #FFC107;      // 警告（黄）
$info: #17A2B8;         // 情報（青）

// Neutral Colors
$white: #FFFFFF;
$gray-100: #F8F9FA;
$gray-200: #E9ECEF;
$gray-300: #DEE2E6;
$gray-400: #CED4DA;
$gray-500: #ADB5BD;
$gray-600: #6C757D;
$gray-700: #495057;
$gray-800: #343A40;
$gray-900: #212529;
$black: #000000;

// Role Colors
$admin-color: #6F42C1;    // 管理者（紫）
$company-color: #007BFF;  // 企業（青）
$staff-color: #28A745;    // スタッフ（緑）
```

### タイポグラフィ

```scss
// Font Family
$font-family-ja: 'Noto Sans JP', sans-serif;
$font-family-serif-ja: 'Noto Serif JP', serif;
$font-family-en: 'Inter', sans-serif;

// Font Sizes
$font-size-xs: 0.75rem;   // 12px
$font-size-sm: 0.875rem;  // 14px
$font-size-base: 1rem;    // 16px
$font-size-lg: 1.125rem;  // 18px
$font-size-xl: 1.25rem;   // 20px
$font-size-2xl: 1.5rem;   // 24px
$font-size-3xl: 1.875rem; // 30px
$font-size-4xl: 2.25rem;  // 36px
```

### スペーシング

```scss
$spacer: 1rem; // 16px

$spacing-0: 0;
$spacing-1: $spacer * 0.25;  // 4px
$spacing-2: $spacer * 0.5;   // 8px
$spacing-3: $spacer * 0.75;  // 12px
$spacing-4: $spacer;         // 16px
$spacing-5: $spacer * 1.5;   // 24px
$spacing-6: $spacer * 2;     // 32px
$spacing-7: $spacer * 3;     // 48px
$spacing-8: $spacer * 4;     // 64px
```

## 📐 レイアウト構成

### 共通レイアウト

```
┌─────────────────────────────────────────────┐
│  Header (ロゴ、ユーザー名、通知、ログアウト) │
├──────┬──────────────────────────────────────┤
│      │                                      │
│ Side │  Main Content                        │
│ bar  │  (ページごとの内容)                  │
│      │                                      │
│      │                                      │
├──────┴──────────────────────────────────────┤
│  Footer (コピーライト)                       │
└─────────────────────────────────────────────┘
```

### レスポンシブ対応

| デバイス | 幅 | Sidebar |
|---------|-----|---------|
| Mobile | < 768px | 折りたたみ（ハンバーガーメニュー） |
| Tablet | 768px - 1024px | 固定表示（アイコンのみ） |
| Desktop | > 1024px | 固定表示（フル） |

## 🗂 ディレクトリ構造

```
frontend/src/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # 認証グループ
│   │   ├── login/
│   │   │   └── page.tsx         # ログインページ
│   │   ├── register/
│   │   │   └── page.tsx         # 新規登録ページ
│   │   └── layout.tsx           # 認証レイアウト
│   ├── admin/                   # 管理者画面
│   │   ├── dashboard/
│   │   │   └── page.tsx         # ダッシュボード
│   │   ├── companies/
│   │   │   ├── page.tsx         # 企業一覧
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx     # 企業詳細
│   │   │   │   └── edit/
│   │   │   │       └── page.tsx # 企業編集
│   │   │   └── new/
│   │   │       └── page.tsx     # 企業新規作成
│   │   ├── staff/
│   │   │   ├── page.tsx         # スタッフ一覧
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # スタッフ詳細
│   │   │   └── search/
│   │   │       └── page.tsx     # スタッフ検索
│   │   ├── reservations/
│   │   │   ├── page.tsx         # 予約一覧
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # 予約詳細
│   │   │   ├── calendar/
│   │   │   │   └── page.tsx     # カレンダー表示
│   │   │   └── assign/
│   │   │       └── [id]/
│   │   │           └── page.tsx # スタッフアサイン
│   │   ├── attendance/
│   │   │   ├── page.tsx         # 勤怠一覧
│   │   │   └── [id]/
│   │   │       └── page.tsx     # 勤怠詳細
│   │   └── layout.tsx           # 管理者レイアウト
│   ├── company/                 # 企業側画面
│   │   ├── dashboard/
│   │   │   └── page.tsx         # ダッシュボード
│   │   ├── profile/
│   │   │   ├── page.tsx         # 企業情報
│   │   │   └── edit/
│   │   │       └── page.tsx     # 企業情報編集
│   │   ├── offices/
│   │   │   ├── page.tsx         # 事業所一覧
│   │   │   └── [id]/
│   │   │       ├── page.tsx     # 事業所詳細
│   │   │       └── edit/
│   │   │           └── page.tsx # 事業所編集
│   │   ├── employees/
│   │   │   ├── page.tsx         # 社員一覧
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # 社員詳細
│   │   │   └── new/
│   │   │       └── page.tsx     # 社員登録
│   │   ├── reservations/
│   │   │   ├── page.tsx         # 予約一覧
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # 予約詳細
│   │   │   ├── new/
│   │   │   │   └── page.tsx     # 予約作成
│   │   │   └── calendar/
│   │   │       └── page.tsx     # カレンダー表示
│   │   ├── staff/
│   │   │   ├── page.tsx         # スタッフ検索
│   │   │   └── [id]/
│   │   │       └── page.tsx     # スタッフ詳細
│   │   ├── evaluations/
│   │   │   ├── page.tsx         # 評価一覧
│   │   │   └── [assignmentId]/
│   │   │       └── page.tsx     # 評価入力
│   │   └── layout.tsx           # 企業レイアウト
│   ├── staff/                   # スタッフ側画面
│   │   ├── dashboard/
│   │   │   └── page.tsx         # ダッシュボード
│   │   ├── mypage/
│   │   │   ├── page.tsx         # マイページ
│   │   │   └── edit/
│   │   │       └── page.tsx     # プロフィール編集
│   │   ├── jobs/
│   │   │   ├── page.tsx         # 業務一覧
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx     # 業務詳細
│   │   │   └── offers/
│   │   │       └── page.tsx     # オファー一覧
│   │   ├── shifts/
│   │   │   ├── page.tsx         # シフト一覧
│   │   │   └── request/
│   │   │       └── page.tsx     # シフト希望登録
│   │   ├── attendance/
│   │   │   ├── page.tsx         # 勤怠一覧
│   │   │   ├── clock-in/
│   │   │   │   └── page.tsx     # 出勤打刻
│   │   │   ├── clock-out/
│   │   │   │   └── page.tsx     # 退勤打刻
│   │   │   └── summary/
│   │   │       └── page.tsx     # 月間サマリー
│   │   ├── evaluations/
│   │   │   └── page.tsx         # 評価一覧
│   │   └── layout.tsx           # スタッフレイアウト
│   ├── liff/                    # LINE LIFF画面
│   │   ├── clock-in/
│   │   │   └── page.tsx         # LINE出勤打刻
│   │   ├── clock-out/
│   │   │   └── page.tsx         # LINE退勤打刻
│   │   └── layout.tsx           # LIFFレイアウト
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # トップページ
│   └── globals.css              # グローバルスタイル
├── components/                  # コンポーネント
│   ├── common/                  # 共通コンポーネント
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Textarea.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Loading.tsx
│   │   ├── ErrorMessage.tsx
│   │   ├── SuccessMessage.tsx
│   │   ├── Pagination.tsx
│   │   └── ConfirmDialog.tsx
│   ├── layout/                  # レイアウトコンポーネント
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── Notification.tsx
│   ├── forms/                   # フォームコンポーネント
│   │   ├── LoginForm.tsx
│   │   ├── CompanyForm.tsx
│   │   ├── CompanyOfficeForm.tsx
│   │   ├── CompanyEmployeeForm.tsx
│   │   ├── StaffForm.tsx
│   │   ├── StaffSkillForm.tsx
│   │   ├── ReservationForm.tsx
│   │   ├── AssignmentForm.tsx
│   │   ├── AttendanceForm.tsx
│   │   └── EvaluationForm.tsx
│   └── features/                # 機能別コンポーネント
│       ├── attendance/
│       │   ├── ClockInButton.tsx
│       │   ├── ClockOutButton.tsx
│       │   ├── AttendanceList.tsx
│       │   └── AttendanceSummary.tsx
│       ├── evaluation/
│       │   ├── RatingStars.tsx
│       │   ├── EvaluationCard.tsx
│       │   └── EvaluationList.tsx
│       ├── calendar/
│       │   ├── ReservationCalendar.tsx
│       │   └── CalendarEvent.tsx
│       ├── staff/
│       │   ├── StaffCard.tsx
│       │   ├── StaffList.tsx
│       │   ├── StaffSearchForm.tsx
│       │   └── StaffDetailCard.tsx
│       └── reservation/
│           ├── ReservationCard.tsx
│           ├── ReservationList.tsx
│           ├── ReservationSlot.tsx
│           └── ReservationStatus.tsx
├── lib/                         # ライブラリ・ユーティリティ
│   ├── api/                     # API呼び出し
│   │   ├── client.ts            # APIクライアント設定
│   │   ├── auth.ts              # 認証API
│   │   ├── users.ts             # ユーザーAPI
│   │   ├── companies.ts         # 企業API
│   │   ├── staff.ts             # スタッフAPI
│   │   ├── reservations.ts      # 予約API
│   │   ├── assignments.ts       # アサインAPI
│   │   ├── attendance.ts        # 勤怠API
│   │   ├── evaluations.ts       # 評価API
│   │   ├── notifications.ts     # 通知API
│   │   └── line.ts              # LINE API
│   ├── auth/                    # 認証関連
│   │   ├── session.ts           # セッション管理
│   │   ├── permissions.ts       # 権限管理
│   │   └── AuthContext.tsx      # 認証Context
│   ├── utils/                   # ユーティリティ
│   │   ├── date.ts              # 日時処理
│   │   ├── format.ts            # フォーマット
│   │   ├── validation.ts        # バリデーション
│   │   ├── constants.ts         # 定数
│   │   └── helpers.ts           # ヘルパー関数
│   └── hooks/                   # カスタムフック
│       ├── useAuth.ts           # 認証フック
│       ├── useApi.ts            # API呼び出しフック
│       ├── useForm.ts           # フォームフック
│       ├── usePagination.ts     # ページネーションフック
│       ├── useDebounce.ts       # デバウンスフック
│       └── useLocalStorage.ts   # ローカルストレージフック
├── types/                       # TypeScript型定義
│   ├── api.ts                   # API型定義
│   ├── models.ts                # モデル型定義
│   ├── common.ts                # 共通型定義
│   └── index.ts                 # 型エクスポート
└── styles/                      # スタイル
    ├── globals.scss             # グローバルスタイル
    ├── variables.scss           # SCSS変数
    ├── mixins.scss              # SCSSミックスイン
    └── custom-bootstrap.scss    # Bootstrapカスタマイズ
```

## 📄 主要ページ設計

### 1. ログインページ (`/login`)

**機能:**
- メールアドレス・パスワード入力
- ログインボタン
- パスワードリセットリンク

**コンポーネント:**
```tsx
- LoginForm
  - Input (email)
  - Input (password)
  - Button (ログイン)
  - Link (パスワードを忘れた方)
```

---

### 2. 管理者ダッシュボード (`/admin/dashboard`)

**機能:**
- KPI表示（企業数、スタッフ数、今月の予約数等）
- 最近のアクティビティ
- 今日の予約一覧
- 未確認予約の通知

**コンポーネント:**
```tsx
- StatCard (KPI表示) × 4
- ActivityList (最近のアクティビティ)
- ReservationList (今日の予約)
- NotificationBadge
```

---

### 3. 企業一覧 (`/admin/companies`)

**機能:**
- 企業一覧表示（テーブル）
- 検索・フィルター
- ソート機能
- ページネーション
- 新規作成ボタン

**コンポーネント:**
```tsx
- SearchBar
- FilterDropdown (業種、契約状態)
- Table
  - CompanyRow × N
- Pagination
- Button (新規作成)
```

---

### 4. 企業詳細 (`/admin/companies/[id]`)

**機能:**
- 企業基本情報表示
- 契約情報表示
- 事業所一覧
- 社員一覧
- 利用状況グラフ
- 編集ボタン

**コンポーネント:**
```tsx
- CompanyDetailCard
- ContractInfoCard
- OfficeList
- EmployeeList
- UsageChart
- Button (編集)
```

---

### 5. スタッフ検索 (`/admin/staff/search`)

**機能:**
- 高度な検索フォーム
  - スキルフィルター
  - 評価フィルター
  - エリアフィルター
  - 対応可能日時フィルター
- ソート機能
  - 評価順
  - 実績順
  - 最終業務日順
- 検索結果表示
- スタッフカード表示
- ワンクリックアサイン

**コンポーネント:**
```tsx
- StaffSearchForm
  - MultiSelect (スキル)
  - Select (評価)
  - Input (エリア)
  - DatePicker (対応可能日)
- SortDropdown
- StaffCard × N
  - StaffPhoto
  - StaffInfo
  - SkillTags
  - RatingDisplay
  - Button (アサイン)
```

---

### 6. 予約詳細 (`/admin/reservations/[id]`)

**機能:**
- 予約基本情報表示
- 予約枠一覧（社員ごと）
- アサイン済みスタッフ表示
- スタッフアサインボタン
- 予約ステータス変更
- キャンセルボタン

**コンポーネント:**
```tsx
- ReservationDetailCard
- OfficeInfoCard
- ReservationSlot × N
  - EmployeeInfo
  - TimeSlot
  - Notes
- AssignedStaffList
  - StaffCard × N
- Button (スタッフアサイン)
- Select (ステータス変更)
- Button (キャンセル)
```

---

### 7. 企業ダッシュボード (`/company/dashboard`)

**機能:**
- 今月の予約数
- 今月の利用金額
- 次回予約情報
- 最近の評価

**コンポーネント:**
```tsx
- StatCard × 4
- NextReservationCard
- RecentEvaluationList
```

---

### 8. 予約作成 (`/company/reservations/new`)

**機能:**
- 事業所選択
- 日時選択
- 時間枠設定（30分単位）
- 社員選択（各時間枠ごと）
- 要望・備考入力
- 確認・登録

**コンポーネント:**
```tsx
- ReservationForm
  - Select (事業所)
  - DatePicker (日付)
  - TimePicker (開始時刻・終了時刻)
  - Input (枠の時間)
  - ReservationSlotInput × N
    - Select (社員)
    - Textarea (要望)
  - Textarea (備考)
  - Button (追加)
  - Button (確認)
```

---

### 9. スタッフダッシュボード (`/staff/dashboard`)

**機能:**
- 今月の業務数
- 今月の勤務時間
- 予定報酬
- 平均評価
- 今日の業務
- 未確認オファー

**コンポーネント:**
```tsx
- StatCard × 4
- TodayJobList
- OfferList
- Button (オファー確認)
```

---

### 10. 業務オファー一覧 (`/staff/jobs/offers`)

**機能:**
- オファー一覧表示
- 詳細確認
- 受諾・辞退ボタン

**コンポーネント:**
```tsx
- OfferCard × N
  - CompanyInfo
  - JobInfo (日時、場所)
  - Button (詳細)
  - Button (受諾)
  - Button (辞退)
```

---

### 11. 勤怠打刻 (`/staff/attendance/clock-in`)

**機能:**
- 現在時刻表示
- 写真撮影（任意）
- メモ入力（任意）
- 打刻ボタン

**コンポーネント:**
```tsx
- CurrentTime
- CameraCapture
- Textarea (メモ)
- Button (打刻)
```

---

### 12. LINE出勤打刻 (`/liff/clock-in`)

**機能:**
- LIFF認証
- 現在時刻表示
- 業務情報表示
- 写真撮影（LINE カメラ）
- メモ入力
- 打刻ボタン

**コンポーネント:**
```tsx
- LiffAuth
- JobInfo
- CurrentTime
- LiffCamera
- Textarea (メモ)
- Button (打刻)
```

---

### 13. LINE退勤打刻 (`/liff/clock-out`)

**機能:**
- LIFF認証
- 出勤時刻表示
- 勤務時間計算表示
- 休憩時間入力
- 作業数入力
- 写真撮影（LINE カメラ）
- 作業内容入力
- 打刻ボタン

**コンポーネント:**
```tsx
- LiffAuth
- JobInfo
- WorkTimeSummary
  - ClockInTime
  - WorkDuration (自動計算)
- Input (休憩時間)
- Input (作業数)
- LiffCamera
- Textarea (作業内容)
- Button (打刻)
```

---

### 14. 評価入力 (`/company/evaluations/[assignmentId]`)

**機能:**
- スタッフ情報表示
- 業務情報表示
- 総合評価（5段階）
- コメント入力（1000文字）
- 再依頼希望チェック
- 登録ボタン

**コンポーネント:**
```tsx
- StaffInfoCard
- JobInfoCard
- RatingStars (1-5)
- Textarea (コメント, maxLength: 1000)
- Checkbox (再依頼希望)
- Button (登録)
```

---

## 🎯 状態管理

### React Context

**AuthContext**
```tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

**NotificationContext**
```tsx
interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
}
```

### SWR (データフェッチ)

```tsx
// 例: 企業一覧取得
const { data, error, isLoading, mutate } = useSWR(
  '/api/v1/companies',
  fetcher,
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
  }
);
```

---

## 🔒 認証・権限管理

### ルートガード

```tsx
// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <Loading />;
  
  if (!user || user.role !== 'admin') {
    redirect('/login');
  }
  
  return (
    <div className="admin-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        {children}
      </div>
    </div>
  );
}
```

---

## 📱 レスポンシブ対応

### ブレークポイント

```scss
// _variables.scss
$breakpoint-xs: 0;
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 992px;
$breakpoint-xl: 1200px;
$breakpoint-xxl: 1400px;
```

### モバイルファースト

```scss
// 基本はモバイル向けスタイル
.component {
  font-size: 14px;
  padding: 8px;
  
  // タブレット以上
  @media (min-width: $breakpoint-md) {
    font-size: 16px;
    padding: 16px;
  }
  
  // デスクトップ以上
  @media (min-width: $breakpoint-lg) {
    font-size: 18px;
    padding: 24px;
  }
}
```

---

## 🧪 テスト戦略

### ユニットテスト

```tsx
// components/common/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### E2Eテスト

```tsx
// e2e/login.spec.ts (Playwright)
import { test, expect } from '@playwright/test';

test('ログインできる', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/admin/dashboard');
});
```

---

## 🚀 パフォーマンス最適化

### 画像最適化

```tsx
import Image from 'next/image';

<Image
  src="/profile.jpg"
  alt="Profile"
  width={200}
  height={200}
  priority={false}
  placeholder="blur"
/>
```

### コード分割

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Loading />,
  ssr: false,
});
```

### メモ化

```tsx
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => {
    return processData(data);
  }, [data]);
  
  const handleClick = useCallback(() => {
    // 処理
  }, []);
  
  return <div>...</div>;
});
```

---

## 🎨 UIコンポーネントライブラリ

### 共通コンポーネント

#### Button

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ ... }) => { ... };
```

#### Input

```tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number';
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

const Input: React.FC<InputProps> = ({ ... }) => { ... };
```

#### Modal

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ ... }) => { ... };
```

---

## 📚 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [Bootstrap 5](https://getbootstrap.com/docs/5.0/)
- [SWR Documentation](https://swr.vercel.app/)
- [LINE LIFF Documentation](https://developers.line.biz/ja/docs/liff/)

