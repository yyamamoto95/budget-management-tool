import { UsageLimitError, ValidationError } from '../../../shared/errors/DomainException';
import type { StatementAnalyzeInput, StatementAnalyzer, StatementScanResult } from './StatementAnalyzer';

/**
 * 明細一覧スクショ解析のフォールバックチェーン（ReceiptScanService と同型）。
 *
 * 既定の優先順位: claude-cli（ローカル・課金ゼロ）→ claude-api（キー設定時のみ）。
 * 表構造の読解が必要なため Tesseract OCR は含めない。
 * 環境変数 STATEMENT_ANALYZER=cli|api で単一の手段に固定できる。
 */
export class StatementScanService {
    constructor(private readonly analyzers: StatementAnalyzer[]) {}

    async scan(input: StatementAnalyzeInput): Promise<StatementScanResult> {
        const forced = process.env.STATEMENT_ANALYZER;
        const chain = forced ? this.analyzers.filter((a) => sourceKey(a) === forced) : this.analyzers;

        if (chain.length === 0) {
            throw new Error(`STATEMENT_ANALYZER の指定が不正です: ${forced}`);
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
                    `[StatementScanService] ${analyzer.source} での解析に失敗、次の手段へフォールバックします:`,
                    error instanceof Error ? error.message : error
                );
                lastError = error;
            }
        }

        // 画像が不鮮明・対象外の画像などは運用上想定されるケースのため 400 + 明確なメッセージで返す
        throw new ValidationError(
            `明細を読み取れませんでした。明細一覧が写ったスクリーンショットを選び直してください${lastError instanceof Error ? `（詳細: ${lastError.message}）` : ''}`
        );
    }
}

function sourceKey(analyzer: StatementAnalyzer): string {
    switch (analyzer.source) {
        case 'claude-cli':
            return 'cli';
        case 'claude-api':
            return 'api';
    }
}
