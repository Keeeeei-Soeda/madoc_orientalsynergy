# スタッフアカウントデバッグ作業

**作業期間**: 2026年1月23日  
**対象環境**: ローカル開発環境 + 本番環境（162.43.15.173）  
**対象アカウント**: スタッフ（staff1@example.com / 山田花子）

---

## 📋 作業サマリー

スタッフアカウントの各種UI/UX改善、機能実装、エラー修正を実施。オファー受諾・辞退機能の実装、ダッシュボードとマイページの仕様変更、シフト管理の改善を完了。

---

## 🔧 実施した修正内容

### 1. シフト管理画面の改善

#### 1.1 目玉アイコンの動作修正
**問題点**: シフト管理画面（`/staff/shifts`）の目玉アイコンを押しても何も起こらない

**修正内容**:
- 目玉アイコンを`button`から`Link`コンポーネントに変更
- オファー詳細ページ（`/staff/jobs/offers/[id]`）へのリンクを設定

**変更ファイル**:
```typescript
// frontend/src/app/staff/shifts/page.tsx
<Link 
  href={`/staff/jobs/offers/${assignment.id}`}
  className="btn btn-sm btn-outline-primary"
  title="詳細を見る"
>
  <i className="bi bi-eye"></i>
</Link>
```

#### 1.2 UIコンポーネントの削除
**削除した要素**:
- 確定業務数のサマリーカード
- 予定報酬合計のサマリーカード
- 今後の予定のサマリーカード

#### 1.3 ページネーションとソート機能
**実装内容**:
- 1ページあたり10件表示
- 最新順（降順）でソート
- ページネーションコントロールの追加

**変更ファイル**: `frontend/src/app/staff/shifts/page.tsx`

---

### 2. ダッシュボードの改善

#### 2.1 平均評価セクションの削除
**理由**: 評価機能が未実装のため

**変更ファイル**: `frontend/src/app/staff/dashboard/page.tsx`
```typescript
// 削除前
{ title: '平均評価', value: '4.8', icon: 'bi-star-fill', iconColor: 'warning' }

// 削除後（このStatCardを完全に削除）
```

#### 2.2 テキスト表記の変更
**変更内容**:
- 「今月の勤務日数」→「今月の勤務予定数」→「今月の勤務数」

**理由**: 実際にカウントしているのは確定済み（CONFIRMED）の案件数

#### 2.3 データ連携の実装

##### 今月の収入予定
**仕様**:
- 確定済み（CONFIRMED）の案件の報酬合計を表示
- 作業前の案件も含む
- データソース: `staffApi.getEarnings()`

##### 新しいオファー
**仕様**:
- pending状態のオファー数を表示
- 時間による絞り込みなし（24時間以内など）
- データソース: `assignmentsApi.getMyAssignments()`

##### 今後のシフト
**仕様**:
- 確定済みスケジュールを表示
- 表示項目: 日時、企業名・事務所名、時間
- 最大5件表示
- データソース: `assignmentsApi.getMyAssignments()` または `assignmentsApi.getStaffAssignments()`

##### 今月の勤務数
**仕様**:
- 確定済み（CONFIRMED）の案件数をカウント
- 完了（COMPLETED）は含まない
- データソース: `staffApi.getEarnings()` の `assignment_count`

**変更ファイル**: `frontend/src/app/staff/dashboard/page.tsx`

---

### 3. マイページの改善

#### 3.1 不要セクションの削除
**削除した要素**:
- 評価サマリーセクション（未実装機能）
- 給与明細セクション（未実装機能）

**残存する要素**:
- 基本情報セクション（全幅表示に変更）

**変更ファイル**: `frontend/src/app/staff/mypage/page.tsx`

---

### 4. オファー機能の実装

#### 4.1 バックエンドAPI実装

**エンドポイント追加**:
```python
# backend/app/api/v1/assignments.py

@router.post("/assignments/{assignment_id}/accept")
def accept_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # アサインメントのステータスをCONFIRMEDに変更
    return {"message": "アサインメントを受諾しました"}

@router.post("/assignments/{assignment_id}/reject")
def reject_assignment(
    assignment_id: int,
    rejection_data: RejectionReason,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # アサインメントのステータスをREJECTEDに変更
    return {"message": "アサインメントを辞退しました"}
```

#### 4.2 フロントエンドAPI連携

