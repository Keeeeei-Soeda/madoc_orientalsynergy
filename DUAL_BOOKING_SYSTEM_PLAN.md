# 二重予約登録システム実装計画

## 概要

管理者が作成した予約に対して、以下の2つの方法で社員の予約登録ができるシステムを実装します。

### 予約登録の2つのパターン

#### ① 企業管理者が社員を予約する（トップダウン方式）
- **誰が**: 企業の管理者（COMPANY権限）
- **どこで**: `/company/reservations/[id]` - 予約詳細ページ
- **方法**: 社員マスタから選択して各時間枠に割り当て
- **特徴**: 
  - 企業が保有する社員マスタ（Employeeテーブル）から選択
  - 時間枠ごとに個別に割り当て可能
  - 管理者が一括で複数の社員をアサイン可能

#### ② 社員が自分で予約する（ボトムアップ方式）
- **誰が**: 企業の社員（一般従業員）
- **どこで**: `/company/employee-bookings` - 社員用予約登録ページ
- **方法**: 募集中の予約一覧から選択 → 時間枠を選択 → 自分の情報を登録
- **特徴**:
  - 社員自身が自分の氏名・部署などを入力
  - **管理者が設定した時間枠の中から希望の時間を選択可能**
  - 社員の自主性を活かした参加型
  - 空き枠のみ選択可能（既に埋まっている枠は選択不可）

## 実現可能性評価

### ✅ 完全に実現可能

この2つの予約方法は技術的に完全に実現可能です。理由：

1. **データモデルの互換性**
   - `Reservation`モデルには両方式に対応するフィールドが存在
   - `time_slots` (JSON): 時間枠ごとの詳細管理
   - `employee_names` (Text): 社員名の一覧
   - `slots_filled` (Integer): 予約済み枠数
   - `max_participants` (Integer): 最大募集人数

2. **既存APIの活用**
   - ① 用: `assign_employee_to_slot` - 既に実装済み
   - ② 用: `add_employee_to_reservation` - 修正が必要だが基礎は実装済み

3. **認証・権限管理**
   - 企業管理者と一般社員の区別が可能
   - 企業IDによる予約のフィルタリングが可能

## 現状の実装状況

### ① 企業管理者が社員を予約する（トップダウン方式）

#### 実装状況: ✅ 90% 完成

**実装済み:**
- ✅ 社員マスタ（Employeeテーブル）
- ✅ 社員マスタのCRUD API
- ✅ 予約詳細ページUI
- ✅ 時間枠ごとの社員割り当てAPI (`assign_employee_to_slot`)
- ✅ 社員割り当て解除API (`unassign_employee_from_slot`)
- ✅ `time_slots`の更新
- ✅ `slots_filled`の更新
- ✅ 満席チェック

**修正済み（最近）:**
- ✅ `time_slots`のJSON/文字列型の処理
- ✅ エラーハンドリング強化

**残課題:**
- なし（既に動作している）

---

### ② 社員が自分で予約する（ボトムアップ方式）

#### 実装状況: ⚠️ 50% 完成（修正が必要）

**実装済み:**
- ✅ 社員用予約登録画面UI (`/company/employee-bookings`)
- ✅ 募集中予約の一覧表示UI
- ✅ 登録フォームUI
- ✅ 満席判定のロジック（フロントエンド）
- ✅ 社員参加登録API (`add_employee_to_reservation`)
- ✅ 重複チェック（同じ社員名）
- ✅ `employee_names`への追加

**未実装/修正が必要:**
- ❌ `slots_filled`の更新（バックエンド）
- ❌ 満席チェック（バックエンド）
- ❌ `time_slots`への指定枠割り当て（バックエンド）
- ❌ 枠が既に埋まっているかのチェック（バックエンド）
- ❌ `EmployeeRegistration`スキーマに`slot_number`追加（バックエンド）
- ❌ 時間枠選択UIの実装（フロントエンド）
- ❌ API呼び出しの有効化（フロントエンド）
- ❌ モックデータの削除（フロントエンド）
- ❌ 実際のAPIからデータ取得（フロントエンド）
- ❌ 登録後のデータ再取得（フロントエンド）

