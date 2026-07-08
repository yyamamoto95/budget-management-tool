import Anthropic from '@anthropic-ai/sdk';

export interface LlmRequest {
    systemPrompt: string;
    userMessage: string;
    maxTokens?: number;
    model?: string;
}

export interface LlmImageRequest {
    systemPrompt: string;
    userMessage: string;
    /** base64 エンコード済み画像（data: プレフィックスなし） */
    imageBase64: string;
    mediaType: 'image/jpeg' | 'image/png';
    maxTokens?: number;
    model?: string;
}

export interface LlmResponse {
    text: string;
    inputTokens: number;
    outputTokens: number;
}

// ANTHROPIC_API_KEY 未設定時は起動時に警告を出す（クラッシュしない）
if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('[LlmClient] ANTHROPIC_API_KEY が設定されていません。AI 機能は利用できません。');
}

const DEFAULT_MODEL = process.env.LLM_MODEL ?? 'claude-haiku-4-5-20251001';
const DEFAULT_MAX_OUTPUT_TOKENS = Number(process.env.LLM_MAX_OUTPUT_TOKENS ?? 600);

export class LlmClient {
    private readonly client: Anthropic;

    constructor() {
        this.client = new Anthropic({
            apiKey: process.env.ANTHROPIC_API_KEY,
        });
    }

    async complete(req: LlmRequest): Promise<LlmResponse> {
        const response = await this.client.messages.create({
            model: req.model ?? DEFAULT_MODEL,
            max_tokens: req.maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            system: req.systemPrompt,
            messages: [{ role: 'user', content: req.userMessage }],
        });

        return this.toLlmResponse(response);
    }

    /** 画像付きの補完（レシート読取などの vision 用途） */
    async completeWithImage(req: LlmImageRequest): Promise<LlmResponse> {
        const response = await this.client.messages.create({
            model: req.model ?? DEFAULT_MODEL,
            max_tokens: req.maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
            system: req.systemPrompt,
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: req.mediaType,
                                data: req.imageBase64,
                            },
                        },
                        { type: 'text', text: req.userMessage },
                    ],
                },
            ],
        });

        return this.toLlmResponse(response);
    }

    private toLlmResponse(response: Anthropic.Message): LlmResponse {
        const block = response.content[0];
        if (block.type !== 'text') {
            throw new Error('[LlmClient] 予期しないレスポンス形式です');
        }

        return {
            text: block.text,
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
        };
    }
}
