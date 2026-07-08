/**
 * 金額テンキー入力ロジック（Web QuickEntryDrawer / モバイル記録画面で共有）
 * 文字列ベースで金額を組み立てる純粋関数。表示・イベント処理は各プラットフォームが担う。
 */

/** 登録できる金額の上限（Web/モバイル共通） */
export const MAX_AMOUNT = 9_999_999;

/** テンキーの配列（表示順もこの順で統一する） */
export const KEYPAD_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', '⌫'] as const;

export type KeypadKey = (typeof KEYPAD_KEYS)[number];

/**
 * テンキー入力を1打適用した次の金額文字列を返す。
 * - ⌫: 末尾1文字を削除
 * - 先頭の 0 / 000 は無視（"0" 始まりの金額を作らない）
 * - 上限（max）を超える入力は無視
 */
export function applyKeypadKey(current: string, key: KeypadKey, max: number = MAX_AMOUNT): string {
    if (key === '⌫') return current.slice(0, -1);
    if (current === '' && (key === '0' || key === '000')) return current;
    const next = current + key;
    if (Number(next) > max) return current;
    return next;
}