## 実装計画

### フェーズ1: バックエンド修正（優先度: 最高）

#### 1.1 `EmployeeRegistration`スキーマの拡張

**ファイル**: `backend/app/schemas/reservation.py`

**修正内容:**

```python
class EmployeeRegistration(BaseModel):
    """社員の予約登録スキーマ"""
    employee_name: str
    department: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    notes: Optional[str] = None
    slot_number: Optional[int] = None  # ← 追加: 社員が選択した枠番号
```

#### 1.2 `add_employee_to_reservation`関数の強化

**ファイル**: `backend/app/api/v1/reservations.py`

**修正内容:**

1. **枠番号の必須チェック**
   ```python
   # 枠番号が指定されていない場合はエラー
   if not employee_data.slot_number:
       raise HTTPException(
           status_code=status.HTTP_400_BAD_REQUEST,
           detail="枠番号を指定してください"
       )
   ```

2. **満席チェックの追加**
   ```python
   # 現在の登録人数をカウント
   current_count = len(existing_employees.split(',')) if existing_employees else 0
   
   # 満席チェック
   if current_count >= db_reservation.max_participants:
       raise HTTPException(
           status_code=status.HTTP_400_BAD_REQUEST,
           detail="この予約は既に満席です"
       )
   ```

3. **`slots_filled`の更新**
   ```python
   # 社員名を追加
   if existing_employees:
       db_reservation.employee_names = f"{existing_employees}, {employee_data.employee_name}"
   else:
       db_reservation.employee_names = employee_data.employee_name
   
   # ✅ slots_filledを更新
   db_reservation.slots_filled = current_count + 1
   ```

3. **`time_slots`への指定枠割り当て**
   ```python
   # 社員が選択した枠番号に割り当て（employee_data.slot_number）
   if db_reservation.time_slots and employee_data.slot_number:
       slots = parse_time_slots(db_reservation.time_slots)  # JSON/文字列対応
       slot_index = employee_data.slot_number - 1
       
       # 枠が存在するかチェック
       if slot_index < 0 or slot_index >= len(slots):
           raise HTTPException(
               status_code=status.HTTP_400_BAD_REQUEST,
               detail=f"無効な枠番号です。有効範囲: 1-{len(slots)}"
           )
       
       # 既に埋まっているかチェック
       if slots[slot_index].get('is_filled', False):
           raise HTTPException(
               status_code=status.HTTP_400_BAD_REQUEST,
               detail=f"枠{employee_data.slot_number}は既に予約されています"
           )
       
       # 指定された枠に割り当て
       slots[slot_index]['employee_name'] = employee_data.employee_name
       slots[slot_index]['employee_department'] = employee_data.department
       slots[slot_index]['is_filled'] = True
       
       db_reservation.time_slots = slots
       flag_modified(db_reservation, 'time_slots')
   ```

4. **エラーハンドリング**
   - try-except追加
   - ロールバック処理
   - 詳細なエラーメッセージ

**所要時間**: 1-2時間

---

### フェーズ2: フロントエンド修正（優先度: 高）

#### 2.1 時間枠選択UIの実装

**ファイル**: `frontend/src/app/company/employee-bookings/page.tsx`

**修正内容:**

1. **予約選択から時間枠選択への流れを追加**
   ```typescript
   // State追加
   const [selectedSlot, setSelectedSlot] = useState<number | null>(null)
   
   // 予約詳細モーダルに時間枠一覧を表示
   const timeSlots = selectedReservation?.time_slots || []
   ```

