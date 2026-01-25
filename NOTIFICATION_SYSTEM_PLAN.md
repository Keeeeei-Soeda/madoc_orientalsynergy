# 社員通知システム実装計画

## 概要

予約完了時に社員へ自動通知を送信するシステムの実装計画です。

### 通知タイミング

1. **パターン①（管理者が社員を割り当て）**
   - 管理者が社員マスタから選択して時間枠に割り当てた瞬間
   - 通知内容: 「予約に割り当てられました」

2. **パターン②（社員が自己登録）**
   - 社員が予約登録を完了した瞬間
   - 通知内容: 「予約登録が完了しました」

### 通知方法の選択肢

| 通知方法 | 実現可能性 | 実装難易度 | コスト | 到達率 | 推奨度 |
|---------|-----------|-----------|--------|--------|--------|
| **LINE通知** | ✅ 可能 | 中 | 無料 | 高（95%+） | ⭐⭐⭐⭐⭐ |
| **メール通知** | ✅ 可能 | 低 | 低 | 中（70%） | ⭐⭐⭐ |
| **SMS通知** | ✅ 可能 | 中 | 高 | 高（98%） | ⭐⭐ |
| **アプリ内通知** | ✅ 可能 | 低 | 無料 | 低（要ログイン） | ⭐⭐ |

---

## 1. LINE通知（最推奨）

### 実現可能性: ✅ 100%可能

LINEは日本で最も使われているメッセージアプリで、到達率・開封率が非常に高いです。

### 前提条件

1. **LINE Messaging APIの利用**
   - LINE Developersアカウント登録（無料）
   - Messaging APIチャネル作成
   - 月1,000通まで無料（それ以降も格安）

2. **社員のLINE連携**
   - 社員がLINE公式アカウントを友だち追加
   - 社員情報に`line_user_id`を保存

### 実装方法

#### A. LINE Messaging API（プッシュ通知）

**最も推奨される方法**

```python
# backend/app/services/line_notifier.py

import requests
from typing import Optional

class LineNotifier:
    def __init__(self, channel_access_token: str):
        self.channel_access_token = channel_access_token
        self.api_url = "https://api.line.me/v2/bot/message/push"
    
    def send_reservation_notification(
        self,
        line_user_id: str,
        reservation: dict,
        slot: dict
    ) -> bool:
        """予約完了通知を送信"""
        
        message = {
            "type": "flex",
            "altText": "予約が確定しました",
            "contents": {
                "type": "bubble",
                "header": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "予約完了通知",
                            "weight": "bold",
                            "size": "xl",
                            "color": "#FFFFFF"
                        }
                    ],
                    "backgroundColor": "#06C755"
                },
                "body": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "text",
                            "text": "予約が確定しました",
                            "weight": "bold",
                            "size": "lg",
                            "margin": "md"
                        },
                        {
                            "type": "separator",
                            "margin": "lg"
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": f"📅 日時",
                                    "color": "#999999",
                                    "size": "sm"
                                },
                                {
                                    "type": "text",
                                    "text": f"{reservation['reservation_date']}",
                                    "weight": "bold",
                                    "size": "md",
                                    "margin": "xs"
                                },
                                {
                                    "type": "text",
                                    "text": f"🕐 {slot['start_time']}〜{slot['end_time']} ({slot['duration']}分)",
                                    "size": "md",
                                    "margin": "xs"
                                }
                            ],
                            "margin": "lg"
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "🏢 場所",
                                    "color": "#999999",
                                    "size": "sm"
                                },
                                {
                                    "type": "text",
                                    "text": reservation['office_name'],
                                    "weight": "bold",
                                    "size": "md",
                                    "margin": "xs",
                                    "wrap": True
                                },
                                {
                                    "type": "text",
                                    "text": reservation['office_address'],
                                    "size": "sm",
                                    "color": "#999999",
                                    "margin": "xs",
                                    "wrap": True
                                }
                            ],
                            "margin": "lg"
                        },
                        {
                            "type": "box",
                            "layout": "vertical",
                            "contents": [
                                {
                                    "type": "text",
                                    "text": "💆 担当スタッフ",
                                    "color": "#999999",
                                    "size": "sm"
                                },
                                {
                                    "type": "text",
                                    "text": slot.get('staff_name', '調整中'),
                                    "weight": "bold",
                                    "size": "md",
                                    "margin": "xs"
                                }
                            ],
                            "margin": "lg"
                        }
                    ]
                },
                "footer": {
                    "type": "box",
                    "layout": "vertical",
                    "contents": [
                        {
                            "type": "button",
                            "action": {
                                "type": "uri",
                                "label": "予約を確認",
                                "uri": f"https://yourapp.com/reservations/{reservation['id']}"
                            },
                            "style": "primary",
                            "color": "#06C755"
                        }
                    ]
                }
            }
        }
        
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.channel_access_token}"
        }
        
        payload = {
            "to": line_user_id,
            "messages": [message]
        }
        
        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                json=payload,
                timeout=10
            )
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"LINE通知エラー: {e}")
            return False
```

