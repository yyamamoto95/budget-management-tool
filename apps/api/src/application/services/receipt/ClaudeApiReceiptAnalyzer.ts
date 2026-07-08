import type { LlmClient } from '../LlmClient';
import type { LlmUsageGuard } from '../LlmUsageGuard';
import type { ReceiptAnalyzeInput, ReceiptAnalyzer, ReceiptScanResult } from './ReceiptAnalyzer';
import { RECEIPT_SYSTEM_PROMPT, parseClaudeReceiptJson } from './receiptPrompt';

/** LlmUsageGuard の集計キー */
const FEATURE = 'receipt_scan';

/**
 * クラウド向け: Claude API（既存の #239 基盤）で解析する。
 * ANTHROPIC_API_KEY 未設定時は isAvailable が false を返しスキップされる。
 * 呼び出しは LlmUsageGuard の回数・トークン制限に従う（コスト暴走防止）。
 */
export class ClaudeApiReceiptAnalyzer implements ReceiptAnalyzer {
    readonly source = 'claude-api' as const;

    constructor(
        private readonly llmClient: LlmClient,
        private readonly usageGuard: LlmUsageGuard
    ) {}

    async isAvailable(): Promise<boolean> {
        return Boolean(process.env.ANTHROPIC_API_KEY);
    }

    async analyze(input: ReceiptAnalyzeInput): Promise<ReceiptScanResult> {
        // 制限超過は UsageLimitError として上位へ伝播させる（フォールバックせず 429 を返す）
        await this.usageGuard.checkLimit(input.userId, FEATURE);

        const response = await this.llmClient.completeWithImage({
            systemPrompt: RECEIPT_SYSTEM_PROMPT,
            userMessage: 'このレシート画像を解析してください。',
            imageBase64: input.imageBase64,
            mediaType: input.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
        });

        await this.usageGuard.recordUsage({
            userId: input.userId,
            feature: FEATURE,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
        });

        return { ...parseClaudeReceiptJson(response.text), source: this.source };
    }
}
