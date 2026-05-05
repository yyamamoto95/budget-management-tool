import type { UpdateExpenseInput } from '@budget/common';
import { Expense } from '../../domain/models/Expense';
import type { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';
import { NotFoundError } from '../../shared/errors/DomainException';

export type { UpdateExpenseInput };

export class UpdateExpenseUseCase {
    constructor(private readonly expenseRepository: IExpenseRepository) {}

    async execute(id: string, input: UpdateExpenseInput): Promise<Expense> {
        const existing = await this.expenseRepository.findById(id);
        if (!existing) {
            throw new NotFoundError(`支出が見つかりません: ${id}`);
        }

        // 既存エンティティの不変フィールドを保持しつつ更新フィールドを上書き
        const updated = Expense.reconstruct({
            id: existing.id,
            userId: existing.userId,
            createdDate: existing.createdDate,
            deletedDate: existing.deletedDate,
            amount: input.amount,
            balanceType: input.balanceType,
            categoryId: input.categoryId ?? existing.categoryId,
            content: input.content ?? null,
            date: input.date,
            updatedDate: new Date(),
        });

        return this.expenseRepository.save(updated);
    }
}
