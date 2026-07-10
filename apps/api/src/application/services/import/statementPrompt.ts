import {
    getCategoriesByType,
    type ImportCandidate,
    type ImportConfidence,
} from '@budget/common';
import { normalizeDate } from '../receipt/receiptTextParser';

/** 明細一覧解析（#563）のプロンプト定義。CLI / API で同一の抽出仕様を保つ */

/** カテゴリ不明時のフォールバック（その他） */
const FALLBACK_CATEGORY_ID = 0;

function categoryGuide(balanceType: 0 | 1): string {
    return getCategoriesByType(balanceType)
        .map((c) => `${c.id}=${c.name}（${c.description}）`)
        .join(' / ');
}

export const STATEMENT_SYSTEM_PROMPT =
    'あなたは家計簿アプリの取り込みアシスタントです。銀行口座やクレジットカードの明細一覧のスクリーンショットから明細行をすべて抽出し、JSON のみを出力してください（説明文・コードブロック記法は禁止）。\n' +
    '出力形式: {"rows":[{"date":"YYYY-MM-DD","amount":正の整数,"balanceType":0または1,"content":"摘要","categoryId":整数,"confidence":"high"または"low","raw":"読み取った元の行テキスト"}]}\n' +
    'ルール:\n' +
    '- 日付は行の「12日」等と、画面内の月見出し（例「2026年6月」）を組み合わせて YYYY-MM-DD にする。年月が判別できない行は出力しない\n' +
    '- 出金・支払い（マイナス表記や支出色）は balanceType=0、入金（プラス表記）は balanceType=1\n' +
    '- 「未確定」「確定」「リボ等」などのサマリー・残高・月合計・検索欄などの UI 要素は明細ではないため出力しない\n' +
    `- categoryId は balanceType=0 のとき: ${categoryGuide(0)}\n` +
    `- balanceType=1 のとき: ${categoryGuide(1)}\n` +
    `- 判断に自信がない行は confidence を "low" にし、カテゴリが不明なら ${FALLBACK_CATEGORY_ID}（その他）を使う\n` +
    '- 金額・日付が読み取れない行は出力しない（推測で埋めない）';

/** 解析器の応答 1 行分の検証結果 */
type RowValidation = { candidate: ImportCandidate | null };

/**
 * Claude の応答テキストから rows を取り出し、行単位で検証して候補列に変換する。
 * 不正な行は捨てて skippedRows として数える（部分成功を許容する）。
 */
export function parseClaudeStatementJson(text: string): {
    candidates: ImportCandidate[];
    skippedRows: number;
} {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
        throw new Error('明細解析結果に JSON が含まれていません');
    }
    const parsed: unknown = JSON.parse(match[0]);
    if (typeof parsed !== 'object' || parsed === null || !Array.isArray((parsed as { rows?: unknown }).rows)) {
        throw new Error('明細解析結果の JSON 形式が不正です（rows 配列がありません）');
    }
    const rows = (parsed as { rows: unknown[] }).rows;

    const candidates: ImportCandidate[] = [];
    let skippedRows = 0;
    for (const row of rows) {
        const { candidate } = validateRow(row);
        if (candidate) candidates.push(candidate);
        else skippedRows += 1;
    }
    return { candidates, skippedRows };
}

function validateRow(row: unknown): RowValidation {
    if (typeof row !== 'object' || row === null) return { candidate: null };
    const obj = row as Record<string, unknown>;

    const amount = coerceAmount(obj.amount);
    const date = coerceDate(obj.date);
    let balanceType: 0 | 1 | null = null;
    if (obj.balanceType === 0) balanceType = 0;
    if (obj.balanceType === 1) balanceType = 1;
    if (amount === null || date === null || balanceType === null) {
        return { candidate: null };
    }

    const content =
        typeof obj.content === 'string' && obj.content.trim() !== ''
            ? obj.content.trim().slice(0, 255)
            : '（摘要なし）';
    const raw = typeof obj.raw === 'string' ? obj.raw.trim().slice(0, 500) : '';

    // カテゴリは実在 ID のみ許可。範囲外・不明は「その他」に落として要確認にする
    const validIds = new Set(getCategoriesByType(balanceType).map((c) => c.id));
    const rawCategoryId = typeof obj.categoryId === 'number' ? obj.categoryId : FALLBACK_CATEGORY_ID;
    const categoryId = validIds.has(rawCategoryId) ? rawCategoryId : FALLBACK_CATEGORY_ID;

    let confidence: ImportConfidence = obj.confidence === 'low' ? 'low' : 'high';
    if (categoryId !== rawCategoryId || categoryId === FALLBACK_CATEGORY_ID) {
        confidence = 'low';
    }

    return {
        candidate: { date, amount, balanceType, content, categoryId, confidence, raw },
    };
}

/** "1,234" "¥1,234" "-¥4,420" のような表現も正の整数に正規化する（符号は balanceType が担う） */
function coerceAmount(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value) && value !== 0) {
        return Math.round(Math.abs(value));
    }
    if (typeof value === 'string') {
        // "17,504" "¥17,504" "-4420" に加え "17504.00" のような小数表記も許容する
        const normalized = value.replace(/[,，¥￥円\s\-−]/g, '');
        if (/^\d+(\.\d+)?$/.test(normalized)) {
            const amount = Math.round(Number(normalized));
            if (amount > 0) return amount;
        }
    }
    return null;
}

/** "2026/06/29" 等の区切り違いも YYYY-MM-DD に正規化する（実在しない日付は null） */
function coerceDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    // LLM 出力の前後空白に耐性を持たせる
    const match = value.trim().match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})/);
    if (!match) return null;
    return normalizeDate(Number(match[1]), Number(match[2]), Number(match[3]));
}
