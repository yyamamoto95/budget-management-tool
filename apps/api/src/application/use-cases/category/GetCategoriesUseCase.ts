import type { BalanceType } from '@budget/common';
import type { Category } from '../../../domain/models/Category';
import type { ICategoryRepository } from '../../../domain/repositories/ICategoryRepository';

export class GetCategoriesUseCase {
    constructor(private readonly categoryRepository: ICategoryRepository) {}

    async execute(balanceType: BalanceType): Promise<Category[]> {
        return this.categoryRepository.findByBalanceType(balanceType);
    }
}
