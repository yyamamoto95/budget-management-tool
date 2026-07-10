import { describe, expect, it, vi } from 'vitest';
import type { ImportCandidate } from '@budget/common';
import { AnalyzeImportUseCase } from '../../../application/use-cases/import/AnalyzeImportUseCase';
import type { StatementScanService } from '../../../application/services/import/StatementScanService';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { Expense } from '../../../domain/models/Expense';

const candidate: ImportCandidate = {
    date: '2026-06-29',
    amount: 17504,
    balanceType: 0,
    content: 'ニホンガクセイシエンキ',
    categoryId: 6,
    confidence: 'high',
    raw: '29日 ニホンガクセイシエンキ -¥17,504',
};

function expense(over: Partial<{ date: string; amount: number; balanceType: number; deletedDate: Date | null }>): Expense {
    return {
        id: 'ulid-1',
        amount: over.amount ?? 17504,
        balanceType: over.balanceType ?? 0,
        userId: 'user-1',
        categoryId: 6,
        content: '既存明細',
        date: over.date ?? '2026-06-29',
        createdDate: new Date(),
        updatedDate: new Date(),
        deletedDate: over.deletedDate ?? null,
    } as unknown as Expense;
}

function makeUseCase(candidates: ImportCandidate[], expenses: Expense[]) {
    const scanService = {
        scan: vi.fn().mockResolvedValue({ candidates, skippedRows: 1, source: 'claude-api' }),
    } as unknown as StatementScanService;
    const expenseRepository: IExpenseRepository = {
        findAll: vi.fn(),
        findByUserId: vi.fn().mockResolvedValue(expenses),
        findById: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
    };
    return new AnalyzeImportUseCase(scanService, expenseRepository);
}

const input = { userId: 'user-1', imageBase64: 'aW1n', mimeType: 'image/png' };

describe('AnalyzeImportUseCase', () => {
    it('既存明細と同日・同額・同収支の候補に重複疑いを付ける', async () => {
        const useCase = makeUseCase([candidate], [expense({})]);
        const result = await useCase.execute(input);
        expect(result.candidates[0].duplicateSuspect).toBe(true);
        expect(result.skippedRows).toBe(1);
        expect(result.source).toBe('claude-api');
    });

    it('日付・金額・収支のいずれかが異なれば重複疑いにしない', async () => {
        const useCase = makeUseCase(
            [candidate],
            [expense({ date: '2026-06-28' }), expense({ amount: 999 }), expense({ balanceType: 1 })]
        );
        const result = await useCase.execute(input);
        expect(result.candidates[0].duplicateSuspect).toBe(false);
    });

    it('削除済みの既存明細は重複判定の対象にしない', async () => {
        const useCase = makeUseCase([candidate], [expense({ deletedDate: new Date() })]);
        const result = await useCase.execute(input);
        expect(result.candidates[0].duplicateSuspect).toBe(false);
    });
});
