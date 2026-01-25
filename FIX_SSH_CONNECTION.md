# SSH接続エラーの解決方法

## 🔴 エラー内容
```
root@162.43.15.173: Permission denied (publickey,password).
```

このエラーは以下のいずれかが原因です：

## 解決策1: XサーバーVPSパネルからパスワード再設定（推奨）

### 手順

1. **XサーバーVPSパネルにログイン**
   - URL: https://secure.xserver.ne.jp/xvps_login.php
   - Xserverアカウントでログイン

2. **VPS管理画面を開く**
   - 契約一覧から「VPS」タブを選択
   - サーバー名「oriental」をクリック

3. **パスワードを再設定**
   - 左メニューから「パスワード変更」をクリック
   - 新しいパスワードを設定（8文字以上、英数字記号を含む）
   - 「確定する」をクリック

4. **再度SSH接続を試す**
   ```bash
   ssh root@162.43.15.173
   ```
   新しいパスワードを入力

---

## 解決策2: XサーバーVPSコンソールから確認

XサーバーVPSには**ブラウザベースのコンソール**があります。

### 手順

1. **XサーバーVPSパネル**にログイン

2. **VPSコンソールを開く**
   - サーバー名「oriental」の管理画面
   - 「コンソール」または「VNCコンソール」をクリック

3. **ブラウザ上でログイン**
   - ユーザー名: `root`
   - パスワード: XサーバーVPSのパスワード

4. **SSH設定を確認**
   ```bash
   # SSH設定ファイルを確認
   cat /etc/ssh/sshd_config | grep PermitRootLogin
   cat /etc/ssh/sshd_config | grep PasswordAuthentication
   ```

5. **rootログインが無効な場合、有効化**
   ```bash
   sudo nano /etc/ssh/sshd_config
   
   # 以下を変更または追加
   PermitRootLogin yes
   PasswordAuthentication yes
   
   # SSH再起動
   sudo systemctl restart sshd
   ```

6. **ローカル環境から再度接続**
   ```bash
   ssh root@162.43.15.173
   ```

---

## 解決策3: 一般ユーザーでログイン（rootが無効な場合）

rootログインが無効化されている場合、一般ユーザーを使用します。

### XサーバーVPSでユーザーを確認

1. **VPSコンソール**でログイン（ブラウザ）

2. **ユーザー一覧を確認**
   ```bash
   cat /etc/passwd | grep "/home"
   ```

3. **一般ユーザーが存在する場合**
   ```bash
   # 例: xvpsuser というユーザーがある場合
   ssh xvpsuser@162.43.15.173
   ```

4. **ログイン後、rootに切り替え**
   ```bash
   sudo su -
   ```

---

## 解決策4: XサーバーVPSサポートに問い合わせ

上記の方法で解決しない場合：

### サポートへの問い合わせ

1. **Xサーバーサポートページ**
   - https://www.xserver.ne.jp/support/

2. **サポートチケット作成**
   - 「VPS」カテゴリを選択
   - 問題内容:
     ```
     VPS（IP: 162.43.15.173）にSSH接続ができません。
     エラー: Permission denied (publickey,password)
     
     以下を確認させていただきたいです：
     - rootでのSSHログインは有効ですか？
     - 初期パスワードは何ですか？
     - SSH接続の設定方法を教えてください。
     ```

---

## 代替案: Xサーバー側でデプロイ作業を行う

SSH接続が難しい場合、XサーバーVPSのコンソールから直接作業できます。

### 手順

1. **XサーバーVPSコンソール**でログイン（ブラウザ）

2. **ファイルをダウンロード**
   ```bash
   # Gitがインストールされている場合
   cd /var/www
   mkdir oriental-synergy
   cd oriental-synergy
   
   # または、wgetでファイルを1つずつダウンロード
   # （GitHubやDropboxにアップロードしておく）
   ```

3. **手動でファイルを配置**
   - XサーバーVPSのファイルマネージャーを使用
   - FTPでファイルをアップロード

---

## トラブルシューティング

### SSHポートが開いているか確認

```bash
# ローカル環境で実行
nc -zv 162.43.15.173 22
```

出力例：
- 成功: `Connection to 162.43.15.173 22 port [tcp/ssh] succeeded!`
- 失敗: `Connection refused` または `timeout`

### SSH詳細ログで確認

```bash
ssh -vvv root@162.43.15.173
```

このコマンドで詳細なエラー情報が表示されます。

---

## 次のステップ

1. **まず**: XサーバーVPSパネルでパスワードを再設定
2. **それでもダメなら**: VPSコンソールでSSH設定を確認
3. **最終手段**: XサーバーVPSコンソールから直接デプロイ作業

---

## 参考: XサーバーVPS公式ドキュメント

- SSH接続方法: https://vps.xserver.ne.jp/support/manual/man_server_ssh.php
- VPSコンソール: https://vps.xserver.ne.jp/support/manual/man_server_console.php






