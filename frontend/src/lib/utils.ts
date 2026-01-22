/**
 * ユーティリティ関数
 */

/**
 * 通貨フォーマット（日本円）
 * @param amount 金額
 * @returns フォーマットされた文字列（例: "¥1,000"）
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount)
}

/**
 * 日付フォーマット
 * @param date 日付文字列またはDateオブジェクト
 * @returns フォーマットされた日付文字列（例: "2025/01/22"）
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

/**
 * 時間フォーマット
 * @param time 時間文字列（例: "14:30:00"）
 * @returns フォーマットされた時間文字列（例: "14:30"）
 */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/**
 * 分を時間文字列に変換
 * @param minutes 分数
 * @returns 時間文字列（例: "2時間30分"）
 */
export function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) {
    return `${mins}分`
  } else if (mins === 0) {
    return `${hours}時間`
  } else {
    return `${hours}時間${mins}分`
  }
}

