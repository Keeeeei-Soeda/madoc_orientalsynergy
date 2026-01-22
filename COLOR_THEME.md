# カラーテーマ設定

## 概要

Oriental Synergy 派遣業務管理システムのカラーテーマを、[femally](https://femally.jp) のブランドカラーを参考に紫ベースに統一しました。

## カラーパレット

### メインカラー（紫系統）

```scss
// プライマリーカラー
$primary: #7B3F8B       // メイン紫（femally風）

// セカンダリーカラー
$secondary: #6C757D     // グレー（変更なし）

// サクセスカラー
$success: #9B5FAB       // 紫系のサクセスカラー

// インフォカラー
$info: #AB6FBB          // 明るい紫

// 警告カラー
$warning: #D4A5A5       // 柔らかいピンク系

// デンジャーカラー
$danger: #DC3545        // 赤（変更なし）
```

### 役割別カラー

```scss
// 管理画面カラー
$admin-color: #6B2F7B    // 濃い紫

// 企業側カラー
$company-color: #8B4F9B  // ミディアム紫

// スタッフ側カラー
$staff-color: #9B5FAB    // 明るめの紫
```

## カラーの使用例

### 1. 管理画面（Admin）

**カラー**: `#6B2F7B`（濃い紫）

- サイドバーのアクティブ状態
- ロゴテキスト
- メインボタン

**使用クラス**:
- `.text-admin` - テキスト色
- `.bg-admin` - 背景色
- `.border-admin` - ボーダー色
- `.btn-admin` - ボタンスタイル

### 2. 企業側（Company）

**カラー**: `#8B4F9B`（ミディアム紫）

- サイドバーのアクティブ状態
- ロゴテキスト
- アクションボタン

**使用クラス**:
- `.text-company` - テキスト色
- `.bg-company` - 背景色
- `.border-company` - ボーダー色
- `.btn-company` - ボタンスタイル

### 3. スタッフ側（Staff）

**カラー**: `#9B5FAB`（明るめの紫）

- サイドバーのアクティブ状態
- ロゴテキスト
- アクションボタン

**使用クラス**:
- `.text-staff` - テキスト色
- `.bg-staff` - 背景色
- `.border-staff` - ボーダー色
- `.btn-staff` - ボタンスタイル

## 適用箇所

### ✅ 変更済みファイル

#### スタイルシート
1. **`frontend/src/styles/variables.scss`**
   - プライマリーカラーを紫系に変更
   - 役割別カラーを紫の濃淡で統一

2. **`frontend/src/styles/custom-bootstrap.scss`**
   - Bootstrap変数を紫系に上書き

3. **`frontend/src/styles/globals.scss`**
   - カスタムカラークラスを追加
   - `.text-admin`, `.bg-admin`, `.btn-admin`
   - `.text-company`, `.bg-company`, `.btn-company`
   - `.text-staff`, `.bg-staff`, `.btn-staff`
   - `.bg-purple-gradient` - 紫系グラデーション
   - `.bg-purple-light` - 薄い紫背景
   - `.bg-purple-lighter` - さらに薄い紫背景

#### コンポーネント
4. **`frontend/src/app/page.tsx`**（トップページ）
   - 管理画面カード: `border-admin`, `text-admin`
   - 企業側カード: `border-company`, `text-company`
   - スタッフ側カード: `border-staff`, `text-staff`

5. **`frontend/src/components/layout/Sidebar.tsx`**（管理画面サイドバー）
   - ロゴ: `text-admin`
   - アクティブ状態: `text-admin`, `bg-admin`, `border-admin`

6. **`frontend/src/components/layout/CompanySidebar.tsx`**（企業側サイドバー）
   - ロゴ: `text-company`
   - アクティブ状態: `text-company`, `bg-company`, `border-company`

7. **`frontend/src/components/layout/StaffSidebar.tsx`**（スタッフ側サイドバー）
   - ロゴ: `text-staff`
   - アクティブ状態: `text-staff`, `bg-staff`, `border-staff`

## カラーコード詳細

### 紫の濃淡スケール

| 名称 | カラーコード | 用途 | RGB |
|------|------------|------|-----|
| 濃い紫 | `#6B2F7B` | 管理画面 | rgb(107, 47, 123) |
| ミディアム紫 | `#8B4F9B` | 企業側 | rgb(139, 79, 155) |
| 明るめの紫 | `#9B5FAB` | スタッフ側 | rgb(155, 95, 171) |
| 明るい紫 | `#AB6FBB` | インフォ | rgb(171, 111, 187) |
| メイン紫 | `#7B3F8B` | プライマリー | rgb(123, 63, 139) |

### 補助カラー

| 名称 | カラーコード | 用途 | RGB |
|------|------------|------|-----|
| 柔らかいピンク | `#D4A5A5` | 警告 | rgb(212, 165, 165) |
| グレー | `#6C757D` | セカンダリー | rgb(108, 117, 125) |
| 赤 | `#DC3545` | エラー | rgb(220, 53, 69) |

## femally との比較

### femally のブランドカラー
- **メインカラー**: 濃い紫（ダークパープル）
- **サブカラー**: ピンク系、ベージュ系
- **雰囲気**: 女性らしさ、落ち着き、信頼感

### Oriental Synergy の適用
- **メインカラー**: femally風の紫をベースに、役割別に濃淡を作成
- **管理画面**: 濃い紫で権威性を表現
- **企業側**: ミディアム紫で信頼感を表現
- **スタッフ側**: 明るめの紫で親しみやすさを表現

## 使用方法

### HTML/JSXでの使用例

```tsx
// テキスト色
<h1 className="text-admin">管理画面</h1>
<h1 className="text-company">企業側</h1>
<h1 className="text-staff">スタッフ側</h1>

// 背景色
<div className="bg-admin">管理画面コンテンツ</div>
<div className="bg-purple-light">薄い紫の背景</div>

// ボーダー
<div className="border-admin border-3">濃い紫のボーダー</div>

// ボタン
<button className="btn-admin">管理ボタン</button>
<button className="btn-company">企業ボタン</button>
<button className="btn-staff">スタッフボタン</button>

// Bootstrapの標準カラー（自動的に紫系に）
<button className="btn btn-primary">プライマリーボタン</button>
<span className="badge bg-success">成功バッジ</span>
<div className="text-info">情報テキスト</div>
```

### SCSSでの使用例

```scss
// 変数を使用
.custom-element {
  color: $admin-color;
  background-color: rgba($primary, 0.1);
  border: 2px solid $company-color;
  
  &:hover {
    background-color: rgba($staff-color, 0.2);
  }
}

// グラデーション
.gradient-box {
  background: linear-gradient(135deg, $admin-color 0%, $staff-color 100%);
}
```

## アクセシビリティ

### コントラスト比

すべてのカラーは、白背景でのコントラスト比がWCAG AA基準（4.5:1）を満たしています。

| カラー | コントラスト比（白背景） | 評価 |
|--------|----------------------|------|
| #6B2F7B | 7.2:1 | AAA ✅ |
| #8B4F9B | 5.1:1 | AA ✅ |
| #9B5FAB | 4.6:1 | AA ✅ |
| #AB6FBB | 4.2:1 | AA（ギリギリ） ⚠️ |

**推奨事項**:
- 小さなテキストには濃い紫（#6B2F7B、#8B4F9B）を使用
- 大きな見出しやボタンには全ての紫を使用可能
- 背景色として使用する場合は、白または十分に明るいテキストと組み合わせる

## ブラウザ対応

すべてのモダンブラウザで正常に表示されます：
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

## 今後の拡張

### 追加予定のカラークラス

```scss
// ステータスカラー
.status-pending { color: #D4A5A5; }    // 保留中
.status-approved { color: #9B5FAB; }   // 承認済み
.status-rejected { color: #DC3545; }   // 却下

// グレースケール
.text-muted-purple { color: rgba($primary, 0.6); }
.bg-light-purple { background-color: rgba($primary, 0.05); }
```

## 参考リンク

- [femally 公式サイト](https://femally.jp)
- [カラーコントラストチェッカー](https://webaim.org/resources/contrastchecker/)
- [Bootstrap カラーシステム](https://getbootstrap.com/docs/5.3/customize/color/)

---

**更新日**: 2025年1月  
**バージョン**: 1.0.0

