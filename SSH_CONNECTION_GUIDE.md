# CursorからVPSへのSSH接続ガイド

## 方法1: CursorのSSH接続機能を使用（推奨）

CursorにはSSH接続機能が組み込まれています。

### 手順

1. **Cursorのコマンドパレットを開く**
   - `Cmd+Shift+P` (Mac) または `Ctrl+Shift+P` (Windows/Linux)

2. **"Remote-SSH: Connect to Host" を選択**

3. **接続情報を入力**
   ```
   root@162.43.15.173
   ```

4. **初回接続時**
   - フィンガープリントの確認が表示されたら `Yes` を選択
   - パスワードを入力（XサーバーVPSのrootパスワード）

5. **接続後**
   - 新しいウィンドウが開き、VPS上で作業できます
   - ターミナルも使用可能です

## 方法2: ターミナルから直接接続

### パスワード認証で接続

```bash
ssh root@162.43.15.173
```

初回接続時はフィンガープリントの確認が表示されます。`yes` を入力してください。

### SSH鍵認証を設定（パスワード不要にする）

```bash
# 1. SSH鍵を生成（まだない場合）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 2. 公開鍵をVPSにコピー
ssh-copy-id root@162.43.15.173

# 3. 接続テスト
ssh root@162.43.15.173
```

## 方法3: SSH設定ファイルを使用

`~/.ssh/config` ファイルを作成/編集：

```bash
Host oriental-vps
    HostName 162.43.15.173
    User root
    Port 22
    # IdentityFile ~/.ssh/id_ed25519  # SSH鍵を使用する場合
```

接続：

```bash
ssh oriental-vps
```

## 現在の状況確認

現在、SSH接続にはパスワード認証が必要なようです。

### 接続テスト

以下のコマンドで接続を試みてください：

```bash
ssh root@162.43.15.173
```

パスワードを入力すると接続できます。

## トラブルシューティング

### "Permission denied" エラー

- パスワードが間違っている
- SSH鍵の権限が正しくない（`chmod 600 ~/.ssh/id_ed25519`）
- VPS側でSSH設定が変更されている

### "Connection refused" エラー

- VPSが停止している
- ファイアウォールでSSHポート（22）がブロックされている

### 接続が遅い

- DNS解決の問題（IPアドレスを直接使用）
- ネットワークの問題

## 接続後の作業

接続できたら、以下のコマンドで環境変数を修正できます：

```bash
# フロントエンドの環境変数を修正
cd /var/www/oriental-synergy/frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://162.43.15.173:8000/api/v1
NEXT_TELEMETRY_DISABLED=1
NODE_ENV=production
EOF

# フロントエンドコンテナを再ビルド
cd /var/www/oriental-synergy
docker-compose -f docker-compose.production.yml stop frontend
docker-compose -f docker-compose.production.yml build frontend
docker-compose -f docker-compose.production.yml up -d frontend
```

