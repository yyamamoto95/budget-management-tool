/**
 * CreateExpenseUseCase 単体テスト
 *
 * コントローラ層を削除したため、バリデーションと支出生成ロジックは
 * Zod（ルート層）と CreateExpenseUseCase に分離されている。
 * 本テストは UseCase のドメインロジックのみを検証する。
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreateExpenseUseCase } from '../../../application/use-cases/CreateExpenseUseCase';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import type { Expense } from '../../../domain/models/Expense';
import type { User } from '../../../domain/models/User';
import type { CreateExpenseInput } from '@budget/common';

const mockExpense: Expense = {
    id: 'test-id',
    amount: 1000,
    balanceType: 0,
    userId: 'user-1',
    categoryId: 1,
    date: '2024-01-01',
    content: 'テスト',
    createdDate: new Date('2024-01-01'),
    updatedDate: new Date('2024-01-01'),
    deletedDate: null,
} as unknown as Expense;

const mockUser: User = {
    userId: 'user-1',
    userName: 'テストユーザー',
    password: 'hash',
    email: null,
    role: 'USER',
    status: 'ACTIVE',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
} as unknown as User;

const mockExpenseRepository: IExpenseRepository = {
    findAll: vi.fn().mockResolvedValue([mockExpense]),
    findByUserId: vi.fn().mockResolvedValue([mockExpense]),
    findById: vi.fn().mockResolvedValue(mockExpense),
    save: vi.fn().mockResolvedValue(mockExpense),
    remove: vi.fn().mockResolvedValue(undefined),
};

const mockUserRepository: IUserRepository = {
    findAll: vi.fn().mockResolvedValue([mockUser]),
    findById: vi.fn().mockResolvedValue(mockUser),
    findByEmail: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue(mockUser),
    update: vi.fn().mockResolvedValue(mockUser),
    remove: vi.fn().mockResolvedValue(undefined),
    verifyPassword: vi.fn().mockResolvedValue(true),
};

describe('CreateExpenseUseCase', () => {
    let useCase: CreateExpenseUseCase;

    beforeEach(() => {
        vi.clearAllMocks();
        // clearAllMocks はコール履歴のみリセットするため、実装は明示的に再設定する
        vi.mocked(mockExpenseRepository.findAll).mockResolvedValue([mockExpense]);
        vi.mocked(mockExpenseRepository.findByUserId).mockResolvedValue([mockExpense]);
        vi.mocked(mockExpenseRepository.findById).mockResolvedValue(mockExpense);
        vi.mocked(mockExpenseRepository.save).mockResolvedValue(mockExpense);
        vi.mocked(mockExpenseRepository.remove).mockResolvedValue(undefined);
        vi.mocked(mockUserRepository.findById).mockResolvedValue(mockUser);
        useCase = new CreateExpenseUseCase(mockExpenseRepository, mockUserRepository);
    });

    const validInput: CreateExpenseInput = {
        amount: 1000,
        balanceType: 0,
        userId: 'user-1',
        date: '2024-01-01',
        content: 'テスト',
    };

    describe('execute()', () => {
        it('正常系: 有効なデータで支出を作成する', async () => {
            const result = await useCase.execute(validInput);
            expect(result).toEqual(mockExpense);
            expect(mockUserRepository.findById).toHaveBeenCalledWith('user-1');
            expect(mockExpenseRepository.save).toHaveBeenCalledTimes(1);
        });

        it('正常系: content が null でも保存できる', async () => {
            const result = await useCase.execute({ ...validInput, content: null });
            expect(result).toEqual(mockExpense);
        });

        it('異常系: 存在しないユーザーIDは Error をthrow', async () => {
            vi.mocked(mockUserRepository.findById).mockResolvedValue(null);
            await expect(useCase.execute(validInput)).rejects.toThrow('ユーザーが見つかりません');
        });

        it('異常系: リポジトリが例外をthrowした場合は伝播する', async () => {
            vi.mocked(mockExpenseRepository.save).mockRejectedValue(new Error('DB error'));
            await expect(useCase.execute(validInput)).rejects.toThrow('DB error');
        });
    });
});
