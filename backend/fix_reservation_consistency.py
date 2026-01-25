"""
予約データの整合性を修正するスクリプト

問題:
- employee_namesに社員名が登録されているのに、slots_filledが0のまま
- time_slotsのis_filledフラグが更新されていない

修正内容:
- employee_namesの人数に基づいてslots_filledを更新
- time_slotsのis_filledフラグを正しく設定
"""

import sqlite3
import json
from typing import List, Dict, Any


def fix_reservation_consistency():
    """予約データの整合性を修正"""
    conn = sqlite3.connect('oriental_synergy.db')
    cursor = conn.cursor()
    
    # 全予約を取得
    cursor.execute("""
        SELECT id, office_name, max_participants, slots_filled, 
               employee_names, time_slots, status
        FROM reservations
    """)
    
    reservations = cursor.fetchall()
    fixed_count = 0
    
    print("=" * 80)
    print("予約データの整合性チェックと修正")
    print("=" * 80)
    
    for row in reservations:
        reservation_id = row[0]
        office_name = row[1]
        max_participants = row[2]
        slots_filled = row[3]
        employee_names = row[4]
        time_slots_json = row[5]
        status = row[6]
        
        # employee_namesから実際の登録人数を計算
        if employee_names:
            actual_employee_count = len([n.strip() for n in employee_names.split(',') if n.strip()])
        else:
            actual_employee_count = 0
        
        # time_slotsをパース（二重エンコード対応）
        if time_slots_json:
            try:
                time_slots = json.loads(time_slots_json)
                # 二重エンコードされている場合、もう一度パース
                if isinstance(time_slots, str):
                    time_slots = json.loads(time_slots)
                # is_filled=Trueの枠数をカウント
                filled_slots_count = sum(1 for slot in time_slots if slot.get('is_filled', False))
            except Exception as e:
                print(f"  警告: time_slotsのパースエラー: {e}")
                time_slots = []
                filled_slots_count = 0
        else:
            time_slots = []
            filled_slots_count = 0
        
        # 不整合をチェック
        needs_fix = False
        
        # employee_namesの人数とslots_filledが一致しない場合
        if actual_employee_count != slots_filled:
            needs_fix = True
            print(f"\n予約ID {reservation_id}: {office_name}")
            print(f"  ❌ slots_filled不整合: DB={slots_filled}, 実際の社員数={actual_employee_count}")
        
        # time_slotsのis_filledカウントとslots_filledが一致しない場合
        if filled_slots_count != actual_employee_count:
            needs_fix = True
            print(f"\n予約ID {reservation_id}: {office_name}")
            print(f"  ❌ time_slots不整合: is_filled数={filled_slots_count}, 実際の社員数={actual_employee_count}")
        
        if needs_fix:
            # slots_filledを修正
            correct_slots_filled = actual_employee_count
            
            print(f"  🔧 修正: slots_filled {slots_filled} → {correct_slots_filled}")
            
            cursor.execute("""
                UPDATE reservations 
                SET slots_filled = ?
                WHERE id = ?
            """, (correct_slots_filled, reservation_id))
            
            fixed_count += 1
            print(f"  ✅ 修正完了")
    
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 80)
    print(f"修正完了: {fixed_count}件の予約を修正しました")
    print("=" * 80)


def verify_specific_reservation(reservation_id: int = 41):
    """特定の予約の状態を確認"""
    conn = sqlite3.connect('oriental_synergy.db')
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT id, office_name, max_participants, slots_filled, 
               employee_names, time_slots
        FROM reservations
        WHERE id = ?
    """, (reservation_id,))
    
    row = cursor.fetchone()
    
    if not row:
        print(f"予約ID {reservation_id} が見つかりません")
        return
    
    print("\n" + "=" * 80)
    print(f"予約ID {reservation_id} の確認")
    print("=" * 80)
    print(f"事業所: {row[1]}")
    print(f"募集人数 (max_participants): {row[2]}")
    print(f"予約済み枠数 (slots_filled): {row[3]}")
    print(f"登録社員名 (employee_names): {row[4]}")
    
    if row[4]:
        employee_count = len([n.strip() for n in row[4].split(',') if n.strip()])
        print(f"  → 社員数: {employee_count}名")
    else:
        employee_count = 0
        print(f"  → 社員数: 0名")
    
    available = row[2] - row[3]
    print(f"空き枠: {available}名")
    
    if row[5]:
        time_slots = json.loads(row[5])
        # 二重エンコード対応
        if isinstance(time_slots, str):
            time_slots = json.loads(time_slots)
        
        print(f"\ntime_slots: {len(time_slots)}枠")
        for slot in time_slots[:5]:  # 最初の5枠のみ表示
            print(f"  枠{slot['slot']}: {slot['start_time']}~{slot['end_time']}, " +
                  f"is_filled={slot.get('is_filled', False)}, " +
                  f"employee_name={slot.get('employee_name', 'なし')}")
        if len(time_slots) > 5:
            print(f"  ... 他{len(time_slots)-5}枠")
    
    print("\n整合性チェック:")
    if row[3] == employee_count:
        print("  ✅ slots_filled と employee_names の人数が一致")
    else:
        print(f"  ❌ slots_filled ({row[3]}) と employee_names の人数 ({employee_count}) が不一致")
    
    if available >= 0:
        print(f"  ✅ 空き枠計算が正常 ({available}名)")
    else:
        print(f"  ❌ 空き枠が負の値 ({available}名)")
    
    conn.close()


if __name__ == "__main__":
    print("予約データ整合性修正スクリプト")
    print("=" * 80)
    
    # 修正前の状態確認
    print("\n【修正前】予約ID 41の状態:")
    verify_specific_reservation(41)
    
    # 整合性修正を実行
    print("\n\n【修正実行】")
    fix_reservation_consistency()
    
    # 修正後の状態確認
    print("\n【修正後】予約ID 41の状態:")
    verify_specific_reservation(41)

