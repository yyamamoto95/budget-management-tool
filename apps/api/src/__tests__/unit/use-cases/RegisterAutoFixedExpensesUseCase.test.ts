import { describe, expect, it, vi } from 'vitest';
import { RegisterAutoFixedExpensesUseCase } from '../../../application/use-cases/dashboard/RegisterAutoFixedExpensesUseCase';
import type { UserSettings } from '../../../domain/models/UserSettings';
import type { IAutoFixedRegistrar } from '../../../domain/repositories/IAutoFixedRegistrar';
import type { IUserSettingsRepository } from '../../../domain/repositories/IUserSettingsRepository';

const baseSettings: UserSettings = {
    id: 'ulid-001',
    userId: 'user-1',
    totalAssets: 1_000_000,
    monthlyIncome: 250_000,
    paydayDay: 25,
    fixedExpenses: 97_000,
    fixedExpensesDetail: {
        rent: 85_000,
        utilities: 12_000,
        insurance: 0,
        subscriptions: 0,
        transportation: 0,
        other: 0,
    },
    savingsGoal: 30_000,
    initialSetupCompleted: true,
    autoFixedEnabled: true,
    autoFixedDay: 15,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
};

function makeDeps(settings: UserSettings | null, registered = true) {
    const settingsRepo: IUserSettingsRepository = {
        findByUserId: vi.fn().mockResolvedValue(settings),
        upsert: vi.fn(),
    };
    const registrar: IAutoFixedRegistrar = {
        registerOnce: vi.fn().mockResolvedValue(registered),
    };
    return { settingsRepo, registrar };
}

describe('RegisterAutoFixedExpensesUseCase', () => {
    const today = new Date('2026-07-20T09:00:00+09:00');

    it('オンかつ登録日を過ぎているとき、当月分の明細をレジストラへ渡す', async () => {
        const { settingsRepo, registrar } = makeDeps(baseSettings);
        const useCase = new RegisterAutoFixedExpensesUseCase(settingsRepo, registrar);

        const result = await useCase.execute('user-1', today);

        expect(result).toBe(true);
        expect(registrar.registerOnce).toHaveBeenCalledWith('user-1', '2026-07', [
            expect.objectContaining({
                amount: 85_000,
                categoryId: 5,
                content: '家賃（自動登録）',
                date: '2026-07-15',
                balanceType: 0,
            }),
            expect.objectContaining({ amount: 12_000, content: '光熱費（自動登録）' }),
        ]);
    });

    it('オフのときは何もしない', async () => {
        const { settingsRepo, registrar } = makeDeps({ ...baseSettings, autoFixedEnabled: false });
        const useCase = new RegisterAutoFixedExpensesUseCase(settingsRepo, registrar);

        expect(await useCase.execute('user-1', today)).toBe(false);
        expect(registrar.registerOnce).not.toHaveBeenCalled();
    });

    it('登録日前は何もしない', async () => {
        const { settingsRepo, registrar } = makeDeps({ ...baseSettings, autoFixedDay: 25 });
        const useCase = new RegisterAutoFixedExpensesUseCase(settingsRepo, registrar);

        expect(await useCase.execute('user-1', today)).toBe(false);
        expect(registrar.registerOnce).not.toHaveBeenCalled();
    });

    it('設定未作成・固定費内訳が空のときは何もしない', async () => {
        const noSettings = makeDeps(null);
        expect(
            await new RegisterAutoFixedExpensesUseCase(
                noSettings.settingsRepo,
                noSettings.registrar
            ).execute('user-1', today)
        ).toBe(false);

        const emptyDetail = makeDeps({ ...baseSettings, fixedExpensesDetail: null });
        expect(
            await new RegisterAutoFixedExpensesUseCase(
                emptyDetail.settingsRepo,
                emptyDetail.registrar
            ).execute('user-1', today)
        ).toBe(false);
        expect(emptyDetail.registrar.registerOnce).not.toHaveBeenCalled();
    });

    it('登録済み（レジストラが false）のときは false を返す', async () => {
        const { settingsRepo, registrar } = makeDeps(baseSettings, false);
        const useCase = new RegisterAutoFixedExpensesUseCase(settingsRepo, registrar);

        expect(await useCase.execute('user-1', today)).toBe(false);
    });
});
