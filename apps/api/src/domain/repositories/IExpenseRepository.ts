import type { Expense } from '../models/Expense';

export interface IExpenseRepository {
    findAll(): Promise<Expense[]>;
    findByUserId(userId: string): Promise<Expense[]>;
    findById(id: string): Promise<Expense | null>;
    save(expense: Expense): Promise<Expense>;
    /** 複数明細を原子的に一括登録する（全件成功 or 全件失敗。#564 の一括取り込みで使用） */
    saveMany(expenses: Expense[]): Promise<void>;
    remove(id: string): Promise<void>;
}
