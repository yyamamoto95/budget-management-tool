import type { FixedExpensesDetail, UserSettings } from '../../../domain/models/UserSettings';
import type { IUserSettingsRepository } from '../../../domain/repositories/IUserSettingsRepository';
import { ValidationError } from '../../../shared/errors/DomainException';
import { type Result, ok, err } from '../../../shared/types/result';

export type UpsertUserSettingsInput = {
    userId: string;
    totalAssets: number;
    monthlyIncome: number;
    /** 給料日（1〜31） */
    paydayDay: number;
    /** 月次固定費合計（円）— fixedExpensesDetail がある場合は無視（自動算出） */
    fixedExpenses: number;
    /** 固定費内訳（省略時は既存値を維持） */
    fixedExpensesDetail?: FixedExpensesDetail | null;
    /** 初回設定完了フラグ（省略時は既存値を維持） */
    initialSetupCompleted?: boolean;
};

/** 給料日の有効範囲 */
const PAYDAY_MIN = 1;
const PAYDAY_MAX = 31;

/** 固定費内訳から合計を算出する */
function sumFixedExpensesDetail(detail: FixedExpensesDetail): number {
    return (
        detail.rent + detail.utilities + detail.insurance + detail.subscriptions + detail.transportation + detail.other
    );
}

export class UpsertUserSettingsUseCase {
    constructor(private readonly userSettingsRepository: IUserSettingsRepository) {}

    async execute(input: UpsertUserSettingsInput): Promise<Result<UserSettings, ValidationError>> {
        if (input.totalAssets < 0) {
            return err(new ValidationError('総資産は0以上の値を入力してください'));
        }
        if (input.monthlyIncome < 0) {
            return err(new ValidationError('月次収入は0以上の値を入力してください'));
        }
        if (input.paydayDay < PAYDAY_MIN || input.paydayDay > PAYDAY_MAX) {
            return err(new ValidationError(`給料日は${PAYDAY_MIN}〜${PAYDAY_MAX}の範囲で入力してください`));
        }

        // fixedExpensesDetail がある場合は合計を自動算出（後方互換）
        let fixedExpenses = input.fixedExpenses;
        if (input.fixedExpensesDetail) {
            const values = Object.values(input.fixedExpensesDetail);
            for (const v of values) {
                if (v < 0) {
                    return err(new ValidationError('固定費の各項目は0以上の値を入力してください'));
                }
            }
            fixedExpenses = sumFixedExpensesDetail(input.fixedExpensesDetail);
        }

        if (fixedExpenses < 0) {
            return err(new ValidationError('固定費は0以上の値を入力してください'));
        }

        const settings = await this.userSettingsRepository.upsert({
            userId: input.userId,
            totalAssets: input.totalAssets,
            monthlyIncome: input.monthlyIncome,
            paydayDay: input.paydayDay,
            fixedExpenses,
            fixedExpensesDetail: input.fixedExpensesDetail,
            initialSetupCompleted: input.initialSetupCompleted,
        });
        return ok(settings);
    }
}
