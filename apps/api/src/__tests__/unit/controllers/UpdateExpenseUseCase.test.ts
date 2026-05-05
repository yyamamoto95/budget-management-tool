import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpdateExpenseUseCase } from '../../../application/use-cases/UpdateExpenseUseCase';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { Expense } from '../../../domain/models/Expense';
import type { UpdateExpenseInput } from '@budget/common';
import { NotFoundError } from '../../../shared/errors/DomainException';

const mockExpense: Expense = {
    id: 'expense-01',
    amount: 1000,
    balanceType: 0,
    userId: 'user-1',
    categoryId: 1,
    date: '2024-01-01',
    content: 'テスト',
    createdDate: new Date('2024-01-01'),
    updatedDate: new Date('2024-01-01'),
    deletedDate: null,
};

const updatedExpense: Expense = {
    ...mockExpense,
    amount: 2000,
    date: '2024-02-01',
    content: '更新後',
    updatedDate: new Date('2024-02-01'),
};

const mockExpenseRepository: IExpenseRepository = {
    findAll: vi.fn(),
    findByUserId: vi.fn(),
    findById: vi.fn().mockResolvedValue(mockExpense),
    save: vi.fn().mockResolvedValue(updatedExpense),
    remove: vi.fn(),
};

describe('UpdateExpenseUseCase', () => {
    let useCase: UpdateExpenseUseCase;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(mockExpenseRepository.findById).mockResolvedValue(mockExpense);
        vi.mocked(mockExpenseRepository.save).mockResolvedValue(updatedExpense);
        useCase = new UpdateExpenseUseCase(mockExpenseRepository);
    });

    const validInput: UpdateExpenseInput = {
        amount: 2000,
        balanceType: 0,
        date: '2024-02-01',
        content: '更新後',
    };

    describe('execute()', () => {
        it('正常系: 有効なデータで支出を更新する', async () => {
            const result = await useCase.execute('expense-01', validInput);

            expect(result).toEqual(updatedExpense);
            expect(mockExpenseRepository.findById).toHaveBeenCalledWith('expense-01');
            expect(mockExpenseRepository.save).toHaveBeenCalledTimes(1);
        });

        it('正常系: content が null でも更新できる', async () => {
            const result = await useCase.execute('expense-01', { ...validInput, content: null });
            expect(result).toEqual(updatedExpense);
        });

        it('正常系: userId は既存エンティティから引き継がれる', async () => {
            await useCase.execute('expense-01', validInput);

            const savedArg = vi.mocked(mockExpenseRepository.save).mock.calls[0][0];
            expect(savedArg.userId).toBe(mockExpense.userId);
        });

        it('正常系: createdDate は既存エンティティから引き継がれる', async () => {
            await useCase.execute('expense-01', validInput);

            const savedArg = vi.mocked(mockExpenseRepository.save).mock.calls[0][0];
            expect(savedArg.createdDate).toEqual(mockExpense.createdDate);
        });

        it('異常系: 存在しない ID を指定すると NotFoundError をthrow', async () => {
            vi.mocked(mockExpenseRepository.findById).mockResolvedValue(null);

            await expect(useCase.execute('not-exist', validInput)).rejects.toBeInstanceOf(NotFoundError);
        });

        it('異常系: リポジトリが例外をthrowした場合は伝播する', async () => {
            vi.mocked(mockExpenseRepository.save).mockRejectedValue(new Error('DB error'));

            await expect(useCase.execute('expense-01', validInput)).rejects.toThrow('DB error');
        });
    });
});