**変更ファイル**: `frontend/src/lib/api.ts`
```typescript
export const assignmentsApi = {
  // ... 既存メソッド
  acceptAssignment: (assignmentId: number) =>
    request<void>(`/assignments/${assignmentId}/accept`, {
      method: 'POST',
    }),
  rejectAssignment: (assignmentId: number, rejectionReason: string = '') =>
    request<void>(`/assignments/${assignmentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    }),
};
```

#### 4.3 オファー一覧ページの修正

**変更ファイル**: `frontend/src/app/staff/jobs/offers/page.tsx`

**実装内容**:
- 受諾・辞退ボタンからAPI呼び出し
- 操作後に`window.location.reload()`でページ再読み込み
- 辞退理由プロンプトの削除

```typescript
const handleRespond = async (assignmentId: number, accept: boolean) => {
  const message = accept ? 'このオファーを受諾しますか？' : 'このオファーを辞退しますか？';
  if (!confirm(message)) return;

  try {
    setResponding(true);

    if (accept) {
      await assignmentsApi.acceptAssignment(assignmentId);
    } else {
      await assignmentsApi.rejectAssignment(assignmentId);
    }

    alert(accept ? 'オファーを受諾しました！' : 'オファーを辞退しました。');

    // ページを再読み込みしてバッジと内容を更新
    window.location.reload();
  } catch (err: any) {
    // エラーハンドリング
  } finally {
    setResponding(false);
  }
};
```

#### 4.4 オファー詳細ページの修正

**変更ファイル**: `frontend/src/app/staff/jobs/offers/[id]/page.tsx`

**実装内容**:
- オファー一覧ページと同様の受諾・辞退処理
- 操作後のページ再読み込み

#### 4.5 サイドバーバッジの実装

**変更ファイル**: `frontend/src/components/layout/StaffSidebar.tsx`

**実装内容**:
- pendingオファー数を動的に取得
- バッジに表示
- 0件の場合は非表示

```typescript
const [pendingOffersCount, setPendingOffersCount] = useState<number>(0)

useEffect(() => {
  const fetchPendingOffers = async () => {
    try {
      const assignments = await assignmentsApi.getMyAssignments()
      const pendingCount = assignments.filter(a => a.status === 'pending').length
      setPendingOffersCount(pendingCount)
    } catch (err) {
      // エラーハンドリング
    }
  }
  fetchPendingOffers()
}, [])
```

#### 4.6 ヘッダー通知バッジの非表示

**変更ファイル**: `frontend/src/components/layout/StaffHeader.tsx`

**実装内容**:
- 通知機能が未実装のため、ベルアイコンのバッジを非表示化

---

### 5. エラーハンドリングの改善

#### 5.1 ハードコードURLの修正

**問題点**: 一部のファイルで`http://localhost:8000`がハードコーディングされていた

**修正ファイル**:
- `frontend/src/app/staff/jobs/offers/[id]/page.tsx`
- `frontend/src/app/admin/staff/new/page.tsx`

**修正内容**:
```typescript
// 修正前
const response = await fetch(`http://localhost:8000/api/v1/staff`)

// 修正後
const staffList = await staffApi.getAll()
```

#### 5.2 CORS設定の追加

**変更ファイル**: `backend/app/config.py`

**追加した許可オリジン**:
```python
BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://localhost:8000,http://162.43.15.173:3000,http://162.43.15.173:8000"
```

---

### 6. バックエンドデータ処理の改善

#### 6.1 time_slotsのJSON文字列パース

**問題点**: `time_slots`がJSON文字列として保存されており、正しくパースされていなかった

**変更ファイル**: `backend/app/api/v1/staff.py`

**修正内容**:
```python
if slot_number and reservation.time_slots:
    time_slots_data = reservation.time_slots
    if isinstance(time_slots_data, str):
        try:
            time_slots_data = json.loads(time_slots_data)
        except json.JSONDecodeError:
            time_slots_data = []
    
    if isinstance(time_slots_data, list):
        for slot in time_slots_data:
            slot_num = slot.get('slot') if isinstance(slot, dict) else getattr(slot, 'slot', None)
            if slot_num == slot_number:
                duration = slot.get('duration', 0) if isinstance(slot, dict) else getattr(slot, 'duration', 0)
                break
