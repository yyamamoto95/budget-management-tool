import type { BalanceType } from '@budget/common';
import type { Category } from '../models/Category';

export interface ICategoryRepository {
    /** isDeleted=false のカテゴリを displayOrder 昇順で取得する */
    findByBalanceType(balanceType: BalanceType): Promise<Category[]>;
}
