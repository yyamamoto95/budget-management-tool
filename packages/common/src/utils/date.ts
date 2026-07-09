/**
 * 日付ユーティリティ（Web / モバイル共通）
 */

/** ローカルタイムゾーンの YYYY-MM-DD 文字列を返す（記録フォームの日付指定に使用） */
export function toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
