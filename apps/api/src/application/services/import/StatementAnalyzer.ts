import type { ImportCandidate } from '@budget/common';

/** 明細一覧スクショ解析の結果 */
export interface StatementScanResult {
    /** バリデーション済みの取り込み候補（不正行は除外済み） */
    candidates: ImportCandidate[];
    /** 解析器が出力したが検証で弾かれた行数（部分成功の明示に使う） */
    skippedRows: number;
    /** どの解析手段が使われたか */
    source: StatementAnalyzerSource;
}

export type StatementAnalyzerSource = 'claude-cli' | 'claude-api';

export interface StatementAnalyzeInput {
    /** base64 エンコード済み画像（data: プレフィックスなし） */
    imageBase64: string;
    /** image/jpeg | image/png */
    mimeType: string;
    /** 使用制限の記録対象ユーザー */
    userId: string;
}

/**
 * 明細一覧スクショ（マネーツリー等）解析手段の共通インターフェース。
 * レシート読み取り（ReceiptAnalyzer）の「1画像 → 複数明細候補」への一般化。
 * 表構造の読解が必要なため LLM 系のみで構成し、Tesseract OCR は使わない。
 */
export interface StatementAnalyzer {
    readonly source: StatementAnalyzerSource;
    isAvailable(): Promise<boolean>;
    analyze(input: StatementAnalyzeInput): Promise<StatementScanResult>;
}