#### B. 予約完了時の通知呼び出し

```python
# backend/app/api/v1/reservations.py

from ..services.line_notifier import LineNotifier
from ..config import settings

# パターン①: 管理者が社員を割り当て
@router.post("/reservations/{reservation_id}/assign-employee")
def assign_employee_to_slot(...):
    # ... 既存の割り当て処理 ...
    
    # LINE通知を送信
    if employee.line_user_id:  # LINE IDが登録されている場合
        line_notifier = LineNotifier(settings.LINE_CHANNEL_ACCESS_TOKEN)
        slot_info = slots[slot_index]
        line_notifier.send_reservation_notification(
            line_user_id=employee.line_user_id,
            reservation=db_reservation.__dict__,
            slot=slot_info
        )
    
    return db_reservation

# パターン②: 社員が自己登録
@router.post("/reservations/{reservation_id}/employees")
def add_employee_to_reservation(...):
    # ... 既存の登録処理 ...
    
    # LINE通知を送信（社員情報にLINE IDがある場合）
    if employee_data.line_user_id:
        line_notifier = LineNotifier(settings.LINE_CHANNEL_ACCESS_TOKEN)
        slot_info = slots[slot_index]
        line_notifier.send_reservation_notification(
            line_user_id=employee_data.line_user_id,
            reservation=db_reservation.__dict__,
            slot=slot_info
        )
    
    return db_reservation
```

### LINE連携の流れ

```
1. 企業がLINE公式アカウントを作成
   ↓
2. 社員がLINE公式アカウントを友だち追加
   ↓
3. Webhook経由で社員のLINE User IDを取得
   ↓
4. 社員マスタ（Employee）にLINE User IDを保存
   ↓
5. 予約完了時にLINE User ID宛に通知を送信
```

### 実装スケジュール（LINE通知）

| タスク | 所要時間 | 優先度 |
|--------|---------|--------|
| LINE Developers設定 | 1時間 | 高 |
| LINE Notifierサービス実装 | 2-3時間 | 高 |
| Webhook実装（友だち追加時） | 2-3時間 | 中 |
| Employeeモデルに`line_user_id`追加 | 0.5時間 | 高 |
| 予約完了時の通知呼び出し | 1時間 | 高 |
| テスト | 2時間 | 中 |

**合計**: 8.5-10.5時間（2日で完了可能）

**コスト**: 月1,000通まで無料、以降は1通あたり約0.15円

---

## 2. メール通知

### 実現可能性: ✅ 100%可能

メールはコストが低く、実装も簡単ですが、開封率が低い傾向があります。

### 前提条件

1. **SMTPサーバーの設定**
   - Gmailアプリパスワード（無料）
   - SendGrid（月100通まで無料）
   - Amazon SES（月62,000通まで無料）
   - Mailgun（月5,000通まで無料）

2. **社員のメールアドレス**
   - 社員情報に`email`フィールド（既に実装済み）

