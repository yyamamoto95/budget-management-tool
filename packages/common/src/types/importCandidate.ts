/**
 * スクショ一括取り込み（#559 / #563）の取り込み候補。
 * 解析エンジンの出力 = 確認・編集画面の入力となる契約型（API / Web / モバイル共通）。
 * 明細（Expense）とは別物で、Commit 時に初めて明細へ変換される。
 */

/** 解析器が自己申告する確からしさ。low は確認画面で要確認マークを付ける */
export type ImportConfidence = 'high' | 'low';

export type ImportCandidate = {
    /** YYYY-MM-DD（画像内の月見出しと行の日から解析器が合成する） */
    date: string;
    /** 金額（正の整数・円） */
    amount: number;
    /** 0=支出（出金・支払い）, 1=収入（入金） */
    balanceType: 0 | 1;
    /** 摘要（店名・振込元など） */
    content: string;
    /** 推定カテゴリ ID（balanceType に応じた既存カテゴリ。不明は 0=その他） */
    categoryId: number;
    confidence: ImportConfidence;
    /** OCR/LLM が読み取った元の行テキスト（誤読訂正の監査用） */
    raw: string;
};
