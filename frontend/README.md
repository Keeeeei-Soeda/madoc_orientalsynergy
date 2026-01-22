# オリエンタルシナジー フロントエンド

Next.js 14 + TypeScript + Bootstrap 5 で構築された管理画面

## 🚀 クイックスタート

### 1. 依存パッケージのインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp env.local.example .env.local
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで http://localhost:3000 を開きます

## 📁 実装済みページ

### 管理者画面 (`/admin/*`)

✅ **ダッシュボード** (`/admin/dashboard`)
- 統計カード（企業数、スタッフ数、予約数等）
- 最近の予約一覧
- 最近のアクティビティ

✅ **企業管理** (`/admin/companies`)
- 企業一覧（検索・フィルター機能付き）
- 企業詳細 (`/admin/companies/[id]`)
  - 基本情報
  - 契約情報
  - 事業所一覧
  - 社員一覧

✅ **スタッフ管理** (`/admin/staff`)
- スタッフ一覧（カード表示）
- スタッフ検索 (`/admin/staff/search`)
  - 詳細検索フィルター（スキル、評価、エリア）
  - ソート機能
  - マッチ度表示

✅ **予約管理** (`/admin/reservations`)
- 予約一覧
- ステータス管理
- アサイン状況表示

✅ **勤怠管理** (`/admin/attendance`)
- 勤怠一覧
- 統計カード
- 打刻方法表示（Web/LINE）

## 🎨 技術スタック

- **Next.js 14**: App Router使用
- **TypeScript**: 型安全な開発
- **Bootstrap 5**: UIフレームワーク
- **SCSS**: カスタムスタイル
- **Bootstrap Icons**: アイコンライブラリ

## 📂 ディレクトリ構造

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理者画面
│   │   ├── dashboard/
│   │   ├── companies/
│   │   ├── staff/
│   │   ├── reservations/
│   │   └── attendance/
│   ├── layout.tsx
│   └── page.tsx
├── components/            # Reactコンポーネント
│   ├── common/           # 共通コンポーネント
│   │   ├── StatCard.tsx
│   │   └── PageHeader.tsx
│   └── layout/           # レイアウトコンポーネント
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
└── styles/               # スタイル
    ├── globals.scss
    ├── variables.scss
    └── custom-bootstrap.scss
```

## 🎯 特徴

### レスポンシブデザイン
- PC、タブレット、スマホ対応
- モバイルファーストアプローチ

### 使いやすいUI
- Bootstrapベースの統一感のあるデザイン
- 直感的なナビゲーション
- 検索・フィルター機能

### モックデータ
- 現在は静的なモックデータを使用
- 後でバックエンドAPIと接続予定

## 📝 次のステップ

### 未実装の機能

- [ ] 認証機能（ログイン・ログアウト）
- [ ] バックエンドAPIとの接続
- [ ] フォームバリデーション
- [ ] データ作成・編集画面
- [ ] 画像アップロード機能
- [ ] カレンダー表示
- [ ] LINE LIFF画面（打刻機能）
- [ ] 企業側画面
- [ ] スタッフ側画面

## 🧪 開発コマンド

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# 本番サーバー起動
npm start

# Lint
npm run lint

# Lintエラーを自動修正
npm run lint:fix

# 型チェック
npm run type-check

# コードフォーマット
npm run format
```

## 🌈 カラーパレット

- **Primary**: #476C5E（メインカラー・緑系）
- **Success**: #28A745（成功・緑）
- **Danger**: #DC3545（危険・赤）
- **Warning**: #FFC107（警告・黄）
- **Info**: #17A2B8（情報・青）

## 📱 レスポンシブブレークポイント

- **xs**: 0px
- **sm**: 576px
- **md**: 768px
- **lg**: 992px
- **xl**: 1200px
- **xxl**: 1400px

## 🤝 開発ガイドライン

### コンポーネント作成

- 関数コンポーネントを使用
- TypeScriptで型定義
- 'use client'ディレクティブは必要な場合のみ

### スタイリング

- Bootstrapクラスを優先使用
- カスタムスタイルはSCSSで
- グローバルスタイルは最小限に

### ファイル命名

- コンポーネント: PascalCase (例: `StatCard.tsx`)
- その他: camelCase (例: `userApi.ts`)

---

**バージョン**: 1.0.0  
**最終更新**: 2024-12-23

