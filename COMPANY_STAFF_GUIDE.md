# 企業側・スタッフ側画面実装ガイド

## 概要

Oriental Synergy 派遣業務管理システムの企業側とスタッフ側のフロントエンド実装ガイドです。
既存のHTMLファイルを参考に、Next.js + TypeScript + Bootstrapで実装しました。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Bootstrap 5 + SCSS
- **アイコン**: Bootstrap Icons
- **状態管理**: React Hooks (useState)

---

## 企業側（Company）画面

### ディレクトリ構造

```
frontend/src/app/company/
├── layout.tsx              # 企業側レイアウト
├── dashboard/
│   └── page.tsx           # ダッシュボード
├── profile/
│   └── page.tsx           # 企業情報管理
├── employees/
│   └── page.tsx           # 社員管理（LINE連動）
├── reservations/
│   └── page.tsx           # 予約管理
├── staff/
│   └── page.tsx           # スタッフ検索（将来実装）
├── evaluations/
│   └── page.tsx           # 評価入力（将来実装）
└── notifications/
    └── page.tsx           # 通知（将来実装）
```

### 実装済み画面

#### 1. ダッシュボード (`/company/dashboard`)

**参考元**: `OrientalSynergy-main/customer/index.html`

**主な機能**:
- 統計カード（今月の予約数、利用回数、利用金額、登録社員数）
- 今後の予約一覧
- 最近の評価
- クイックアクション

**モックデータ**:
```typescript
const statsData = [
  { title: '今月の予約数', value: 12, icon: 'bi-calendar-check', iconColor: 'primary' },
  { title: '利用回数（累計）', value: 48, icon: 'bi-graph-up', iconColor: 'success' },
  // ...
]
```

#### 2. 企業情報管理 (`/company/profile`)

**参考元**: `OrientalSynergy-main/customer/info.html`

**主な機能**:
- 企業基本情報表示（ID、企業名、業種、代表者、住所、連絡先など）
- 利用状況表示（利用回数、契約プラン、契約期間、累計金額）
- 事業所情報一覧（テーブル形式）
- 編集ボタン（将来実装）
- 事業所追加ボタン（将来実装）

**特徴**:
- 2カラムレイアウト（基本情報と利用状況）
- Google Mapsリンク付き住所表示
- 事業所情報のテーブル表示

#### 3. 社員管理 (`/company/employees`)

**参考元**: `OrientalSynergy-main/customer/staff.html`

**主な機能**:
- 社員一覧（テーブル形式）
- 検索機能（社員名、部署）
- LINE連携状況表示
- 社員詳細モーダル
- LINE招待ボタン（未連携の場合）

**ステータス**:
- ✅ 連携済（緑バッジ）
- ⚠️ 未連携（黄色バッジ）

#### 4. 予約管理 (`/company/reservations`)

**参考元**: `OrientalSynergy-main/customer/reserve.html`

**主な機能**:
- 予約一覧（テーブル形式）
- 検索機能（事業所名）
- ステータス別表示（未確認、受付済、終了、評価済み）
- アクション（募集、確認、評価入力）

**ステータス管理**:
```typescript
const statusConfig = {
  pending: { label: '未確認', color: 'warning' },
  confirmed: { label: '受付済', color: 'success' },
  completed: { label: '終了', color: 'secondary' },
  evaluated: { label: '評価済み', color: 'info' },
}
```

### 企業側サイドバー

**ファイル**: `frontend/src/components/layout/CompanySidebar.tsx`

**メニュー項目**:
- ダッシュボード
- 企業情報管理
- 社員管理
- 予約管理
- スタッフ検索
- 評価入力
- 通知

**デザイン**:
- プライマリカラー（青）を使用
- アクティブ状態のハイライト表示
- 左ボーダーでアクティブページを明示

---

## スタッフ側（Staff）画面

### ディレクトリ構造

```
frontend/src/app/staff/
├── layout.tsx              # スタッフ側レイアウト
├── dashboard/
│   └── page.tsx           # ダッシュボード
├── mypage/
│   └── page.tsx           # マイページ
├── jobs/
│   ├── page.tsx           # 業務一覧
│   └── offers/
│       └── page.tsx       # オファー確認
├── shifts/
│   └── page.tsx           # シフト管理
├── attendance/
│   └── page.tsx           # 勤怠管理（将来実装）
├── evaluations/
│   └── page.tsx           # 評価確認（将来実装）
└── notifications/
    └── page.tsx           # 通知（将来実装）
```

### 実装済み画面

#### 1. ダッシュボード (`/staff/dashboard`)

**参考元**: `OrientalSynergy-main/staff/index.html`

**主な機能**:
- 統計カード（今月の勤務日数、収入予定、新しいオファー、平均評価）
- 今後のシフト一覧
- 新しいオファー（カード形式、即座に受諾/辞退可能）
- クイックアクション

**特徴**:
- オファーカードに受諾/辞退ボタン配置
- 新しいオファーに赤いバッジ表示

