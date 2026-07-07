import type { UserSettings } from '../models/UserSettings';

/** upsert 時の入力型: initialSetupCompleted / fixedExpensesDetail / savingsGoal は省略可（省略時は既存値を維持） */
export type UpsertSettingsInput = Omit<
    UserSettings,
    'id' | 'createdAt' | 'updatedAt' | 'initialSetupCompleted' | 'fixedExpensesDetail' | 'savingsGoal'
> & {
    initialSetupCompleted?: boolean;
    fixedExpensesDetail?: UserSettings['fixedExpensesDetail'];
    savingsGoal?: number;
};

export interface IUserSettingsRepository {
    /** ユーザーIDで設定を取得する（未設定時は null） */
    findByUserId(userId: string): Promise<UserSettings | null>;
    /** 設定を保存する（存在すれば更新、なければ作成） */
    upsert(settings: UpsertSettingsInput): Promise<UserSettings>;
}
