import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReceiptAnalyzer, ReceiptScanResult } from '../../../../application/services/receipt/ReceiptAnalyzer';
import { ReceiptScanService } from '../../../../application/services/receipt/ReceiptScanService';
import { parseClaudeReceiptJson } from '../../../../application/services/receipt/receiptPrompt';
import { UsageLimitError, ValidationError } from '../../../../shared/errors/DomainException';

const INPUT = { imageBase64: 'aGVsbG8=', mimeType: 'image/jpeg', userId: 'user-001' };

function analyzer(
    source: ReceiptScanResult['source'],
    opts: { available?: boolean; error?: Error; result?: Partial<ReceiptScanResult> } = {}
): ReceiptAnalyzer {
    return {
        source,
        isAvailable: vi.fn().mockResolvedValue(opts.available ?? true),
        analyze: opts.error
            ? vi.fn().mockRejectedValue(opts.error)
            : vi.fn().mockResolvedValue({ amount: 702, date: '2026-07-09', content: '店', source, ...opts.result }),
    };
}

afterEach(() => {
    delete process.env.RECEIPT_ANALYZER;
});

describe('ReceiptScanService', () => {
    it('先頭の利用可能なアナライザーを使う', async () => {
        const cli = analyzer('claude-cli');
        const ocr = analyzer('ocr');
        const result = await new ReceiptScanService([cli, ocr]).scan(INPUT);
        expect(result.source).toBe('claude-cli');
        expect(ocr.analyze).not.toHaveBeenCalled();
    });

    it('利用不可のアナライザーはスキップする（キー未設定の Claude API 相当）', async () => {
        const api = analyzer('claude-api', { available: false });
        const ocr = analyzer('ocr');
        const result = await new ReceiptScanService([api, ocr]).scan(INPUT);
        expect(result.source).toBe('ocr');
        expect(api.analyze).not.toHaveBeenCalled();
    });

    it('解析失敗時は次の手段へフォールバックする', async () => {
        const cli = analyzer('claude-cli', { error: new Error('CLI timeout') });
        const ocr = analyzer('ocr');
        const result = await new ReceiptScanService([cli, ocr]).scan(INPUT);
        expect(result.source).toBe('ocr');
    });

    it('UsageLimitError はフォールバックせずそのまま投げる（意図した遮断）', async () => {
        const api = analyzer('claude-api', { error: new UsageLimitError() });
        const ocr = analyzer('ocr');
        await expect(new ReceiptScanService([api, ocr]).scan(INPUT)).rejects.toBeInstanceOf(UsageLimitError);
        expect(ocr.analyze).not.toHaveBeenCalled();
    });

    it('全手段が失敗したら ValidationError（400・手入力を促すメッセージ）', async () => {
        const cli = analyzer('claude-cli', { error: new Error('a') });
        const ocr = analyzer('ocr', { error: new Error('b') });
        await expect(new ReceiptScanService([cli, ocr]).scan(INPUT)).rejects.toBeInstanceOf(ValidationError);
        await expect(new ReceiptScanService([cli, ocr]).scan(INPUT)).rejects.toThrow('レシートを解析できませんでした');
    });

    it('RECEIPT_ANALYZER=ocr で単一手段に固定できる', async () => {
        process.env.RECEIPT_ANALYZER = 'ocr';
        const cli = analyzer('claude-cli');
        const ocr = analyzer('ocr');
        const result = await new ReceiptScanService([cli, ocr]).scan(INPUT);
        expect(result.source).toBe('ocr');
        expect(cli.analyze).not.toHaveBeenCalled();
    });
});

describe('parseClaudeReceiptJson', () => {
    it('純粋な JSON を解析する', () => {
        expect(parseClaudeReceiptJson('{"amount": 702, "date": "2026-07-09", "content": "ローソン"}')).toEqual({
            amount: 702,
            date: '2026-07-09',
            content: 'ローソン',
        });
    });

    it('前後に説明文やコードフェンスがあっても JSON を取り出す', () => {
        const text = '結果です:\n```json\n{"amount": 1500, "date": null, "content": "スーパー"}\n```';
        expect(parseClaudeReceiptJson(text)).toEqual({ amount: 1500, date: null, content: 'スーパー' });
    });

    it('LLM の表記揺れを正規化する（文字列金額・カンマ・スラッシュ日付）', () => {
        expect(parseClaudeReceiptJson('{"amount": "1,234円", "date": "2026/07/09", "content": "スーパー"}')).toEqual({
            amount: 1234,
            date: '2026-07-09',
            content: 'スーパー',
        });
    });

    it('不正な値は null に落とす（負の金額・実在しない日付）', () => {
        expect(parseClaudeReceiptJson('{"amount": -5, "date": "2026-02-30", "content": ""}')).toEqual({
            amount: null,
            date: null,
            content: null,
        });
    });

    it('JSON が含まれなければエラー', () => {
        expect(() => parseClaudeReceiptJson('読み取れませんでした')).toThrow();
    });
});
