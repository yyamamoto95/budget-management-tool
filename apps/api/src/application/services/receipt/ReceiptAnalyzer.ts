/** レシート解析の抽出結果（読み取れなかった項目は null） */
export interface ReceiptScanResult {
    /** 合計金額（円） */
    amount: number | null;
    /** 日付 (YYYY-MM-DD) */
    date: string | null;
    /** 店名など記録のメモに使う文字列 */
    content: string | null;
    /** どの解析手段が使われたか */
    source: ReceiptAnalyzerSource;
}

export type ReceiptAnalyzerSource = 'claude-cli' | 'claude-api' | 'ocr';

export interface ReceiptAnalyzeInput {
    /** base64 エンコード済み画像（data: プレフィックスなし） */
    imageBase64: string;
    /** image/jpeg | image/png */
    mimeType: string;
    /** 使用制限の記録対象ユーザー */
    userId: string;
}

/**
 * レシート解析手段の共通インターフェース。
 * 実行環境に応じて ReceiptScanService が利用可能な実装へフォールバックする。
 */
export interface ReceiptAnalyzer {
    readonly source: ReceiptAnalyzerSource;
    /** この環境で利用可能か（CLI の存在・API キーの有無など） */
    isAvailable(): Promise<boolean>;
    analyze(input: ReceiptAnalyzeInput): Promise<ReceiptScanResult>;
}
