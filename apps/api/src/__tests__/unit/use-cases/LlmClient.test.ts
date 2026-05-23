import { describe, it, expect, vi, beforeEach } from 'vitest';

// vi.mock はホイスティングされるため、vi.hoisted で先にモック関数を定義する
const { mockMessagesCreate } = vi.hoisted(() => ({
    mockMessagesCreate: vi.fn(),
}));

vi.mock('@anthropic-ai/sdk', () => {
    class MockAnthropic {
        messages = { create: mockMessagesCreate };
    }
    return { default: MockAnthropic };
});

import { LlmClient } from '../../../application/services/LlmClient';

describe('LlmClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        process.env.ANTHROPIC_API_KEY = 'test-key';
    });

    it('正常系: テキストブロックを受け取ったとき LlmResponse を返す', async () => {
        mockMessagesCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: '分析結果です' }],
            usage: { input_tokens: 100, output_tokens: 50 },
        });

        const client = new LlmClient();
        const result = await client.complete({
            systemPrompt: 'あなたは家計アナリストです',
            userMessage: '今月の支出を分析してください',
        });

        expect(result.text).toBe('分析結果です');
        expect(result.inputTokens).toBe(100);
        expect(result.outputTokens).toBe(50);
    });

    it('正常系: model と maxTokens を指定したとき SDK に渡される', async () => {
        mockMessagesCreate.mockResolvedValueOnce({
            content: [{ type: 'text', text: 'OK' }],
            usage: { input_tokens: 10, output_tokens: 5 },
        });

        const client = new LlmClient();
        await client.complete({
            systemPrompt: 'system',
            userMessage: 'user',
            model: 'claude-haiku-4-5-20251001',
            maxTokens: 300,
        });

        expect(mockMessagesCreate).toHaveBeenCalledWith(
            expect.objectContaining({
                model: 'claude-haiku-4-5-20251001',
                max_tokens: 300,
            })
        );
    });

    it('異常系: text 以外のブロックが返ったとき Error を throw する', async () => {
        mockMessagesCreate.mockResolvedValueOnce({
            content: [{ type: 'tool_use', id: 'tool-1', name: 'fn', input: {} }],
            usage: { input_tokens: 10, output_tokens: 5 },
        });

        const client = new LlmClient();
        await expect(client.complete({ systemPrompt: 's', userMessage: 'u' })).rejects.toThrow(
            '予期しないレスポンス形式'
        );
    });
});
