import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetDashboardUseCase } from '../../../application/use-cases/dashboard/GetDashboardUseCase';
import { Expense } from '../../../domain/models/Expense';
import type { IExpenseRepository } from '../../../domain/repositories/IExpenseRepository';
import type { IUserSettingsRepository } from '../../../domain/repositories/IUserSettingsRepository';
import type { UserSettings } from '../../../domain/models/UserSettings';

/** YYYY-MM-DD 形式でローカル日付を返す（UseCase 内の toDateString と同じ規約） */
function localDateStr(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function makeExpense(overrides: { date: string; amount: number; balanceType?: 0 | 1 }): Expense {
    return Expense.reconstruct({
        id: `01TEST${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
        amount: overrides.amount,
        balanceType: overrides.balanceType ?? 0,
        userId: 'user-001',
        categoryId: 1,
        content: null,
        date: overrides.date,
        createdDate: new Date(),
        updatedDate: new Date(),
        deletedDate: null,
    });
}

const settings: UserSettings = {
    id: 'ulid-001',
    userId: 'user-001',
    totalAssets: 960_000,
    monthlyIncome: 250_000,
    paydayDay: 25,
    fixedExpenses: 100_000,
    fixedExpensesDetail: null,
    savingsGoal: 0,
    initialSetupCompleted: true,
    createdAt: new Date('2026-05-08T00:00:00.000Z'),
    updatedAt: new Date('2026-05-08T00:00:00.000Z'),
};

const expenseRepo: IExpenseRepository = {
    findByUserId: vi.fn(),
    findById: vi.fn(),
    save: vi.fn(),
    update: vi.fn(),
    softDelete: vi.fn(),
} as unknown as IExpenseRepository;

const settingsRepo: IUserSettingsRepository = {
    findByUserId: vi.fn(),
    upsert: vi.fn(),
};

describe('GetDashboardUseCase — dailyBudget の貯蓄目標控除（#457）', () => {
    let useCase: GetDashboardUseCase;

    beforeEach(() => {
        vi.clearAllMocks();
        useCase = new GetDashboardUseCase(expenseRepo, settingsRepo);
    });

    it('savingsGoal が設定されているとき、可処分残高から控除して1日予算を算出する', async () => {
        vi.mocked(expenseRepo.findByUserId).mockResolvedValue([]);
        vi.mocked(settingsRepo.findByUserId).mockResolvedValue({ ...settings, savingsGoal: 60_000 });

        const withGoal = await useCase.execute('user-001');

        vi.mocked(settingsRepo.findByUserId).mockResolvedValue(settings);
        const withoutGoal = await useCase.execute('user-001');

        expect(withGoal.dailyBudget).not.toBeNull();
        expect(withoutGoal.dailyBudget).not.toBeNull();
        // 同一日数で割るため、控除分だけ1日予算が小さくなる
        const days = withGoal.dailyBudget?.daysUntilPayday ?? 1;
        expect(withGoal.dailyBudget?.amount).toBe(
            Math.floor((settings.totalAssets - settings.fixedExpenses - 60_000) / days)
        );
        expect((withoutGoal.dailyBudget?.amount ?? 0) > (withGoal.dailyBudget?.amount ?? 0)).toBe(true);
    });
});

describe('GetDashboardUseCase — livingMargin 入力の導出', () => {
    let useCase: GetDashboardUseCase;

    beforeEach(() => {
        vi.clearAllMocks();
        useCase = new GetDashboardUseCase(expenseRepo, settingsRepo);
    });

    it('初回設定完了済みのとき、totalAssets と monthlyIncome が設定値になる', async () => {
        vi.mocked(expenseRepo.findByUserId).mockResolvedValue([makeExpense({ date: localDateStr(0), amount: 3000 })]);
        vi.mocked(settingsRepo.findByUserId).mockResolvedValue(settings);

        const result = await useCase.execute('user-001');

        expect(result.livingMargin.totalAssets).toBe(960_000);
        expect(result.livingMargin.monthlyIncome).toBe(250_000);
    });

    it('初回設定が未完了のとき、totalAssets は null（未設定扱い）になる', async () => {
        vi.mocked(expenseRepo.findByUserId).mockResolvedValue([]);
        vi.mocked(settingsRepo.findByUserId).mockResolvedValue({
            ...settings,
            initialSetupCompleted: false,
        });

        const result = await useCase.execute('user-001');

        expect(result.livingMargin.totalAssets).toBeNull();
    });

    it('入力データが30日未満のとき、保有日数（最古記録日〜今日）で日次平均を割る', async () => {
        // 4日前から今日までの5日間で計 10,000円 → 平均 2,000円/日
        vi.mocked(expenseRepo.findByUserId).mockResolvedValue([
            makeExpense({ date: localDateStr(4), amount: 4000 }),
            makeExpense({ date: localDateStr(2), amount: 3000 }),
            makeExpense({ date: localDateStr(0), amount: 3000 }),
        ]);
        vi.mocked(settingsRepo.findByUserId).mockResolvedValue(settings);

        const result = await useCase.execute('user-001');

        expect(result.livingMargin.avgDailyExpense).toBeCloseTo(2000, 5);
        expect(result.livingMargin.recordedDays).toBe(3);
    });

    it('30日より古い記録があるとき、直近30日分の合計を30で割る', async () => {
        vi.mocked(expenseRepo.findByUserId).mockResolvedValue([
            // 60日前の記録（30日窓の外・保有日数の起点）
            makeExpense({ date: localDateStr(60), amount: 99_999 }),
            // 窓内の記録: 計 60,000円 → 60000 / 30 = 2,000円/日
            makeExpense({ date: localDateStr(10), amount: 30_000 }),
            makeExpense({ date: localDateStr(5), amount: 30_000 }),
        ]);
        vi.mocked(settingsRepo.findByUserId).mockResolvedValue(settings);

        const result = await useCase.execute('user-001');

        expect(result.livingMargin.avgDailyExpense).toBeCloseTo(2000, 5);
    });

    it('収入記録は日次平均支出に含まれないが、記録日数には数える', async () => {
        vi.mocked(expenseRepo.findByUserId).mockResolvedValue([
            makeExpense({ date: localDateStr(1), amount: 200_000, balanceType: 1 }),
            makeExpense({ date: localDateStr(0), amount: 3000 }),
        ]);
        vi.mocked(settingsRepo.findByUserId).mockResolvedValue(settings);

        const result = await useCase.execute('user-001');

        // 支出 3000円 / 保有2日 = 1500円/日（収入 200,000円 は含まない）
        expect(result.livingMargin.avgDailyExpense).toBeCloseTo(1500, 5);
        expect(result.livingMargin.recordedDays).toBe(2);
    });

    it('記録が1件もないとき、avgDailyExpense は 0 になる', async () => {
        vi.mocked(expenseRepo.findByUserId).mockResolvedValue([]);
        vi.mocked(settingsRepo.findByUserId).mockResolvedValue(settings);

        const result = await useCase.execute('user-001');

        expect(result.livingMargin.avgDailyExpense).toBe(0);
        expect(result.livingMargin.recordedDays).toBe(0);
    });
});
