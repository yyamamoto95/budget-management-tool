/**
 * 固定費の毎月自動登録（#552）の共通ロジック（Web / モバイル / API 共通）
 *
 * 方式はアクセス時遅延登録: API アクセス時に「オン かつ 今月の登録日を過ぎている かつ
 * 今月分未登録」なら当月分の明細を登録する。二重登録は冪等ログ（ユーザー × 年月の
 * 一意制約）で防ぐ。判定・明細組み立てはすべてここの純粋関数で行い、API はこれを呼ぶだけにする。
 */

/** 登録日の下限・上限。月末問題（29〜31 日が存在しない月）を避けるため 28 を上限にする */
export const AUTO_FIXED_DAY_MIN = 1;
export const AUTO_FIXED_DAY_MAX = 28;

/** 登録日の既定値（給料日直後を想定した仮設定） */
export const AUTO_FIXED_DAY_DEFAULT = 27;

/** 固定費内訳のキー（UserSettings.fixedExpensesDetail と同一） */
export type AutoFixedKey =
    | 'rent'
    | 'utilities'
    | 'insurance'
    | 'subscriptions'
    | 'transportation'
    | 'other';

/**
 * 固定費項目 → 支出カテゴリ ID・表示名のマッピング（SSOT）。
 * カテゴリ ID は constants/categories.ts の OUTGO_CATEGORIES に対応する。
 */
export const AUTO_FIXED_ITEM_MAP: Record<AutoFixedKey, { categoryId: number; label: string }> = {
    rent: { categoryId: 5, label: '家賃' }, // 住居・光熱費
    utilities: { categoryId: 5, label: '光熱費' }, // 住居・光熱費
    insurance: { categoryId: 9, label: '保険料' }, // 医療・保険
    subscriptions: { categoryId: 4, label: 'サブスク' }, // 通信・サブスク
    transportation: { categoryId: 8, label: '交通費' }, // クルマ・交通
    other: { categoryId: 0, label: 'その他固定費' }, // その他・不明
};

/** 明細の content に付与する自動登録の目印（明細一覧で判別できるようにする） */
export const AUTO_FIXED_CONTENT_SUFFIX = '（自動登録）';

/**
 * 日本時間での日付要素を返す（サーバーの実行タイムゾーンに依存させない）。
 * 家計簿の「今日」「今月」はユーザーの生活時間 = JST を正とする。
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
function jstParts(today: Date): { year: number; month: number; day: number } {
    const jst = new Date(today.getTime() + JST_OFFSET_MS);
    return { year: jst.getUTCFullYear(), month: jst.getUTCMonth() + 1, day: jst.getUTCDate() };
}

/** 登録日を 1〜28 に丸める（不正値はデフォルトに落とす） */
export function clampAutoFixedDay(day: number): number {
    if (!Number.isInteger(day)) return AUTO_FIXED_DAY_DEFAULT;
    return Math.min(AUTO_FIXED_DAY_MAX, Math.max(AUTO_FIXED_DAY_MIN, day));
}

/**
 * 今月分を登録すべきかの判定（冪等ログの有無は呼び出し側がトランザクション内で確認する）。
 * オン かつ 今日が登録日以降 のときだけ true。
 */
export function shouldRegisterAutoFixed(params: {
    enabled: boolean;
    day: number;
    today: Date;
}): boolean {
    if (!params.enabled) return false;
    return jstParts(params.today).day >= clampAutoFixedDay(params.day);
}

/** 対象年月（YYYY-MM・日本時間基準）を返す */
export function autoFixedYearMonth(today: Date): string {
    const { year, month } = jstParts(today);
    return `${year}-${String(month).padStart(2, '0')}`;
}

export type AutoFixedEntry = {
    amount: number;
    /** balanceType は常に支出（0） */
    balanceType: 0;
    categoryId: number;
    content: string;
    /** YYYY-MM-DD（対象月の登録日） */
    date: string;
};

/**
 * 固定費内訳から当月分の明細を組み立てる。金額 0 以下の項目はスキップする。
 * 登録後は通常の明細として編集・削除できる。
 */
export function buildAutoFixedEntries(
    detail: Partial<Record<AutoFixedKey, number>> | null | undefined,
    params: { today: Date; day: number }
): AutoFixedEntry[] {
    if (!detail) return [];
    const day = clampAutoFixedDay(params.day);
    const date = `${autoFixedYearMonth(params.today)}-${String(day).padStart(2, '0')}`;
    return (Object.keys(AUTO_FIXED_ITEM_MAP) as AutoFixedKey[])
        .filter((key) => (detail[key] ?? 0) > 0)
        .map((key) => ({
            amount: detail[key] as number,
            balanceType: 0 as const,
            categoryId: AUTO_FIXED_ITEM_MAP[key].categoryId,
            content: `${AUTO_FIXED_ITEM_MAP[key].label}${AUTO_FIXED_CONTENT_SUFFIX}`,
            date,
        }));
}