### 実装方法

```python
# backend/app/services/email_notifier.py

from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib
from typing import Optional

class EmailNotifier:
    def __init__(self, smtp_host: str, smtp_port: int, username: str, password: str):
        self.smtp_host = smtp_host
        self.smtp_port = smtp_port
        self.username = username
        self.password = password
    
    def send_reservation_notification(
        self,
        to_email: str,
        employee_name: str,
        reservation: dict,
        slot: dict
    ) -> bool:
        """予約完了通知を送信"""
        
        subject = "【オリエンタルシナジー】予約が確定しました"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #06C755; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .info-row {{ margin: 15px 0; }}
                .label {{ font-weight: bold; color: #333; }}
                .value {{ color: #555; }}
                .footer {{ padding: 20px; text-align: center; color: #999; font-size: 12px; }}
                .button {{ 
                    display: inline-block; 
                    padding: 12px 24px; 
                    background-color: #06C755; 
                    color: white; 
                    text-decoration: none; 
                    border-radius: 5px; 
                    margin-top: 20px;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>予約完了通知</h1>
                </div>
                <div class="content">
                    <p>{employee_name} 様</p>
                    <p>マッサージの予約が確定しました。</p>
                    
                    <div class="info-row">
                        <span class="label">📅 日時:</span>
                        <span class="value">{reservation['reservation_date']}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">🕐 時間:</span>
                        <span class="value">{slot['start_time']}〜{slot['end_time']} ({slot['duration']}分)</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">🏢 場所:</span>
                        <span class="value">{reservation['office_name']}<br>{reservation['office_address']}</span>
                    </div>
                    
                    <div class="info-row">
                        <span class="label">💆 担当スタッフ:</span>
                        <span class="value">{slot.get('staff_name', '調整中')}</span>
                    </div>
                    
                    <div style="text-align: center;">
                        <a href="https://yourapp.com/reservations/{reservation['id']}" class="button">
                            予約を確認
                        </a>
                    </div>
                </div>
                <div class="footer">
                    <p>このメールは自動送信されています。</p>
                    <p>© 2026 Oriental Synergy</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = self.username
        msg['To'] = to_email
        
        html_part = MIMEText(html_body, 'html', 'utf-8')
        msg.attach(html_part)
        
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.username, self.password)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"メール送信エラー: {e}")
            return False
```

### 実装スケジュール（メール通知）

| タスク | 所要時間 | 優先度 |
|--------|---------|--------|
| SMTP設定 | 1時間 | 高 |
| Email Notifierサービス実装 | 2時間 | 高 |
| HTMLテンプレート作成 | 1-2時間 | 中 |
| 予約完了時の通知呼び出し | 1時間 | 高 |
| テスト | 1時間 | 中 |

**合計**: 6-7時間（1日で完了可能）

**コスト**: ほぼ無料（多くのサービスで月数千通まで無料）

---

## 3. SMS通知

### 実現可能性: ✅ 可能だがコストが高い

到達率・開封率は最も高いですが、コストがかかります。

### サービス

- **Twilio**: 1通あたり約8円
- **AWS SNS**: 1通あたり約10円
- **KDDI Message Cast**: 1通あたり約9円

### 実装方法

```python
# backend/app/services/sms_notifier.py

from twilio.rest import Client

class SMSNotifier:
    def __init__(self, account_sid: str, auth_token: str, from_number: str):
        self.client = Client(account_sid, auth_token)
        self.from_number = from_number
    
    def send_reservation_notification(
        self,
        to_phone: str,
        employee_name: str,
        reservation: dict,
        slot: dict
    ) -> bool:
        """予約完了通知を送信"""
        
        message = f"""
【オリエンタルシナジー】
{employee_name}様

予約が確定しました。

日時: {reservation['reservation_date']}
時間: {slot['start_time']}〜{slot['end_time']}
場所: {reservation['office_name']}
スタッフ: {slot.get('staff_name', '調整中')}

詳細: https://yourapp.com/r/{reservation['id']}
        """.strip()
        
        try:
            self.client.messages.create(
                body=message,
                from_=self.from_number,
                to=to_phone
            )
            return True
        except Exception as e:
            print(f"SMS送信エラー: {e}")
            return False
```