```

#### 6.2 給与計算ロジックの改善

**変更内容**:
- `assignment_count`のカウント条件を改善
- `duration > 0`の条件を削除し、月フィルターのみで判定
- `details`リストに全ての確定済み案件を含める（時給や勤務時間が0でも含める）

**変更ファイル**: `backend/app/api/v1/staff.py`

---

### 7. テストデータの作成

#### 7.1 作成したテストデータ

| データ名 | 目的 | 内容 |
|---------|------|------|
| test005 | 勤務数・収入予定の検証 | 1月の確定済み案件（staff1用） |
| test006 | 受諾テスト | pending状態のオファー（staff1用） |
| test007 | 辞退テスト | pending状態のオファー（staff1用） |
| test008 | 受諾テスト2 | pending状態のオファー（staff1用） |
| test009 | 辞退テスト2 | pending状態のオファー（staff1用） |
| test010 | 受諾テスト3 | pending状態のオファー（staff1用） |
| test011 | 辞退テスト3 | pending状態のオファー（staff1用） |

#### 7.2 テストデータ作成スクリプト

**作成ファイル**:
- `backend/create_test005_data.py`
- `backend/create_test006_007_data.py`
- `backend/create_test008_009_data.py`
- `backend/create_test010_011_data.py`
- `backend/check_test005_data.py`（データ確認用）
- `backend/fix_test005_data.py`（重複データ修正用）

---

## 🚀 デプロイ手順

### 本番環境へのデプロイ

#### 1. ファイルのアップロード
```bash
# フロントエンドファイル
scp -i oriental.pem frontend/src/app/staff/dashboard/page.tsx root@162.43.15.173:/root/madoc_line/frontend/src/app/staff/dashboard/
scp -i oriental.pem frontend/src/app/staff/mypage/page.tsx root@162.43.15.173:/root/madoc_line/frontend/src/app/staff/mypage/
scp -i oriental.pem frontend/src/app/staff/shifts/page.tsx root@162.43.15.173:/root/madoc_line/frontend/src/app/staff/shifts/
scp -i oriental.pem frontend/src/app/staff/jobs/offers/page.tsx root@162.43.15.173:/root/madoc_line/frontend/src/app/staff/jobs/offers/
scp -i oriental.pem frontend/src/app/staff/jobs/offers/[id]/page.tsx root@162.43.15.173:/root/madoc_line/frontend/src/app/staff/jobs/offers/[id]/
scp -i oriental.pem frontend/src/lib/api.ts root@162.43.15.173:/root/madoc_line/frontend/src/lib/
scp -i oriental.pem frontend/src/components/layout/StaffSidebar.tsx root@162.43.15.173:/root/madoc_line/frontend/src/components/layout/
scp -i oriental.pem frontend/src/components/layout/StaffHeader.tsx root@162.43.15.173:/root/madoc_line/frontend/src/components/layout/