2. **時間枠選択UI**
   ```typescript
   {/* 時間枠一覧 */}
   <div className="time-slots-list">
     {timeSlots.map((slot) => (
       <div 
         key={slot.slot} 
         className={`slot-card ${slot.is_filled ? 'filled' : 'available'}`}
       >
         <div className="slot-info">
           <span className="slot-number">枠{slot.slot}</span>
           <span className="slot-time">{slot.start_time}〜{slot.end_time}</span>
           <span className="slot-duration">({slot.duration}分)</span>
         </div>
         {slot.is_filled ? (
           <div className="slot-status filled">
             <i className="bi bi-x-circle"></i>
             予約済み ({slot.employee_name || slot.staff_name})
           </div>
         ) : (
           <button 
             className="btn btn-success"
             onClick={() => {
               setSelectedSlot(slot.slot)
               handleShowRegistration(selectedReservation)
             }}
           >
             <i className="bi bi-check-circle"></i>
             この枠で登録
           </button>
         )}
       </div>
     ))}
   </div>
   ```

3. **モックデータの削除**
   - 14-67行目のモックデータを削除
   - 85-108行目のコメントアウトを解除

4. **実際のAPIからデータ取得**
   ```typescript
   useEffect(() => {
     const fetchReservations = async () => {
       try {
         setLoading(true)
         // 募集中（recruiting）の予約のみ取得
         const allReservations = await reservationsApi.getAll()
         const recruiting = allReservations.filter(
           r => r.status === 'recruiting' && r.company_id === user?.company_id
         )
         setReservations(recruiting)
       } catch (err) {
         setError(err.message)
       } finally {
         setLoading(false)
       }
     }
     fetchReservations()
   }, [user?.company_id])
   ```

5. **API呼び出しの有効化（枠番号を含める）**
   - 178行目のコメントアウトを解除し、枠番号を追加
   ```typescript
   const employeeData: EmployeeRegistration = {
     employee_name: registrationForm.employee_name,
     department: registrationForm.department,
     position: registrationForm.position || undefined,
     phone: registrationForm.phone || undefined,
     email: registrationForm.email || undefined,
     notes: registrationForm.notes || undefined,
     slot_number: selectedSlot  // ← 追加
   }
   await reservationsApi.addEmployee(selectedReservation.id, employeeData)
   ```

6. **登録後のデータ再取得**
   ```typescript
   // 登録成功後、データを再取得
   await fetchReservations()
   ```

**所要時間**: 2-3時間

---

### フェーズ3: テストとデバッグ（優先度: 中）

#### 3.1 統合テスト

**テストシナリオ:**

1. **企業管理者による社員割り当て（パターン①）**
   - 予約詳細ページで社員を選択
   - 特定の時間枠に割り当て
   - `slots_filled`が増加することを確認
   - 満席時に割り当てが失敗することを確認

2. **社員による自己登録（パターン②）**
   - 社員用予約登録ページで予約を選択
   - 時間枠一覧から希望の枠を選択
   - 自分の情報を入力して登録
   - 選択した枠に割り当てられることを確認
   - `employee_names`に追加されることを確認
   - `slots_filled`が増加することを確認
   - 既に埋まっている枠は選択できないことを確認
   - 満席時に登録が失敗することを確認

3. **混在シナリオ**
   - パターン①で2名割り当て
   - パターン②で1名登録
   - 両方の情報が正しく反映されることを確認
   - 枠数の計算が正しいことを確認

**所要時間**: 2-3時間

---

## データの整合性管理

### 2つの登録方法によるデータの違い

| 項目 | ① 企業管理者が割り当て | ② 社員が自己登録 |
|------|----------------------|-----------------|
| **データソース** | 社員マスタ（Employeeテーブル） | フォーム入力 |
| **社員ID** | あり（`employee_id`） | なし |
| **詳細情報** | 部署、連絡先など | 部署、連絡先など |
| **時間枠選択** | 管理者が枠を指定 | **社員が空き枠から選択** |
| **`time_slots`** | 特定の枠に割り当て | **社員が選択した枠に割り当て** |
| **`employee_names`** | 社員名を追加 | 社員名を追加 |
| **`slots_filled`** | インクリメント | インクリメント |

### 整合性の保持方法

