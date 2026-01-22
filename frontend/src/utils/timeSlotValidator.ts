/**
 * 時間枠バリデーションユーティリティ
 */

export interface TimeSlot {
  slot: number;
  start_time: string;
  end_time: string;
  duration: number;
  is_filled?: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  slotCount?: number;
  usedTime?: number;
  remainingTime?: number;
  requiredTime?: number;
  availableTime?: number;
  excessTime?: number;
  slots?: TimeSlot[];
  totalEarnings?: number;  // 総報酬（円）
}

/**
 * 時刻文字列をパース（HH:MM -> {hour, minute}）
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hourStr, minuteStr] = timeStr.split(':');
  return {
    hour: parseInt(hourStr, 10),
    minute: parseInt(minuteStr, 10),
  };
}

/**
 * 時刻をフォーマット（{hour, minute} -> HH:MM）
 */
function formatTime(hour: number, minute: number): string {
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

/**
 * 開始時刻と終了時刻から全体時間（分）を計算
 */
export function calculateMinutesBetween(startTime: string, endTime: string): number {
  const start = parseTime(startTime);
  const end = parseTime(endTime);

  const startMinutes = start.hour * 60 + start.minute;
  let endMinutes = end.hour * 60 + end.minute;

  // 終了時刻が開始時刻より前の場合（日跨ぎ）
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  return endMinutes - startMinutes;
}

/**
 * 時刻に分を加算
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const { hour, minute } = parseTime(timeStr);

  let totalMinutes = hour * 60 + minute + minutes;
  
  // 24時間を超える場合の処理
  totalMinutes = totalMinutes % (24 * 60);

  const newHour = Math.floor(totalMinutes / 60);
  const newMinute = totalMinutes % 60;

  return formatTime(newHour, newMinute);
}

/**
 * 各枠の時間帯を計算
 */
function calculateSlots(
  startTime: string,
  serviceDuration: number,
  breakDuration: number,
  slotCount: number
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  let currentTime = startTime;

  for (let i = 0; i < slotCount; i++) {
    const slotStart = currentTime;
    const slotEnd = addMinutesToTime(currentTime, serviceDuration);

    slots.push({
      slot: i + 1,
      start_time: slotStart,
      end_time: slotEnd,
      duration: serviceDuration,
      is_filled: false,
    });

    // 次の枠の開始時刻を計算（施術時間 + 休憩時間）
    currentTime = addMinutesToTime(currentTime, serviceDuration + breakDuration);
  }

  return slots;
}

/**
 * 時間枠のバリデーションと計算
 */
export function validateTimeSlots(
  startTime: string,
  endTime: string,
  serviceDuration: number,
  breakDuration: number,
  hourlyRate?: number
): ValidationResult {
  // 1. 入力値の基本チェック
  if (!startTime || !endTime) {
    return { valid: false, error: '開始時刻と終了時刻を入力してください' };
  }

  if (serviceDuration <= 0 || isNaN(serviceDuration)) {
    return { valid: false, error: '施術時間は1分以上を指定してください' };
  }

  if (breakDuration < 0 || isNaN(breakDuration)) {
    return { valid: false, error: '休憩時間は0分以上を指定してください' };
  }

  // 2. 全体時間を計算
  let totalMinutes: number;
  try {
    totalMinutes = calculateMinutesBetween(startTime, endTime);
  } catch (error) {
    return { valid: false, error: '時刻の形式が正しくありません' };
  }

  if (totalMinutes <= 0) {
    return { valid: false, error: '終了時刻は開始時刻より後に設定してください' };
  }

  // 3. 施術時間が全体時間を超えていないかチェック
  if (serviceDuration > totalMinutes) {
    return {
      valid: false,
      error: `施術時間(${serviceDuration}分)が全体時間(${totalMinutes}分)を超えています`,
    };
  }

  // 4. 枠数を計算
  if (serviceDuration + breakDuration === 0) {
    return { valid: false, error: '施術時間と休憩時間の合計は1分以上必要です' };
  }

  const slotCount = Math.floor((totalMinutes + breakDuration) / (serviceDuration + breakDuration));

  // 5. 最低1枠は確保できるかチェック
  if (slotCount < 1) {
    return {
      valid: false,
      error: `この設定では予約枠を作成できません（全体時間: ${totalMinutes}分、施術時間: ${serviceDuration}分）`,
    };
  }

  // 6. 実際の使用時間を計算
  const usedTime = serviceDuration * slotCount + breakDuration * (slotCount - 1);

  // 7. 使用時間が全体時間を超えていないかチェック
  if (usedTime > totalMinutes) {
    const excess = usedTime - totalMinutes;
    return {
      valid: false,
      error: `時間が不足しています`,
      slotCount: slotCount,
      requiredTime: usedTime,
      availableTime: totalMinutes,
      excessTime: excess,
    };
  }

  // 8. 各枠の時間帯を計算
  const slots = calculateSlots(startTime, serviceDuration, breakDuration, slotCount);

  // 9. 余り時間を計算
  const remainingTime = totalMinutes - usedTime;

  // 10. 総報酬を計算（時給が指定されている場合）
  let totalEarnings: number | undefined;
  if (hourlyRate && hourlyRate > 0) {
    totalEarnings = Math.floor((serviceDuration * slotCount * hourlyRate) / 60);
  }

  // 11. 成功
  return {
    valid: true,
    slotCount: slotCount,
    usedTime: usedTime,
    remainingTime: remainingTime,
    availableTime: totalMinutes,
    slots: slots,
    totalEarnings: totalEarnings,
  };
}

/**
 * 分を時間表記に変換（例: 90分 -> "1時間30分"）
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}分`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}時間`;
  }
  
  return `${hours}時間${mins}分`;
}

/**
 * 金額をフォーマット（例: 1500 -> "1,500円"）
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ja-JP')}円`;
}