# バックエンドファイル
scp -i oriental.pem backend/app/api/v1/assignments.py root@162.43.15.173:/root/oriental_synergy/backend/app/api/v1/
scp -i oriental.pem backend/app/api/v1/staff.py root@162.43.15.173:/root/oriental_synergy/backend/app/api/v1/
```

#### 2. フロントエンドの再ビルドと再起動
```bash
ssh -i oriental.pem root@162.43.15.173
cd /root/madoc_line
docker compose -f docker-compose.production.yml build --no-cache frontend
docker stop oriental_frontend_prod && docker rm oriental_frontend_prod
docker run -d --name oriental_frontend_prod --restart always -p 3000:3000 -e NODE_ENV=production -e NEXT_PUBLIC_API_URL=http://162.43.15.173:8000 madoc_line-frontend:latest
```

#### 3. バックエンドの再起動
```bash
docker restart oriental_backend_prod
```

#### 4. 動作確認
```bash
docker ps | grep -E 'frontend|backend'
docker logs --tail 20 oriental_frontend_prod
docker logs --tail 20 oriental_backend_prod
```

---

## ✅ テスト項目

### スタッフダッシュボード
- [x] 「今月の勤務数」が表示される
- [x] 「今月の収入予定」に確定済み案件の報酬合計が表示される
- [x] 「新しいオファー」にpending状態のオファー数が表示される
- [x] 「今後のシフト」に確定済みスケジュールが表示される
- [x] 平均評価が表示されない

### スタッフマイページ
- [x] 基本情報のみ表示される
- [x] 評価サマリーが表示されない
- [x] 給与明細が表示されない

### シフト管理
- [x] 目玉アイコンからオファー詳細ページに遷移できる
- [x] 確定業務数のサマリーカードが表示されない
- [x] 1ページあたり10件表示される
- [x] 最新順でソートされる

### オファー機能
- [x] サイドバーの「オファー」バッジにpending数が表示される
- [x] オファーを受諾できる
- [x] オファーを辞退できる
- [x] 辞退時に理由入力プロンプトが表示されない
- [x] 操作後にページが再読み込みされる
- [x] バッジが更新される
- [x] 0件になったらバッジが非表示になる

### 通知
- [x] ヘッダーのベルアイコンのバッジが非表示になっている

---

## 🐛 発見した問題と解決

### 問題1: 勤務予定数と実際の表示件数の不一致
**症状**: ダッシュボードで0件表示だが、シフト管理では1件表示

**原因**: 
- `duration > 0`の条件により、時給や勤務時間が未設定の案件がカウントされていなかった
- `time_slots`がJSON文字列として保存されており、正しくパースされていなかった

**解決**:
- `assignment_count`のカウント条件を月フィルターのみに変更
- `time_slots`のJSON文字列パース処理を追加

### 問題2: test005データの重複
**症状**: test005の予約データが複数作成され、誤った案件データが表示される

**原因**: スクリプトを複数回実行したため

**解決**:
- `backend/fix_test005_data.py`で古いデータを削除
- 最新のtest005データのみ残す

### 問題3: オファーバッジがリアルタイムで更新されない
**症状**: 受諾・辞退後もバッジの数字が変わらない

**原因**: カスタムイベントでの状態更新が不確実

**解決**:
- カスタムイベントを廃止
- 操作後に`window.location.reload()`でページ全体を再読み込み

### 問題4: 本番環境でビルドエラー
**症状**: `company.name`プロパティが存在しないエラー

**原因**: バックエンドが`company_name`フィールドを返すが、一部のファイルで`name`を参照していた

**解決**:
- 全ての`company.name`を`company.company_name`に置換
- `frontend/src/app/admin/companies/page.tsx`
- `frontend/src/app/admin/reservations/page.tsx`
- `frontend/src/app/admin/reservations/new/page.tsx`
- `frontend/src/app/admin/reservations/[id]/edit/page.tsx`

---

## 📊 変更ファイル一覧

### フロントエンド

#### ページコンポーネント
- `frontend/src/app/staff/dashboard/page.tsx` - ダッシュボード改善
- `frontend/src/app/staff/mypage/page.tsx` - マイページ改善
- `frontend/src/app/staff/shifts/page.tsx` - シフト管理改善
- `frontend/src/app/staff/jobs/offers/page.tsx` - オファー一覧機能実装
- `frontend/src/app/staff/jobs/offers/[id]/page.tsx` - オファー詳細機能実装

#### レイアウトコンポーネント
- `frontend/src/components/layout/StaffSidebar.tsx` - バッジ実装
- `frontend/src/components/layout/StaffHeader.tsx` - 通知バッジ非表示

#### APIクライアント
- `frontend/src/lib/api.ts` - accept/reject APIメソッド追加

#### 管理画面（company.name → company.company_name）
- `frontend/src/app/admin/companies/page.tsx`
- `frontend/src/app/admin/reservations/page.tsx`
- `frontend/src/app/admin/reservations/new/page.tsx`
- `frontend/src/app/admin/reservations/[id]/edit/page.tsx`

### バックエンド

#### APIエンドポイント
- `backend/app/api/v1/assignments.py` - accept/reject エンドポイント追加
- `backend/app/api/v1/staff.py` - time_slotsパース処理、給与計算ロジック改善

#### 設定
- `backend/app/config.py` - CORS設定追加

#### テストデータスクリプト
- `backend/create_test005_data.py`
- `backend/create_test006_007_data.py`
- `backend/create_test008_009_data.py`
- `backend/create_test010_011_data.py`
- `backend/check_test005_data.py`
- `backend/fix_test005_data.py`

### Docker設定
- `docker-compose.production.yml` - 本番環境設定（変更なし、参照のみ）

---

## 🔗 関連ドキュメント

- [認証実装完了ドキュメント](./AUTH_IMPLEMENTATION_COMPLETE.md)
- [予約システムアップデート](./RESERVATION_SYSTEM_UPDATE.md)
- [フロントエンドビルドエラー修正](./FRONTEND_BUILD_ERRORS_FIX.md)
- [テストガイド](./TESTING_GUIDE.md)

---

## 📝 備考

### テストアカウント情報

**スタッフアカウント（山田花子）**:
- Email: `staff1@example.com`
- Password: `password123`
- スタッフID: 1
- ユーザーID: 4

### 本番環境URL

- フロントエンド: http://162.43.15.173:3000
- バックエンドAPI: http://162.43.15.173:8000
- APIドキュメント: http://162.43.15.173:8000/api/docs

### デプロイ先サーバー

- IP: 162.43.15.173
- OS: Ubuntu 22.04 LTS
- SSH鍵: oriental.pem
- フロントエンドディレクトリ: `/root/madoc_line`
- バックエンドディレクトリ: `/root/oriental_synergy`

---

**作成日**: 2026年1月23日  
**最終更新**: 2026年1月23日  
**作成者**: AI Assistant