1. **枠数管理**
   - 両方式で`slots_filled`を確実に更新
   - `max_participants`との比較で満席判定

2. **社員名の管理**
   - `employee_names`はカンマ区切りで両方式の社員名を保持
   - 表示時は両方式の社員名を区別なく表示

3. **時間枠の管理**
   - パターン①: 特定の枠に割り当て（`employee_id`あり）
   - パターン②: 空いている枠に自動割り当て（`employee_id`なし）
   - `is_filled`フラグで枠の使用状況を管理

4. **重複防止**
   - 同じ社員名での重複登録をチェック
   - パターン①とパターン②で同じ社員が登録されないようにする

---

## UIの改善提案

### 予約詳細ページ（企業管理者向け）

**表示内容:**
- 時間枠ごとの社員割り当て状況
- 社員マスタから選択して割り当て
- 自己登録された社員も同じ画面で確認可能
- 区別表示: 
  - 管理者割り当て: 社員マスタから選択された社員
  - 自己登録: 社員が自分で登録した社員

**実装イメージ:**
```
枠1: 山田太郎（営業部）[管理者割り当て] 🔧
枠2: 佐藤花子（総務部）[自己登録] 👤
枠3: [空き] ➕
```

### 社員用予約登録ページ

**表示内容:**
- 募集中の予約一覧
- 各予約の時間枠一覧（空き枠のみ選択可能）
- 登録フォーム
- 既に登録済みの社員名（管理者割り当て + 自己登録）

**実装イメージ（2段階）:**

**ステップ1: 予約を選択**
```
予約ID: 123
日時: 2026/01/30 14:00〜16:00
空き枠: 1 / 3名
[詳細を見る]ボタン
```

**ステップ2: 時間枠を選択**
```
予約ID: 123 の時間枠選択

□ 枠1: 14:00〜14:30 (30分) ✅ 空き
   → [この枠で登録]

■ 枠2: 14:35〜15:05 (30分) ❌ 予約済み（山田太郎）
   → 選択不可

□ 枠3: 15:10〜15:40 (30分) ✅ 空き
   → [この枠で登録]
```

**ステップ3: 社員情報を入力**
```
選択した枠: 枠1 (14:00〜14:30)

氏名: [入力]
部署: [入力]
役職: [入力]（任意）
電話: [入力]（任意）
メール: [入力]（任意）
備考: [入力]（任意）

[登録する]ボタン
```

---

## セキュリティとアクセス制御

### アクセス権限

| ユーザー種別 | パターン① | パターン② | 予約詳細閲覧 |
|------------|----------|----------|-------------|
| 管理者（ADMIN） | ✅ 可能 | ❌ 不可 | ✅ 全て |
| 企業管理者（COMPANY） | ✅ 可能 | ❌ 不可 | ✅ 自社のみ |
| 一般社員 | ❌ 不可 | ✅ 可能 | ⚠️ 限定的 |

### 実装方法

1. **企業管理者の認証**
   - 既存の`get_company_user`依存関係を使用
   - 企業IDの一致を確認

2. **一般社員の認証（新規）**
   - 社員専用のログインは後のフェーズで実装
   - 当面は企業管理者アカウントでの操作を想定
   - または、共有アカウントでの登録

3. **データの分離**
   - 企業IDで予約をフィルタリング
   - 他社の予約は表示しない

---

## リスクと対策

### リスク1: 二重登録
**問題**: 管理者が割り当てた後、本人が自己登録してしまう

**対策**:
- 社員名での重複チェック（既に実装済み）
- UIで警告を表示
- 管理者割り当て済みの社員は自己登録ページで非表示

### リスク2: 枠数の不整合
**問題**: `slots_filled`と実際の登録数が一致しない

**対策**:
- 両方式で確実に`slots_filled`を更新
- 定期的な整合性チェック機能
- データベーストランザクションの適切な使用

### リスク3: 同時アクセス
**問題**: 複数の社員が同時に登録して満席を超える