### 実装スケジュール（SMS通知）

| タスク | 所要時間 | 優先度 |
|--------|---------|--------|
| Twilio設定 | 1時間 | 高 |
| SMS Notifierサービス実装 | 2時間 | 高 |
| 予約完了時の通知呼び出し | 1時間 | 高 |
| テスト | 1時間 | 中 |

**合計**: 5時間（1日以内で完了可能）

**コスト**: 1通あたり約8-10円（月間使用量により変動）

---

## 4. アプリ内通知

### 実現可能性: ✅ 可能

社員がログインしている場合のみ表示される通知です。

### 実装方法

```python
# backend/app/models/notification.py

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database import Base

class Notification(Base):
    """通知テーブル"""
    __tablename__ = "notifications"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
```

```typescript
// frontend/src/components/notifications/NotificationBell.tsx

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  useEffect(() => {
    // 未読通知を取得
    const fetchNotifications = async () => {
      const data = await notificationsApi.getUnread()
      setNotifications(data)
      setUnreadCount(data.length)
    }
    fetchNotifications()
  }, [])
  
  return (
    <div className="notification-bell">
      <button className="btn btn-link position-relative">
        <i className="bi bi-bell fs-4"></i>
        {unreadCount > 0 && (
          <span className="badge bg-danger position-absolute top-0 start-100 translate-middle">
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
```

---

## 推奨実装プラン

### フェーズ1: LINE通知（最優先）

**理由:**
- 日本で最も使われているメッセージアプリ
- 到達率・開封率が非常に高い
- リッチメッセージでUI/UXが良い
- コストが非常に低い（月1,000通まで無料）

**実装順序:**
1. LINE Developers設定
2. LINE Notifierサービス実装
3. Employeeモデルに`line_user_id`追加
4. 友だち追加時のWebhook実装
5. 予約完了時の通知呼び出し
6. テスト

**所要時間**: 2日

---

### フェーズ2: メール通知（補助）

**理由:**
- LINE未連携の社員向け
- コストが低い
- 実装が簡単

**実装順序:**
1. SMTP設定
2. Email Notifierサービス実装
3. HTMLテンプレート作成
4. 予約完了時の通知呼び出し
5. テスト

**所要時間**: 1日

---

### フェーズ3: アプリ内通知（オプション）

**理由:**
- 通知履歴の確認
- ログイン時のリマインダー

**実装順序:**
1. Notificationモデル作成
2. 通知API実装
3. 通知ベルコンポーネント実装
4. テスト

**所要時間**: 1日

---

## 通知の優先順位ロジック

```python
def send_notification(employee: Employee, reservation: dict, slot: dict):
    """通知を送信（優先順位に基づいて）"""
    
    notification_sent = False
    
    # 1. LINE通知を試行（最優先）
    if employee.line_user_id:
        try:
            line_notifier = LineNotifier(settings.LINE_CHANNEL_ACCESS_TOKEN)
            if line_notifier.send_reservation_notification(
                employee.line_user_id, reservation, slot
            ):
                notification_sent = True
                print(f"LINE通知送信成功: {employee.name}")
        except Exception as e:
            print(f"LINE通知送信失敗: {e}")
    
    # 2. メール通知を試行（LINE失敗時またはLINE未連携時）
    if not notification_sent and employee.email:
        try:
            email_notifier = EmailNotifier(
                smtp_host=settings.SMTP_HOST,
                smtp_port=settings.SMTP_PORT,
                username=settings.SMTP_USERNAME,
                password=settings.SMTP_PASSWORD
            )
            if email_notifier.send_reservation_notification(
                employee.email, employee.name, reservation, slot
            ):
                notification_sent = True
                print(f"メール通知送信成功: {employee.name}")
        except Exception as e:
            print(f"メール通知送信失敗: {e}")
    
    # 3. アプリ内通知を作成（必ず）
    create_in_app_notification(employee.id, reservation, slot)
    
    return notification_sent
```

