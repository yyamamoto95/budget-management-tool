/**
 * 金額表示フォーマット（Web / モバイル共通）
 * 表示ゆれ防止のため、¥ 表示はすべてここを経由する。
 */

/** ¥1,234 形式（負数は −¥1,234。ja-JP 区切り・四捨五入） */
export function formatYen(n: number): string {
    const rounded = Math.round(n);
    return `${rounded < 0 ? '−' : ''}¥${Math.abs(rounded).toLocaleString('ja-JP')}`;
}

/** +¥1,234 / −¥1,234 形式（符号を常に表示） */
export function formatYenSigned(n: number): string {
    return `${n >= 0 ? '+' : '−'}¥${Math.abs(Math.round(n)).toLocaleString('ja-JP')}`;
}
