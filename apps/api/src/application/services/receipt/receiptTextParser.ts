/**
 * OCR テキストからのルールベース抽出（TesseractReceiptAnalyzer 用）。
 * 純粋関数として切り出し、単体テストで抽出仕様を担保する。
 */

/** 「合計」行から税込合計金額を抽出する（小計・お預り・お釣りは対象外） */
export function extractTotalAmount(text: string): number | null {
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
        // 「小計」「お預り」等の誤検出を避け、「合計」「ご合計」「総合計」のみ対象にする
        if (!/(^|[^小])合\s*計/.test(line)) continue;
        if (/預|釣|ポイント/.test(line)) continue;

        const numberMatch = line.replace(/[,，¥￥\\]/g, '').match(/(\d{2,7})(?!.*\d)/);
        if (numberMatch) {
            const amount = Number(numberMatch[1]);
            if (amount > 0) return amount;
        }
    }
    return null;
}

/** 日付（YYYY/MM/DD・YYYY-MM-DD・YYYY年MM月DD日 等）を YYYY-MM-DD で抽出する */
export function extractReceiptDate(text: string): string | null {
    const match = text.match(/(20\d{2})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 店名として先頭の意味のある行を抽出する */
export function extractStoreName(text: string): string | null {
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line === '') continue;
        // 記号やノイズだけの行はスキップ
        if (!/[ぁ-んァ-ヶ一-龠a-zA-Z]/.test(line)) continue;
        return line.slice(0, 50);
    }
    return null;
}
