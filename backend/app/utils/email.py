"""
メール送信ユーティリティ
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List
from ..config import settings


def send_email(
    to_email: str | List[str],
    subject: str,
    body: str,
    html: str = None
):
    """
    メールを送信する
    
    Args:
        to_email: 送信先メールアドレス（文字列またはリスト）
        subject: 件名
        body: 本文（プレーンテキスト）
        html: HTML本文（オプション）
    """
    # メール送信が無効な場合はスキップ
    if not settings.SMTP_HOST:
        print(f"📧 メール送信（スキップ）: {to_email} - {subject}")
        return
    
    # 送信先が文字列の場合はリストに変換
    if isinstance(to_email, str):
        to_email = [to_email]
    
    # メールメッセージの作成
    msg = MIMEMultipart('alternative')
    msg['From'] = settings.SMTP_FROM_EMAIL
    msg['To'] = ', '.join(to_email)
    msg['Subject'] = subject
    
    # プレーンテキスト
    part1 = MIMEText(body, 'plain')
    msg.attach(part1)
    
    # HTML（オプション）
    if html:
        part2 = MIMEText(html, 'html')
        msg.attach(part2)
    
    try:
        # SMTPサーバーに接続
        if settings.SMTP_TLS:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT)
        
        # ログイン
        if settings.SMTP_USER and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        
        # メール送信
        server.sendmail(settings.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        
        print(f"✅ メール送信成功: {to_email} - {subject}")
        
    except Exception as e:
        print(f"❌ メール送信エラー: {e}")
        raise


def send_reservation_created_email(to_email: str, reservation_data: dict):
    """予約作成通知メール"""
    subject = "【Oriental Synergy】予約が作成されました"
    
    body = f"""
{reservation_data['company_name']} 様

予約が作成されました。

予約ID: {reservation_data['id']}
予約日: {reservation_data['reservation_date']}
時間: {reservation_data['start_time']} - {reservation_data['end_time']}
場所: {reservation_data['office_name']}

詳細は管理画面からご確認ください。

Oriental Synergy
    """
    
    html = f"""
<html>
<body>
<h2>{reservation_data['company_name']} 様</h2>
<p>予約が作成されました。</p>
<table border="1" cellpadding="10">
    <tr><th>予約ID</th><td>{reservation_data['id']}</td></tr>
    <tr><th>予約日</th><td>{reservation_data['reservation_date']}</td></tr>
    <tr><th>時間</th><td>{reservation_data['start_time']} - {reservation_data['end_time']}</td></tr>
    <tr><th>場所</th><td>{reservation_data['office_name']}</td></tr>
</table>
<p>詳細は管理画面からご確認ください。</p>
<p>Oriental Synergy</p>
</body>
</html>
    """
    
    send_email(to_email, subject, body, html)


def send_staff_assigned_email(to_email: str, assignment_data: dict):
    """スタッフアサイン通知メール"""
    subject = "【Oriental Synergy】新しい予約にアサインされました"
    
    body = f"""
{assignment_data['staff_name']} 様

新しい予約にアサインされました。

予約ID: {assignment_data['reservation_id']}
企業名: {assignment_data['company_name']}
予約日: {assignment_data['reservation_date']}
時間: {assignment_data['start_time']} - {assignment_data['end_time']}
場所: {assignment_data['office_address']}

詳細は管理画面からご確認ください。

Oriental Synergy
    """
    
    html = f"""
<html>
<body>
<h2>{assignment_data['staff_name']} 様</h2>
<p>新しい予約にアサインされました。</p>
<table border="1" cellpadding="10">
    <tr><th>予約ID</th><td>{assignment_data['reservation_id']}</td></tr>
    <tr><th>企業名</th><td>{assignment_data['company_name']}</td></tr>
    <tr><th>予約日</th><td>{assignment_data['reservation_date']}</td></tr>
    <tr><th>時間</th><td>{assignment_data['start_time']} - {assignment_data['end_time']}</td></tr>
    <tr><th>場所</th><td>{assignment_data['office_address']}</td></tr>
</table>
<p>詳細は管理画面からご確認ください。</p>
<p>Oriental Synergy</p>
</body>
</html>
    """
    
    send_email(to_email, subject, body, html)


def send_rating_notification_email(to_email: str, rating_data: dict):
    """評価通知メール"""
    subject = "【Oriental Synergy】評価が投稿されました"
    
    body = f"""
{rating_data['staff_name']} 様

新しい評価が投稿されました。

企業名: {rating_data['company_name']}
評価: {'⭐' * int(rating_data['rating'])}（{rating_data['rating']}点）
コメント: {rating_data.get('comment', 'なし')}

Oriental Synergy
    """
    
    html = f"""
<html>
<body>
<h2>{rating_data['staff_name']} 様</h2>
<p>新しい評価が投稿されました。</p>
<table border="1" cellpadding="10">
    <tr><th>企業名</th><td>{rating_data['company_name']}</td></tr>
    <tr><th>評価</th><td>{'⭐' * int(rating_data['rating'])}（{rating_data['rating']}点）</td></tr>
    <tr><th>コメント</th><td>{rating_data.get('comment', 'なし')}</td></tr>
</table>
<p>Oriental Synergy</p>
</body>
</html>
    """
    
    send_email(to_email, subject, body, html)

