import { Expense } from '../../../domain/models/Expense';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { IUserRepository } from '../../../domain/repositories/IUserRepository';
import { NotFoundError, ValidationError } from '../../../shared/errors/DomainException';
import { type Result, err, ok } from '../../../shared/types/result';

/** 確認画面で選択・編集された登録対象行 */
export type CommitImportRow = {
    date: string;
    amount: number;
    balanceType: 0 | 1;
    categoryId: number;
    content: string;
};

export type CommitImportInput = {
    userId: string;
    rows: CommitImportRow[];
};

/** 一括登録の上限（1回のスクショ由来として妥当な範囲に制限する） */
const MAX_ROWS_PER_COMMIT = 100;

/**
 * 選択済みの取り込み候補を明細へ一括登録する（#564 / #559 シナリオ4）。
 * バリデーションは Expense.create（ドメイン規則）に委譲し、
 * 1 行でも不正があれば登録前に全体を失敗させる（部分登録による混乱を防ぐ）。
 */
export class CommitImportUseCase {
    constructor(
        private readonly expenseRepository: IExpenseRepository,
        private readonly userRepository: IUserRepository
    ) {}

    async execute(
        input: CommitImportInput
    ): Promise<Result<{ registered: number }, NotFoundError | ValidationError>> {
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            return err(new NotFoundError(`ユーザーが見つかりません: ${input.userId}`));
        }
        if (input.rows.length === 0) {
            return err(new ValidationError('登録対象の明細が選択されていません'));
        }
        if (input.rows.length > MAX_ROWS_PER_COMMIT) {
            return err(new ValidationError(`一度に登録できるのは ${MAX_ROWS_PER_COMMIT} 件までです`));
        }

        // 先に全行をドメイン規則で検証してから保存する（途中失敗の防止）
        let expenses: Expense[];
        try {
            expenses = input.rows.map((row) =>
                Expense.create({
                    amount: row.amount,
                    balanceType: row.balanceType,
                    userId: input.userId,
                    categoryId: row.categoryId,
                    content: row.content,
                    date: row.date,
                })
            );
        } catch (error) {
            return err(
                new ValidationError(
                    error instanceof Error ? error.message : '明細の内容が不正です'
                )
            );
        }

        for (const expense of expenses) {
            await this.expenseRepository.save(expense);
        }
        return ok({ registered: expenses.length });
    }
}
