"""
時間枠計算ユーティリティ
予約の施術時間と休憩時間から、予約可能な枠を自動計算する
"""
from typing import List, Dict, Tuple
from datetime import datetime, timedelta


def parse_time(time_str: str) -> Tuple[int, int]:
    """
    時刻文字列をパース（例: "10:00" -> (10, 0)）
    
    Args:
        time_str: 時刻文字列（HH:MM形式）
        
    Returns:
        (時, 分)のタプル
    """
    try:
        hour, minute = map(int, time_str.split(':'))
        return hour, minute
    except (ValueError, AttributeError):
        raise ValueError(f"Invalid time format: {time_str}. Expected format: HH:MM")


def format_time(hour: int, minute: int) -> str:
    """
    時刻をフォーマット（例: (10, 0) -> "10:00"）
    
    Args:
        hour: 時
        minute: 分
        
    Returns:
        HH:MM形式の文字列
    """
    return f"{hour:02d}:{minute:02d}"


def calculate_total_minutes(start_time: str, end_time: str) -> int:
    """
    開始時刻と終了時刻から全体の時間（分）を計算
    
    Args:
        start_time: 開始時刻（例: "10:00"）
        end_time: 終了時刻（例: "12:00"）
        
    Returns:
        全体時間（分）
    """
    start_hour, start_minute = parse_time(start_time)
    end_hour, end_minute = parse_time(end_time)
    
    start_minutes = start_hour * 60 + start_minute
    end_minutes = end_hour * 60 + end_minute
    
    # 終了時刻が開始時刻より前の場合（日跨ぎ）
    if end_minutes < start_minutes:
        end_minutes += 24 * 60
    
    return end_minutes - start_minutes


def add_minutes_to_time(time_str: str, minutes: int) -> str:
    """
    時刻に分を加算
    
    Args:
        time_str: 元の時刻（例: "10:00"）
        minutes: 加算する分
        
    Returns:
        加算後の時刻（HH:MM形式）
    """
    hour, minute = parse_time(time_str)
    
    # datetimeを使って計算（日跨ぎ対応）
    base_date = datetime(2000, 1, 1, hour, minute)
    new_time = base_date + timedelta(minutes=minutes)
    
    return format_time(new_time.hour, new_time.minute)