---

## データモデルの拡張

### Employeeモデル（社員マスタ）

```python
class Employee(Base):
    """社員テーブル"""
    __tablename__ = "employees"
    
    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    name = Column(String(100), nullable=False)
    department = Column(String(100))
    position = Column(String(100))
    phone = Column(String(20))
    email = Column(String(255))  # ✅ 既に存在
    
    # 通知用フィールド（追加）
    line_user_id = Column(String(255), unique=True, nullable=True)  # ← 追加
    notification_preference = Column(String(50), default="line")  # line/email/both/none
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
```

### EmployeeRegistrationスキーマ（社員自己登録）

```python
class EmployeeRegistration(BaseModel):
    """社員の予約登録スキーマ"""
    employee_name: str
    department: str
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None  # ✅ 既に存在
    line_user_id: Optional[str] = None  # ← 追加（社員がLINE連携済みの場合）
    slot_number: Optional[int] = None
    notes: Optional[str] = None
```

---

## 通知内容のカスタマイズ

### 通知の種類

1. **予約確定通知**
   - タイミング: 予約完了時
   - 内容: 日時、場所、担当スタッフ

2. **前日リマインダー**
   - タイミング: 予約前日の18:00
   - 内容: 明日の予約のリマインド

3. **当日リマインダー**
   - タイミング: 予約当日の2時間前
   - 内容: 今日の予約のリマインド

4. **担当スタッフ確定通知**
   - タイミング: スタッフがアサインされた時
   - 内容: 担当スタッフの情報

5. **予約変更通知**
   - タイミング: 予約が変更された時
   - 内容: 変更内容

6. **予約キャンセル通知**
   - タイミング: 予約がキャンセルされた時
   - 内容: キャンセル理由

---

## コスト試算

### 月間100件の予約の場合（社員100名）

| 通知方法 | 1通あたり | 月間コスト | 年間コスト |
|---------|---------|-----------|-----------|
| **LINE** | 無料（1,000通まで） | ¥0 | ¥0 |
| **メール** | 無料（SendGrid） | ¥0 | ¥0 |
| **SMS** | ¥8 | ¥800 | ¥9,600 |

### 月間1,000件の予約の場合（社員1,000名）

| 通知方法 | 1通あたり | 月間コスト | 年間コスト |
|---------|---------|-----------|-----------|
| **LINE** | ¥0.15（1,000通超） | ¥150 | ¥1,800 |
| **メール** | 無料（SendGrid） | ¥0 | ¥0 |
| **SMS** | ¥8 | ¥8,000 | ¥96,000 |

**推奨**: LINE + メールの組み合わせ（コスト効率が最高）

---

## セキュリティとプライバシー

### 個人情報保護

1. **通知内容の最小化**
   - 詳細情報はアプリ内で確認
   - 通知には最小限の情報のみ

2. **オプトイン/オプトアウト**
   - 社員が通知の受信を選択可能
   - 通知設定画面を提供

3. **LINE User IDの管理**
   - 暗号化して保存
   - 退職時に削除

---

## まとめ

### ✅ 完全に実現可能

社員への通知機能は技術的に完全に実現可能です。

### 推奨実装順序

1. **最優先**: LINE通知（2日）
2. **次**: メール通知（1日）
3. **オプション**: アプリ内通知（1日）

### メリット

- ✅ 社員の予約忘れを防止
- ✅ 到達率・開封率が高い
- ✅ ユーザー体験の向上
- ✅ 予約のキャンセル率低減
- ✅ コストが非常に低い

### 次のステップ

1. LINE Developersアカウント作成
2. LINE Messaging APIチャネル作成
3. LINE Notifierサービス実装
4. テストと検証
5. 本番デプロイ