#### 2. マイページ (`/staff/mypage`)

**参考元**: `OrientalSynergy-main/staff/mypage.html`

**主な機能**:
- 基本情報表示・編集
- 評価サマリー（総合評価、完了業務数、今月の業務）
- 評価一覧（テーブル形式）
- コメント表示モーダル

**編集モード**:
- 編集ボタンクリックで入力フォームに切り替え
- useState で編集状態を管理

**評価項目**:
- 清潔感
- 対応力
- 満足度
- コメント

#### 3. 業務一覧 (`/staff/jobs`)

**参考元**: `OrientalSynergy-main/staff/oubo.html`

**主な機能**:
- 業務カード一覧（2カラムグリッド）
- 検索機能（企業名、事業所）
- ステータスフィルター
- カード内に詳細情報表示（日時、報酬、場所、業務内容）
- ステータス別アクション

**ステータス別表示**:
- **募集中**: 応募ボタン + 詳細ボタン
- **応募済**: 応募済みボタン（無効化）+ キャンセルボタン
- **確定**: 詳細を見るボタン
- **完了**: （表示のみ）

#### 4. オファー確認 (`/staff/jobs/offers`)

**参考元**: `OrientalSynergy-main/staff/oubo.html`

**主な機能**:
- オファーカード一覧（警告スタイル）
- 締切表示（赤バッジ）
- 詳細モーダル（企業情報、業務詳細、備品リスト、必要資格）
- 受諾/辞退ボタン

**デザイン**:
- 警告カラー（黄色）でオファーを強調
- 締切日を赤いバッジで表示
- モーダルで詳細情報を表示

#### 5. シフト管理 (`/staff/shifts`)

**参考元**: `OrientalSynergy-main/staff/info.html`

**主な機能**:
- 表示切替（リスト/カレンダー）
- ステータスフィルター
- シフト一覧（テーブル形式）
- 実績時間表示（完了済みの場合）

**ステータス**:
- 確定（緑）
- 未確定（黄）
- 完了（グレー）
- キャンセル（赤）

**将来実装**:
- カレンダー表示機能

### スタッフ側サイドバー

**ファイル**: `frontend/src/components/layout/StaffSidebar.tsx`

**メニュー項目**:
- ダッシュボード
- マイページ
- 業務一覧
- オファー（バッジ付き）
- シフト管理
- 勤怠管理
- 評価確認
- 通知

**デザイン**:
- サクセスカラー（緑）を使用
- オファーメニューに未読バッジ表示
- 左ボーダーでアクティブページを明示

---

## 共通コンポーネント

### レイアウトコンポーネント

#### CompanySidebar
- 企業側専用サイドバー
- プライマリカラー（青）
- パス名に基づくアクティブ状態管理

#### StaffSidebar
- スタッフ側専用サイドバー
- サクセスカラー（緑）
- オファーバッジ機能

#### Header
- 共通ヘッダー（既存）
- ロゴ、ユーザーメニュー、通知アイコン

#### Footer
- 共通フッター（既存）

### UIコンポーネント

#### PageHeader
- ページタイトル
- パンくずリスト
- アクションボタン

#### StatCard
- 統計情報カード
- アイコン、タイトル、値、変化率

---

## デザインパターン

### カラースキーム

**企業側**:
- プライマリ: `#0d6efd`（青）
- サイドバーアクティブ: `bg-primary bg-opacity-10`

**スタッフ側**:
- プライマリ: `#198754`（緑）
- サイドバーアクティブ: `bg-success bg-opacity-10`

### ステータスバッジ

```typescript
// 企業側 - 予約ステータス
pending → warning（黄色）
confirmed → success（緑）
completed → secondary（グレー）
evaluated → info（青）

// スタッフ側 - 業務ステータス
available → success（緑）
applied → info（青）
confirmed → primary（青）
completed → secondary（グレー）
```

### レスポンシブデザイン

```scss
// カード
col-12 col-lg-6         // 2カラム（PC）、1カラム（モバイル）
col-12 col-md-8         // 検索バー
col-12 col-md-4         // フィルター

// 統計カード
col-12 col-sm-6 col-xl-3  // 4カラム（PC）、2カラム（タブレット）、1カラム（モバイル）
```

---

## モックデータ構造

### 企業側

```typescript
// 予約データ
interface Reservation {
  id: string
  office: string
  address: string
  date: string
  time: string
  staff: string
  employees: string
  status: 'pending' | 'confirmed' | 'completed' | 'evaluated'
}

// 社員データ
interface Employee {
  id: string
  name: string
  lineId: string
  department: string
  status: '連携済' | '未連携'
  position: string
}
```

### スタッフ側

