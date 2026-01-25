"""
time_slotsのis_filledフラグを修正するスクリプト

問題:
- 古いAPIで登録された社員は、time_slotsのis_filledフラグが更新されていない
- どの枠に割り当てられているか不明

修正方針:
- employee_namesに登録されている社員を、空いている枠から順番に割り当てる
"""

import sqlite3
import json
from typing import List, Dict, Any


def fix_time_slots_filled():
    """time_slotsのis_filledフラグを修正"""
    conn = sqlite3.connect('oriental_synergy.db')
    cursor = conn.cursor()
    
    # employee_namesが登録されているが、time_slotsのis_filledが不一致の予約を取得
    cursor.execute("""
        SELECT id, office_name, employee_names, time_slots
        FROM reservations
        WHERE employee_names IS NOT NULL 
        AND employee_names != ''
        AND time_slots IS NOT NULL
    """)
    
    reservations = cursor.fetchall()
    fixed_count = 0
    
    print("=" * 80)
    print("time_slotsのis_filledフラグ修正")
    print("=" * 80)
    
    for row in reservations:
        reservation_id = row[0]
        office_name = row[1]
        employee_names = row[2]
        time_slots_json = row[3]
        
        # 社員名リストを取得
        employees = [n.strip() for n in employee_names.split(',') if n.strip()]
        
        # time_slotsをパース
        try:
            time_slots = json.loads(time_slots_json)
            if isinstance(time_slots, str):
                time_slots = json.loads(time_slots)
        except:
            print(f"予約ID {reservation_id}: time_slotsのパースエラー")
            continue
        
        # is_filled=Trueの枠数を数える
        filled_count = sum(1 for slot in time_slots if slot.get('is_filled', False))
        
        # 不一致がある場合のみ修正
        if filled_count != len(employees):
            print(f"\n予約ID {reservation_id}: {office_name}")
            print(f"  社員数: {len(employees)}名")
            print(f"  is_filled=True枠数: {filled_count}枠")
            print(f"  社員リスト: {', '.join(employees)}")
            
            # 空いている枠に社員を割り当て
            employee_index = 0
            for slot in time_slots:
                # 既に割り当てられている枠はスキップ
                if slot.get('is_filled', False) or slot.get('employee_name'):
                    continue
                
                # 割り当てる社員がいる場合
                if employee_index < len(employees):
                    slot['employee_name'] = employees[employee_index]
                    slot['employee_department'] = '(登録済み)'  # 部署情報は不明
                    slot['is_filled'] = True
                    print(f"  🔧 枠{slot['slot']}に「{employees[employee_index]}」を割り当て")
                    employee_index += 1
            
            # 更新したtime_slotsを保存
            updated_time_slots_json = json.dumps(time_slots, ensure_ascii=False)
            
            cursor.execute("""
                UPDATE reservations 
                SET time_slots = ?
                WHERE id = ?
            """, (updated_time_slots_json, reservation_id))
            
            fixed_count += 1
            print(f"  ✅ 修正完了")
    
    conn.commit()
    conn.close()
    
    print("\n" + "=" * 80)
    print(f"修正完了: {fixed_count}件の予約を修正しました")
    print("=" * 80)


def verify_reservation(reservation_id: int):
    """予約の状態を確認"""
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
        employees = [n.strip() for n in row[4].split(',') if n.strip()]
        print(f"  → 社員数: {len(employees)}名")
    else:
        employees = []
        print(f"  → 社員数: 0名")
    
    if row[5]:
        time_slots = json.loads(row[5])
        if isinstance(time_slots, str):
            time_slots = json.loads(time_slots)
        
        print(f"\ntime_slots: {len(time_slots)}枠")
        filled_slots = []
        empty_slots = []
        
        for slot in time_slots:
            is_filled = slot.get('is_filled', False)
            emp_name = slot.get('employee_name', '')
            
            if is_filled or emp_name:
                filled_slots.append(slot)
                print(f"  ✅ 枠{slot['slot']}: {slot['start_time']}~{slot['end_time']}, " +
                      f"is_filled={is_filled}, employee_name={emp_name}")
            else:
                empty_slots.append(slot)
                print(f"  ⚪ 枠{slot['slot']}: {slot['start_time']}~{slot['end_time']}, " +
                      f"is_filled={is_filled}, 空き")
        
        print(f"\n予約済み枠: {len(filled_slots)}枠")
        print(f"空き枠: {len(empty_slots)}枠")
    
    print("\n整合性チェック:")
    if row[3] == len(employees):
        print("  ✅ slots_filled と employee_names の人数が一致")
    else:
        print(f"  ❌ slots_filled ({row[3]}) と employee_names の人数 ({len(employees)}) が不一致")
    
    if row[5]:
        filled_count = sum(1 for s in time_slots if s.get('is_filled', False))
        if filled_count == len(employees):
            print("  ✅ time_slotsのis_filled数と社員数が一致")
        else:
            print(f"  ❌ time_slotsのis_filled数 ({filled_count}) と社員数 ({len(employees)}) が不一致")
    
    conn.close()


if __name__ == "__main__":
    print("time_slots修正スクリプト")
    print("=" * 80)
    
    # 修正前の状態確認
    print("\n【修正前】予約ID 41の状態:")
    verify_reservation(41)
    
    # 修正を実行
    print("\n\n【修正実行】")
    fix_time_slots_filled()
    
    # 修正後の状態確認
    print("\n【修正後】予約ID 41の状態:")
    verify_reservation(41)

