import type { LlmClient } from '../LlmClient';
import type { LlmUsageGuard } from '../LlmUsageGuard';
import type { StatementAnalyzeInput, StatementAnalyzer, StatementScanResult } from './StatementAnalyzer';
import { STATEMENT_SYSTEM_PROMPT, parseClaudeStatementJson } from './statementPrompt';

/** LlmUsageGuard の集計キー（レシート読み取りと同じ上限体系を共有する） */
const FEATURE = 'statement_import';

/**
 * クラウド向け: Claude API で明細一覧スクショを解析する。
 * ANTHROPIC_API_KEY 未設定時は isAvailable が false を返しスキップされる。
 */
export class ClaudeApiStatementAnalyzer implements StatementAnalyzer {
    readonly source = 'claude-api' as const;

    constructor(
        private readonly llmClient: LlmClient,
        private readonly usageGuard: LlmUsageGuard
    ) {}

    async isAvailable(): Promise<boolean> {
        return Boolean(process.env.ANTHROPIC_API_KEY);
    }

    async analyze(input: StatementAnalyzeInput): Promise<StatementScanResult> {
        // 制限超過は UsageLimitError として上位へ伝播させる（フォールバックせず 429 を返す）
        await this.usageGuard.checkLimit(input.userId, FEATURE);

        const response = await this.llmClient.completeWithImage({
            systemPrompt: STATEMENT_SYSTEM_PROMPT,
            userMessage: 'この明細一覧のスクリーンショットを解析してください。',
            imageBase64: input.imageBase64,
            mediaType: input.mimeType === 'image/png' ? 'image/png' : 'image/jpeg',
        });

        await this.usageGuard.recordUsage({
            userId: input.userId,
            feature: FEATURE,
            inputTokens: response.inputTokens,
            outputTokens: response.outputTokens,
        });

        return { ...parseClaudeStatementJson(response.text), source: this.source };
    }
}
