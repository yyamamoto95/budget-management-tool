import { afterEach, describe, expect, it, vi } from 'vitest';
import type {
    StatementAnalyzeInput,
    StatementAnalyzer,
    StatementScanResult,
} from '../../../../application/services/import/StatementAnalyzer';
import { StatementScanService } from '../../../../application/services/import/StatementScanService';
import { UsageLimitError, ValidationError } from '../../../../shared/errors/DomainException';

const input: StatementAnalyzeInput = {
    imageBase64: 'aW1n',
    mimeType: 'image/png',
    userId: 'user-1',
};

const okResult: StatementScanResult = {
    candidates: [],
    skippedRows: 0,
    source: 'claude-api',
};

function analyzer(
    source: 'claude-cli' | 'claude-api',
    opts: { available?: boolean; result?: StatementScanResult; error?: Error } = {}
): StatementAnalyzer {
    return {
        source,
        isAvailable: vi.fn().mockResolvedValue(opts.available ?? true),
        analyze: opts.error
            ? vi.fn().mockRejectedValue(opts.error)
            : vi.fn().mockResolvedValue(opts.result ?? { ...okResult, source }),
    };
}

afterEach(() => {
    delete process.env.STATEMENT_ANALYZER;
});

describe('StatementScanService', () => {
    it('先頭の利用可能なアナライザーの結果を返す', async () => {
        const cli = analyzer('claude-cli');
        const api = analyzer('claude-api');
        const result = await new StatementScanService([cli, api]).scan(input);
        expect(result.source).toBe('claude-cli');
        expect(api.analyze).not.toHaveBeenCalled();
    });

    it('失敗時は次の手段へフォールバックする', async () => {
        const cli = analyzer('claude-cli', { error: new Error('CLI 失敗') });
        const api = analyzer('claude-api');
        const result = await new StatementScanService([cli, api]).scan(input);
        expect(result.source).toBe('claude-api');
    });

    it('UsageLimitError はフォールバックせずそのまま伝播する', async () => {
        const cli = analyzer('claude-cli', { error: new UsageLimitError('上限超過') });
        const api = analyzer('claude-api');
        await expect(new StatementScanService([cli, api]).scan(input)).rejects.toBeInstanceOf(UsageLimitError);
        expect(api.analyze).not.toHaveBeenCalled();
    });

    it('全滅時は撮り直しを促す ValidationError を返す', async () => {
        const cli = analyzer('claude-cli', { available: false });
        const api = analyzer('claude-api', { error: new Error('解析失敗') });
        await expect(new StatementScanService([cli, api]).scan(input)).rejects.toBeInstanceOf(ValidationError);
    });

    it('STATEMENT_ANALYZER で単一手段に固定できる', async () => {
        process.env.STATEMENT_ANALYZER = 'api';
        const cli = analyzer('claude-cli');
        const api = analyzer('claude-api');
        const result = await new StatementScanService([cli, api]).scan(input);
        expect(result.source).toBe('claude-api');
        expect(cli.analyze).not.toHaveBeenCalled();
    });
});
