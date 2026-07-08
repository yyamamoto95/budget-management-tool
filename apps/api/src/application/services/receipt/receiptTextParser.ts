/**
 * OCR テキストからのルールベース抽出（TesseractReceiptAnalyzer 用）。
 * 純粋関数として切り出し、単体テストで抽出仕様を担保する。
 */

/** 「合計」行から税込合計金額を抽出する（小計・お預り・お釣りは対象外） */
export function extractTotalAmount(text: string): number | null {
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
        // 「小計」「お預り」等の誤検出を避け、「合計」「ご合計」「総合計」のみ対象にする
        const keywordMatch = line.match(/(^|[^小])合\s*計/);
        if (!keywordMatch || keywordMatch.index === undefined) continue;
        if (/預|釣|ポイント/.test(line)) continue;

        // 「合計 12,000円 (内消費税 1,090円)」のような括弧書きに惑わされないよう、
        // キーワード直後の最初の数値を合計金額として扱う
        const after = line.slice(keywordMatch.index).replace(/[,，¥￥\\]/g, '');
        const numberMatch = after.match(/\d{1,7}/);
        if (numberMatch) {
            const amount = Number(numberMatch[0]);
            if (amount > 0) return amount;
        }
    }
    return null;
}

/** 日付（YYYY/MM/DD・YYYY-MM-DD・YYYY年MM月DD日 等）を YYYY-MM-DD で抽出する */
export function extractReceiptDate(text: string): string | null {
    const match = text.match(/(20\d{2})[年\/\-.](\d{1,2})[月\/\-.](\d{1,2})/);
    if (!match) return null;

    return normalizeDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

/** カレンダー上に実在する日付のみ YYYY-MM-DD で返す（2/30 等は null） */
export function normalizeDate(year: number, month: number, day: number): string | null {
    const date = new Date(Date.UTC(year, month - 1, day));
    const valid = date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
    if (!valid) return null;

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** 店名として扱わないヘッダー・定型文のパターン */
const NON_STORE_LINE =
    /^(領収書|レシート|売上票|御買上票|明細|毎度|いつも|ありがとうございま|またお越し|TEL|Tel|電話|FAX|登録番号|〒|https?:)/;

/** 店名として先頭の意味のある行を抽出する */
export function extractStoreName(text: string): string | null {
    for (const rawLine of text.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (line === '') continue;
        // 記号やノイズだけの行はスキップ
        if (!/[ぁ-んァ-ヶ一-龠a-zA-Z]/.test(line)) continue;
        // 「領収書」「毎度ありがとうございます」「TEL...」等の定型行はスキップ
        if (NON_STORE_LINE.test(line)) continue;
        return line.slice(0, 50);
    }
    return null;
}