```typescript
// 業務データ
interface Job {
  id: string
  company: string
  office: string
  address: string
  date: string
  time: string
  duration: string
  pay: string
  description: string
  status: 'available' | 'applied' | 'confirmed' | 'completed'
  deadline: string
}

// シフトデータ
interface Shift {
  id: string
  company: string
  office: string
  date: string
  dayOfWeek: string
  startTime: string
  endTime: string
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled'
  employees: string[]
  notes: string
  actualStart?: string
  actualEnd?: string
}
```

---

## 今後の実装予定

### 企業側
- [ ] スタッフ検索機能
- [ ] 評価入力機能（個別評価フォーム）
- [ ] 通知機能
- [ ] 予約詳細画面
- [ ] 企業情報編集機能
- [ ] 事業所追加・編集機能

### スタッフ側
- [ ] 勤怠管理（出勤・退勤打刻）
- [ ] 評価確認画面
- [ ] 通知機能
- [ ] 業務詳細画面
- [ ] カレンダー表示
- [ ] 報告機能（業務完了報告）

### 共通
- [ ] モーダルの機能実装（現在は表示のみ）
- [ ] フォーム送信処理
- [ ] API連携
- [ ] エラーハンドリング
- [ ] ローディング状態
- [ ] ページネーション
- [ ] 並び替え機能

---

## 開発ガイド

### 新しい画面を追加する手順

1. **ディレクトリ作成**
   ```bash
   mkdir -p frontend/src/app/company/新機能
   # または
   mkdir -p frontend/src/app/staff/新機能
   ```

2. **ページファイル作成**
   ```bash
   touch frontend/src/app/company/新機能/page.tsx
   ```

3. **基本構造**
   ```typescript
   'use client'
   
   import React from 'react'
   import PageHeader from '@/components/common/PageHeader'
   
   export default function NewPage() {
     return (
       <>
         <PageHeader 
           title="ページタイトル"
           breadcrumbs={[
             { label: 'ダッシュボード', href: '/company/dashboard' },
             { label: 'ページタイトル' }
           ]}
         />
         
         <div className="card">
           <div className="card-body">
             {/* コンテンツ */}
           </div>
         </div>
       </>
     )
   }
   ```

4. **サイドバーにメニュー追加**
   - `CompanySidebar.tsx` または `StaffSidebar.tsx` の `menuItems` 配列に追加

### スタイリング

- Bootstrap 5のユーティリティクラスを優先使用
- カスタムスタイルが必要な場合は `globals.scss` に追加
- レスポンシブデザインは Bootstrap のグリッドシステムを使用

### モーダルの実装

```typescript
// useState でモーダル表示を制御
const [selectedItem, setSelectedItem] = useState<DataType | null>(null)

// ボタン
<button 
  data-bs-toggle="modal" 
  data-bs-target="#myModal"
  onClick={() => setSelectedItem(item)}
>
  詳細
</button>

// モーダル
<div className="modal fade" id="myModal" tabIndex={-1}>
  <div className="modal-dialog">
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">タイトル</h5>
        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
      </div>
      <div className="modal-body">
        {selectedItem && (
          // 内容
        )}
      </div>
    </div>
  </div>
</div>
```

---

## 参考情報

### 既存HTMLとの対応

| 既存HTML | Next.js画面 | 説明 |
|---------|------------|------|
| customer/index.html | /company/dashboard | 企業側トップ |
| customer/info.html | /company/profile | 企業情報管理 |
| customer/staff.html | /company/employees | 社員管理 |
| customer/reserve.html | /company/reservations | 予約管理 |
| staff/index.html | /staff/dashboard | スタッフ側トップ |
| staff/mypage.html | /staff/mypage | マイページ |
| staff/oubo.html | /staff/jobs<br>/staff/jobs/offers | 業務応募・オファー |
| staff/info.html | /staff/shifts | シフト管理 |

### ドキュメント

- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.3/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)
- [React Hooks API Reference](https://react.dev/reference/react)

---

## トラブルシューティング

### Bootstrap モーダルが動作しない

**問題**: モーダルが表示されない、または閉じられない

**解決策**:
1. `layout.tsx` で Bootstrap の JavaScript を読み込んでいるか確認
2. モーダルの `id` と `data-bs-target` が一致しているか確認
3. `'use client'` ディレクティブを追加（クライアントコンポーネントとして実装）

### サイドバーのアクティブ状態が反映されない

**問題**: ページ遷移してもサイドバーのアクティブ状態が変わらない

**解決策**:
- `usePathname()` を使用してパス名を取得
- パス名とメニュー項目の `href` を比較
- `startsWith()` を使用して部分一致も考慮

```typescript
const pathname = usePathname()
const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
```

---

## まとめ

企業側とスタッフ側の主要画面を実装しました。既存HTMLファイルの構造とデザインを参考に、Next.jsの最新機能を活用した実装となっています。

**実装完了画面**:
- ✅ 企業側: ダッシュボード、企業情報管理、社員管理、予約管理
- ✅ スタッフ側: ダッシュボード、マイページ、業務一覧、オファー確認、シフト管理

次のステップとして、API連携やフォーム送信処理の実装を進めることができます。

