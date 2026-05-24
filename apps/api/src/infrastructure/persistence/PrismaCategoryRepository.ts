import type { CategoryList } from '@prisma/client';
import type { PrismaClient } from '@prisma/client';
import type { BalanceType } from '@budget/common';
import { Category } from '../../domain/models/Category';
import type { ICategoryRepository } from '../../domain/repositories/ICategoryRepository';

function toDomain(record: CategoryList): Category {
    return Category.reconstruct({
        id: record.id,
        key: record.key,
        name: record.name,
        color: record.color,
        bg: record.bg,
        balanceType: record.balanceType as BalanceType,
        displayOrder: record.displayOrder,
        isSystem: record.isSystem,
        isDeleted: record.isDeleted,
    });
}

export class PrismaCategoryRepository implements ICategoryRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findByBalanceType(balanceType: BalanceType): Promise<Category[]> {
        const records = await this.prisma.categoryList.findMany({
            where: { balanceType, isDeleted: false },
            orderBy: { displayOrder: 'asc' },
        });
        return records.map(toDomain);
    }
}
