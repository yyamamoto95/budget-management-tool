/** 固定費内訳（6 項目） */
export type FixedExpensesDetail = {
    /** 家賃 */
    rent: number;
    /** 光熱費 */
    utilities: number;
    /** 保険 */
    insurance: number;
    /** サブスク */
    subscriptions: number;
    /** 交通費 */
    transportation: number;
    /** その他 */
    other: number;
};

/** ユーザー設定ドメインモデル（総資産・月次収入・給料日・固定費・貯蓄目標・初回設定完了フラグ） */
export type UserSettings = {
    id: string;
    userId: string;
    totalAssets: number;
    monthlyIncome: number;
    /** 給料日（月の何日か: 1〜31） */
    paydayDay: number;
    /** 月次固定費合計（円）— fixedExpensesDetail がある場合はその合計値 */
    fixedExpenses: number;
    /** 固定費内訳（null = 旧データ / 未設定） */
    fixedExpensesDetail: FixedExpensesDetail | null;
    /** 月間貯蓄目標（円）。1日予算の算出時に控除する */
    savingsGoal: number;
    /** 初回設定完了フラグ */
    initialSetupCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
};
