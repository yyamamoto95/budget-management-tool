import type { BudgetList } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import { Expense } from '../../domain/models/Expense';
import type { BalanceType } from '../../domain/models/Expense';
import type { IExpenseRepository } from '../../domain/repositories/IExpenseRepository';

/** Prisma の BudgetList レコードをドメインモデルに変換する（ドメイン層への Prisma 型の漏洩を防ぐ） */
function toDomain(record: BudgetList): Expense {
    return Expense.reconstruct({
        id: record.id,
        amount: record.amount,
        balanceType: record.balanceType as BalanceType,
        userId: record.userId,
        categoryId: record.categoryId,
        content: record.content,
        date: record.date,
        createdDate: record.createdDate,
        updatedDate: record.updatedDate,
        deletedDate: record.deletedDate,
    });
}

export class PrismaExpenseRepository implements IExpenseRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findAll(): Promise<Expense[]> {
        const records = await this.prisma.budgetList.findMany({
            where: { deletedDate: null },
        });
        return records.map(toDomain);
    }

    async findByUserId(userId: string): Promise<Expense[]> {
        const records = await this.prisma.budgetList.findMany({
            where: { userId, deletedDate: null },
        });
        return records.map(toDomain);
    }

    async findById(id: string): Promise<Expense | null> {
        const record = await this.prisma.budgetList.findFirst({
            where: { id, deletedDate: null },
        });
        return record ? toDomain(record) : null;
    }

    async save(expense: Expense): Promise<Expense> {
        const record = await this.prisma.budgetList.upsert({
            where: { id: expense.id },
            create: {
                id: expense.id,
                amount: expense.amount,
                balanceType: expense.balanceType,
                userId: expense.userId,
                categoryId: expense.categoryId,
                content: expense.content,
                date: expense.date,
            },
            update: {
                amount: expense.amount,
                balanceType: expense.balanceType,
                categoryId: expense.categoryId,
                content: expense.content,
                date: expense.date,
            },
        });
        return toDomain(record);
    }

    async remove(id: string): Promise<void> {
        // ソフトデリート（deletedDate を設定）
        await this.prisma.budgetList.update({
            where: { id },
            data: { deletedDate: new Date() },
        });
    }
}
