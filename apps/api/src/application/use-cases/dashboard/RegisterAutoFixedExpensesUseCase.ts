import {
    autoFixedYearMonth,
    buildAutoFixedEntries,
    shouldRegisterAutoFixed,
} from '@budget/common';
import type { IAutoFixedRegistrar } from '../../../domain/repositories/IAutoFixedRegistrar';
import type { IUserSettingsRepository } from '../../../domain/repositories/IUserSettingsRepository';

/**
 * 固定費の毎月自動登録（#552・アクセス時遅延登録方式）。
 * ダッシュボード取得の前段で呼ばれ、「オン かつ 今月の登録日を過ぎている かつ 今月分未登録」
 * のときだけ当月分の明細を登録する。判定・明細組み立ては @budget/common の純粋関数に委譲する。
 */
export class RegisterAutoFixedExpensesUseCase {
    constructor(
        private readonly userSettingsRepository: IUserSettingsRepository,
        private readonly autoFixedRegistrar: IAutoFixedRegistrar
    ) {}

    /** @returns 登録を実行した場合 true（スキップ・登録済みは false） */
    async execute(userId: string, today: Date = new Date()): Promise<boolean> {
        const settings = await this.userSettingsRepository.findByUserId(userId);
        if (!settings) return false;
        if (
            !shouldRegisterAutoFixed({
                enabled: settings.autoFixedEnabled,
                day: settings.autoFixedDay,
                today,
            })
        ) {
            return false;
        }

        const entries = buildAutoFixedEntries(settings.fixedExpensesDetail, {
            today,
            day: settings.autoFixedDay,
        });
        if (entries.length === 0) return false;

        return this.autoFixedRegistrar.registerOnce(userId, autoFixedYearMonth(today), entries);
    }
}
