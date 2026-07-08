import { UsageLimitError, ValidationError } from '../../../shared/errors/DomainException';
import type { ReceiptAnalyzeInput, ReceiptAnalyzer, ReceiptScanResult } from './ReceiptAnalyzer';

/**
 * 実行環境に応じたレシート解析のフォールバックチェーン。
 *
 * 既定の優先順位: claude-cli（ローカル・課金ゼロ）→ claude-api（キー設定時のみ）→ ocr（常時）
 * 環境変数 RECEIPT_ANALYZER=cli|api|ocr で単一の手段に固定できる。
 */
export class ReceiptScanService {
    constructor(private readonly analyzers: ReceiptAnalyzer[]) {}

    async scan(input: ReceiptAnalyzeInput): Promise<ReceiptScanResult> {
        const forced = process.env.RECEIPT_ANALYZER;
        const chain = forced ? this.analyzers.filter((a) => sourceKey(a) === forced) : this.analyzers;

        if (chain.length === 0) {
            throw new Error(`RECEIPT_ANALYZER の指定が不正です: ${forced}`);
        }

        let lastError: unknown = null;
        for (const analyzer of chain) {
            if (!(await analyzer.isAvailable())) continue;
            try {
                return await analyzer.analyze(input);
            } catch (error) {
                // 使用制限はフォールバックせずそのまま返す（意図した遮断のため）
                if (error instanceof UsageLimitError) throw error;
                console.warn(
                    `[ReceiptScanService] ${analyzer.source} での解析に失敗、次の手段へフォールバックします:`,
                    error instanceof Error ? error.message : error
                );
                lastError = error;
            }
        }

        // 画像が不鮮明などで解析できないのは運用上想定されるケースのため、
        // 500（unhandled）ではなく 400 + 明確なメッセージで返し手入力を促す
        throw new ValidationError(
            `レシートを解析できませんでした。手入力するか、明るい場所で撮り直してください${lastError instanceof Error ? `（詳細: ${lastError.message}）` : ''}`
        );
    }
}

function sourceKey(analyzer: ReceiptAnalyzer): string {
    switch (analyzer.source) {
        case 'claude-cli':
            return 'cli';
        case 'claude-api':
            return 'api';
        case 'ocr':
            return 'ocr';
    }
}