**対策**:
- データベースレベルでの排他制御
- 楽観的ロック（バージョン管理）
- トランザクション内での満席チェック

---

## 実装スケジュール

### 即座に実装可能（1-2日）

| タスク | 所要時間 | 優先度 |
|--------|---------|--------|
| スキーマ拡張（slot_number追加） | 0.5時間 | 最高 |
| バックエンド修正 | 1-2時間 | 最高 |
| 時間枠選択UI実装 | 2-3時間 | 高 |
| API連携修正 | 1時間 | 高 |
| 基本テスト | 2-3時間 | 中 |
| ドキュメント更新 | 1時間 | 低 |

**合計**: 7.5-11.5時間（2日で完了可能）

### 将来的な拡張（オプション）

| 機能 | 所要時間 | 優先度 | 詳細 |
|------|---------|--------|------|
| 社員専用ログイン | 8-16時間 | 中 | 社員個別アカウント |
| LINE連携での自己登録 | 16-24時間 | 低 | LINE上で完結 |
| **通知機能（LINE/メール）** | **8-10時間** | **高** | **⭐ 推奨機能** |
| 管理者承認フロー | 8-12時間 | 低 | 承認制度導入 |

#### 通知機能の詳細

予約完了時に社員へ自動通知を送信する機能です。詳細は [`NOTIFICATION_SYSTEM_PLAN.md`](./NOTIFICATION_SYSTEM_PLAN.md) を参照してください。

**実現可能性**: ✅ 100%可能

**推奨方法**:
1. **LINE通知**（最推奨）
   - 到達率・開封率が高い（95%+）
   - リッチメッセージでUI/UXが良い
   - コストが非常に低い（月1,000通まで無料）
   - 実装時間: 2日

2. **メール通知**（補助）
   - LINE未連携の社員向け
   - コストがほぼ無料
   - 実装時間: 1日

**通知タイミング**:
- パターン①: 管理者が社員を割り当てた瞬間
- パターン②: 社員が予約登録を完了した瞬間
- オプション: 前日・当日リマインダー

**通知内容**:
- 📅 日時
- 🕐 時間
- 🏢 場所
- 💆 担当スタッフ
- 🔗 予約詳細へのリンク

---

## 結論

### ✅ 実現可能性: 100%

この2つの予約登録方法は技術的に完全に実現可能です。

**社員が時間枠を選択できる機能も完全に実現可能です。**

### 実装の容易性

- **パターン①（企業管理者）**: 既に実装済み・動作中
- **パターン②（社員が時間枠を選択）**: 50%完成、残り50%は2日で完了可能
  - バックエンド: スキーマ拡張 + 枠指定ロジック追加
  - フロントエンド: 時間枠選択UI追加 + API連携

### 推奨実装順序

1. **即実装**: `EmployeeRegistration`スキーマに`slot_number`追加
2. **即実装**: パターン②のバックエンド修正（枠指定ロジック + `slots_filled`更新）
3. **即実装**: パターン②のフロントエンド修正（時間枠選択UI + API有効化）
4. **テスト**: 両パターンの統合テスト
5. **デプロイ**: 本番環境へのデプロイ
6. **将来**: 社員専用ログイン、LINE連携など

### メリット

- 企業の運用スタイルに応じた柔軟な対応
- 管理者の負担軽減（社員の自主性を活かす）
- 参加率の向上（社員が自分で選べる）
- **社員が希望の時間帯を選択できる（利便性向上）**
- **時間帯の重複や調整が容易**
- **両方式で同じ`time_slots`を使用するため整合性が高い**

### 注意点

- データの整合性管理が重要
- 重複登録の防止
- 満席管理の徹底

---

## 社員による時間枠選択の実装詳細

### ユーザーフロー

