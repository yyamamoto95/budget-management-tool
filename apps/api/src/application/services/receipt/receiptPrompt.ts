/** Claude 系アナライザー共通のプロンプト定義（CLI / API で同一の抽出仕様を保つ） */

export const RECEIPT_SYSTEM_PROMPT =
    'あなたはレシート読取アシスタントです。レシート画像から次を抽出し、JSON のみを出力してください（説明文・コードブロック記法は禁止）。' +
    '{"amount": 合計金額の数値（税込合計。小計・お預り・お釣りではない）, "date": "YYYY-MM-DD"（読み取れなければ null）, "content": "店名"（読み取れなければ null）}';

/** Claude の応答テキストから JSON を取り出してパースする（前後の説明文やコードフェンスに耐性を持たせる） */
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

    const amount =
        typeof obj.amount === 'number' && Number.isFinite(obj.amount) && obj.amount > 0 ? Math.round(obj.amount) : null;
    const date = typeof obj.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(obj.date) ? obj.date : null;
    const content =
        typeof obj.content === 'string' && obj.content.trim() !== '' ? obj.content.trim().slice(0, 255) : null;

    return { amount, date, content };
}
