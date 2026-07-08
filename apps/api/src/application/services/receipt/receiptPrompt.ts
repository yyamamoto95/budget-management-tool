import { normalizeDate } from './receiptTextParser';

/** Claude 系アナライザー共通のプロンプト定義（CLI / API で同一の抽出仕様を保つ） */

export const RECEIPT_SYSTEM_PROMPT =
    'あなたはレシート読取アシスタントです。レシート画像から次を抽出し、JSON のみを出力してください（説明文・コードブロック記法は禁止）。' +
    '{"amount": 合計金額の数値（税込合計。小計・お預り・お釣りではない）, "date": "YYYY-MM-DD"（読み取れなければ null）, "content": "店名"（読み取れなければ null）}';

/**
 * Claude の応答テキストから JSON を取り出してパースする。
 * LLM 出力の表記揺れ（金額の文字列化・カンマ・日付の区切り違い等）に耐性を持たせる。
 */
export function parseClaudeReceiptJson(text: string): {
    amount: number | null;
    date: string | null;
    content: string | null;
} {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error('レシート解析結果に JSON が含まれていません');
    }
    const parsed: unknown = JSON.parse(match[0]);
    if (typeof parsed !== 'object' || parsed === null) {
        throw new Error('レシート解析結果の JSON 形式が不正です');
    }
    const obj = parsed as Record<string, unknown>;

    return {
        amount: coerceAmount(obj.amount),
        date: coerceDate(obj.date),
        content: typeof obj.content === 'string' && obj.content.trim() !== '' ? obj.content.trim().slice(0, 255) : null,
    };
}

/** "702" や "1,234円" のような文字列表現も数値に正規化する */
function coerceAmount(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return Math.round(value);
    }
    if (typeof value === 'string') {
        const digits = value.replace(/[,，¥￥円\s]/g, '');
        if (/^\d+$/.test(digits)) {
            const amount = Number(digits);
            if (amount > 0) return amount;
        }
    }
    return null;
}

/** "2026/07/09" 等の区切り違いも YYYY-MM-DD に正規化する（実在しない日付は null） */
function coerceDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const match = value.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})/);
    if (!match) return null;

    return normalizeDate(Number(match[1]), Number(match[2]), Number(match[3]));
}