```
1. 社員が予約登録ページにアクセス
   ↓
2. 募集中の予約一覧を表示
   ↓
3. 予約を選択して「詳細を見る」
   ↓
4. 時間枠一覧が表示される
   - ✅ 空き枠: 「この枠で登録」ボタン表示
   - ❌ 予約済み枠: グレーアウト + 予約者名表示
   ↓
5. 希望の空き枠を選択
   ↓
6. 登録フォーム表示（社員情報を入力）
   - 選択した枠の情報を表示（例: 枠1 14:00〜14:30）
   ↓
7. 「登録する」ボタンをクリック
   ↓
8. バックエンドで処理
   - 選択した枠が空いているか確認
   - 既に埋まっている場合はエラー
   - 問題なければ指定枠に割り当て
   ↓
9. 登録完了メッセージ表示
   ↓
10. 予約一覧に戻る（更新されたデータを表示）
```

### パターン①とパターン②の比較

| 機能 | ① 管理者が割り当て | ② 社員が選択 |
|------|------------------|-------------|
| **時間枠の選択** | 管理者が指定 | 社員が選択 |
| **データソース** | 社員マスタ | フォーム入力 |
| **社員ID** | あり | なし |
| **割り当て先** | `time_slots[指定枠]` | `time_slots[選択枠]` |
| **整合性** | 同じ`time_slots`配列を共有 | 同じ`time_slots`配列を共有 |
| **衝突防止** | `is_filled`フラグ | `is_filled`フラグ |

### 技術的な実現方法

#### バックエンド

```python
# EmployeeRegistrationスキーマ
class EmployeeRegistration(BaseModel):
    employee_name: str
    department: str
    slot_number: Optional[int] = None  # 社員が選択した枠番号

# add_employee_to_reservation関数
def add_employee_to_reservation(...):
    # 1. 枠番号が指定されているかチェック
    if not employee_data.slot_number:
        raise HTTPException(400, "枠番号を指定してください")
    
    # 2. time_slotsをパース
    slots = parse_time_slots(db_reservation.time_slots)
    
    # 3. 指定された枠が有効かチェック
    slot_index = employee_data.slot_number - 1
    if slot_index < 0 or slot_index >= len(slots):
        raise HTTPException(400, "無効な枠番号です")
    
    # 4. 既に埋まっているかチェック
    if slots[slot_index].get('is_filled', False):
        raise HTTPException(400, "その枠は既に予約されています")
    
    # 5. 指定された枠に割り当て
    slots[slot_index]['employee_name'] = employee_data.employee_name
    slots[slot_index]['employee_department'] = employee_data.department
    slots[slot_index]['is_filled'] = True
    
    # 6. 保存
    db_reservation.time_slots = slots
    db_reservation.slots_filled += 1
    db.commit()
```

#### フロントエンド

```typescript
// 時間枠選択UI
<div className="time-slots-grid">
  {timeSlots.map((slot) => (
    <div 
      key={slot.slot}
      className={`slot-card ${slot.is_filled ? 'occupied' : 'available'}`}
    >
      <div className="slot-header">
        <span className="slot-number">枠{slot.slot}</span>
        <span className="slot-time">
          {slot.start_time}〜{slot.end_time}
        </span>
      </div>
      
      {slot.is_filled ? (
        <div className="slot-occupied">
          <i className="bi bi-x-circle text-danger"></i>
          <span>予約済み</span>
          <small>{slot.employee_name || slot.staff_name}</small>
        </div>
      ) : (
        <button
          className="btn btn-success w-100"
          onClick={() => handleSelectSlot(slot.slot)}
        >
          <i className="bi bi-check-circle"></i>
          この枠で登録
        </button>
      )}
    </div>
  ))}
</div>

// 登録処理
const handleSubmit = async () => {
  const employeeData = {
    employee_name: form.name,
    department: form.department,
    slot_number: selectedSlot  // ← 選択した枠番号
  }
  
  await reservationsApi.addEmployee(reservationId, employeeData)
}
```

## 次のアクション

1. この計画をレビュー・承認
2. スキーマ拡張（`slot_number`追加）
3. バックエンド修正を実装
4. 時間枠選択UI実装
5. API連携実装
6. テストとデバッグ
7. 本番デプロイ

