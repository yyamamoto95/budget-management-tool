import { describe, expect, it, vi } from 'vitest';
import { CommitImportUseCase, type CommitImportRow } from '../../../application/use-cases/import/CommitImportUseCase';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../../../shared/errors/DomainException';

const row: CommitImportRow = {
    date: '2026-06-29',
    amount: 17504,
    balanceType: 0,
    categoryId: 6,
    content: 'ニホンガクセイシエンキ（取り込み）',
};

function makeDeps(userExists = true) {
    const expenseRepository: IExpenseRepository = {
        findAll: vi.fn(),
        findByUserId: vi.fn(),
        findById: vi.fn(),
        save: vi.fn().mockImplementation(async (e) => e),
        saveMany: vi.fn().mockResolvedValue(undefined),
        remove: vi.fn(),
    };
    const userRepository = {
        findById: vi.fn().mockResolvedValue(userExists ? { userId: 'user-1' } : null),
    } as unknown as IUserRepository;
    return { expenseRepository, userRepository };
}

describe('CommitImportUseCase', () => {
    it('選択済みの行を明細として一括登録し件数を返す', async () => {
        const { expenseRepository, userRepository } = makeDeps();
        const useCase = new CommitImportUseCase(expenseRepository, userRepository);

        const result = await useCase.execute({ userId: 'user-1', rows: [row, { ...row, amount: 900 }] });

        expect(result.ok).toBe(true);
        if (result.ok) expect(result.value.registered).toBe(2);
        // 原子的な一括登録（saveMany 1回・個別 save は使わない）
        expect(expenseRepository.saveMany).toHaveBeenCalledTimes(1);
        expect(vi.mocked(expenseRepository.saveMany).mock.calls[0][0]).toHaveLength(2);
    });

    it('ユーザーが存在しないとき NotFoundError を返す', async () => {
        const { expenseRepository, userRepository } = makeDeps(false);
        const useCase = new CommitImportUseCase(expenseRepository, userRepository);

        const result = await useCase.execute({ userId: 'ghost', rows: [row] });

        expect(result.ok).toBe(false);
        if (!result.ok) expect(result.error).toBeInstanceOf(NotFoundError);
    });

    it('0 件・上限超過は ValidationError を返す', async () => {
        const { expenseRepository, userRepository } = makeDeps();
        const useCase = new CommitImportUseCase(expenseRepository, userRepository);

        const empty = await useCase.execute({ userId: 'user-1', rows: [] });
        expect(!empty.ok && empty.error).toBeInstanceOf(ValidationError);

        const tooMany = await useCase.execute({
            userId: 'user-1',
            rows: Array.from({ length: 101 }, () => row),
        });
        expect(!tooMany.ok && tooMany.error).toBeInstanceOf(ValidationError);
    });

    it('1 行でも不正（金額0以下）があれば全体を登録せず失敗させる', async () => {
        const { expenseRepository, userRepository } = makeDeps();
        const useCase = new CommitImportUseCase(expenseRepository, userRepository);

        const result = await useCase.execute({
            userId: 'user-1',
            rows: [row, { ...row, amount: 0 }],
        });

        expect(result.ok).toBe(false);
        expect(expenseRepository.saveMany).not.toHaveBeenCalled();
    });
});
