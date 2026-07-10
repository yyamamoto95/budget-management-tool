import { Prisma, type PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import type { AutoFixedEntry } from '@budget/common';
import type { IAutoFixedRegistrar } from '../../domain/repositories/IAutoFixedRegistrar';

export class PrismaAutoFixedRegistrar implements IAutoFixedRegistrar {
    constructor(private readonly prisma: PrismaClient) {}

    async registerOnce(
        userId: string,
        yearMonth: string,
        entries: AutoFixedEntry[]
    ): Promise<boolean> {
        try {
            // ログ作成（一意制約が冪等キー）と明細登録を同一トランザクションで行う。
            // ログ作成が P2002 で失敗 = 他リクエストが登録済み → 全体をロールバックして何もしない
            await this.prisma.$transaction([
                this.prisma.autoFixedLog.create({
                    data: { id: ulid(), userId, yearMonth },
                }),
                this.prisma.budgetList.createMany({
                    data: entries.map((entry) => ({
                        id: ulid(),
                        amount: entry.amount,
                        balanceType: entry.balanceType,
                        userId,
                        categoryId: entry.categoryId,
                        content: entry.content,
                        date: entry.date,
                    })),
                }),
            ]);
            return true;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                return false;
            }
            throw error;
        }
    }
}