def calculate_time_slots(
    start_time: str,
    end_time: str,
    service_duration: int,
    break_duration: int,
    max_participants: int = None
) -> Dict:
    """
    予約枠を自動計算
    
    Args:
        start_time: 開始時刻（例: "10:00"）
        end_time: 終了時刻（例: "12:00"）
        service_duration: 施術時間（分）
        break_duration: 休憩時間（分）
        max_participants: 募集人数（指定された場合、枠数の上限となる）
        
    Returns:
        {
            'valid': bool,              # 有効な設定かどうか
            'error': str | None,        # エラーメッセージ
            'slot_count': int,          # 実際の枠数（max_participantsで制限される場合あり）
            'physical_slot_count': int, # 物理的に作成可能な枠数
            'slots': List[Dict],        # 各枠の情報
            'total_minutes': int,       # 全体時間
            'used_minutes': int,        # 使用時間
            'remaining_minutes': int,   # 余り時間
        }
    """
    result = {
        'valid': False,
        'error': None,
        'slot_count': 0,
        'physical_slot_count': 0,
        'slots': [],
        'total_minutes': 0,
        'used_minutes': 0,
        'remaining_minutes': 0,
    }
    
    # 1. 入力値の検証
    if service_duration <= 0:
        result['error'] = '施術時間は1分以上を指定してください'
        return result
    
    if break_duration < 0:
        result['error'] = '休憩時間は0分以上を指定してください'
        return result
    
    # 2. 全体時間を計算
    try:
        total_minutes = calculate_total_minutes(start_time, end_time)
    except ValueError as e:
        result['error'] = f'時刻の形式が正しくありません: {str(e)}'
        return result
    
    result['total_minutes'] = total_minutes
    
    # 3. 施術時間が全体時間を超えていないかチェック
    if service_duration > total_minutes:
        result['error'] = f'施術時間({service_duration}分)が全体時間({total_minutes}分)を超えています'
        return result
    
    # 4. 枠数を計算
    # 計算式: 枠数 = floor((全体時間 + 休憩時間) / (施術時間 + 休憩時間))
    if service_duration + break_duration == 0:
        result['error'] = '施術時間と休憩時間の合計は1分以上必要です'
        return result
    
    physical_slot_count = (total_minutes + break_duration) // (service_duration + break_duration)
    
    # 5. 最低1枠は確保できるかチェック
    if physical_slot_count < 1:
        result['error'] = f'この設定では予約枠を作成できません（全体時間: {total_minutes}分、施術時間: {service_duration}分）'
        return result
    
    # 6. 実際の枠数を決定（募集人数で制限）
    if max_participants is not None and max_participants > 0:
        slot_count = min(physical_slot_count, max_participants)
    else:
        slot_count = physical_slot_count
    
    result['physical_slot_count'] = physical_slot_count
    
    # 7. 実際の使用時間を計算
    used_minutes = service_duration * slot_count + break_duration * (slot_count - 1)
    
    # 8. 使用時間が全体時間を超えていないかチェック
    if used_minutes > total_minutes:
        excess = used_minutes - total_minutes
        result['error'] = (
            f'時間が不足しています\n'
            f'必要時間: {used_minutes}分（施術{service_duration}分 × {slot_count}枠 + 休憩{break_duration}分 × {slot_count-1}）\n'
            f'利用可能: {total_minutes}分\n'
            f'超過: {excess}分'
        )
        result['slot_count'] = slot_count
        result['used_minutes'] = used_minutes
        return result
    
    # 9. 各枠の時間帯を計算（実際の枠数分のみ作成）
    slots = []
    current_time = start_time
    
    for i in range(slot_count):
        slot_start = current_time
        slot_end = add_minutes_to_time(current_time, service_duration)
        
        slots.append({
            'slot': i + 1,
            'start_time': slot_start,
            'end_time': slot_end,
            'duration': service_duration,
            'is_filled': False  # 初期状態は空き
        })
        
        # 次の枠の開始時刻を計算（施術時間 + 休憩時間）
        current_time = add_minutes_to_time(current_time, service_duration + break_duration)
    
    # 10. 成功
    remaining_minutes = total_minutes - used_minutes
    
    result.update({
        'valid': True,
        'error': None,
        'slot_count': slot_count,
        'slots': slots,
        'used_minutes': used_minutes,
        'remaining_minutes': remaining_minutes,
    })
    
    return result


def validate_slot_assignment(
    slot_count: int,
    slots_filled: int,
    requested_slot: int
) -> Tuple[bool, str]:
    """
    枠へのアサインが可能かチェック
    
    Args:
        slot_count: 総枠数
        slots_filled: 既に埋まっている枠数
        requested_slot: 希望する枠番号（1始まり）
        
    Returns:
        (可能かどうか, エラーメッセージ)
    """
    # 既に満員かチェック
    if slots_filled >= slot_count:
        return False, f'この予約は満員です（{slot_count}枠全て埋まっています）'
    
    # 枠番号が有効範囲内かチェック
    if requested_slot < 1 or requested_slot > slot_count:
        return False, f'無効な枠番号です（有効範囲: 1〜{slot_count}）'
    
    return True, ''


if __name__ == '__main__':
    # テスト実行
    print("=== 時間枠計算ユーティリティ テスト ===\n")
    
    # テストケース1: 正常系
    print("テスト1: 10:00-12:00, 施術30分, 休憩10分")
    result = calculate_time_slots("10:00", "12:00", 30, 10)
    print(f"結果: {result['valid']}")
    print(f"枠数: {result['slot_count']}")
    print(f"使用時間: {result['used_minutes']}分 / {result['total_minutes']}分")
    for slot in result['slots']:
        print(f"  枠{slot['slot']}: {slot['start_time']}-{slot['end_time']} ({slot['duration']}分)")
    print()
    
    # テストケース2: 時間オーバー
    print("テスト2: 10:00-12:00, 施術50分, 休憩20分")
    result = calculate_time_slots("10:00", "12:00", 50, 20)
    print(f"結果: {result['valid']}")
    print(f"エラー: {result['error']}")
    print()
    
    # テストケース3: 休憩なし
    print("テスト3: 14:00-16:00, 施術40分, 休憩0分")
    result = calculate_time_slots("14:00", "16:00", 40, 0)
    print(f"結果: {result['valid']}")
    print(f"枠数: {result['slot_count']}")
    for slot in result['slots']:
        print(f"  枠{slot['slot']}: {slot['start_time']}-{slot['end_time']} ({slot['duration']}分)")

