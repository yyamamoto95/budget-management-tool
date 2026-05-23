import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UpsertUserSettingsUseCase } from '../../../application/use-cases/settings/UpsertUserSettingsUseCase';
import type { IUserSettingsRepository } from '../../../domain/repositories/IUserSettingsRepository';
import type { UserSettings } from '../../../domain/models/UserSettings';
import { ValidationError } from '../../../shared/errors/DomainException';

const mockSettings: UserSettings = {
    id: 'ulid-001',
    userId: 'user-001',
    totalAssets: 5000000,
    monthlyIncome: 200000,
    paydayDay: 25,
    fixedExpenses: 80000,
    initialSetupCompleted: false,
    createdAt: new Date('2026-05-08T00:00:00.000Z'),
    updatedAt: new Date('2026-05-08T00:00:00.000Z'),
};

const mockRepo: IUserSettingsRepository = {
    findByUserId: vi.fn(),
    upsert: vi.fn(),
};

const validInput = {
    userId: 'user-001',
    totalAssets: 5000000,
    monthlyIncome: 200000,
    paydayDay: 25,
    fixedExpenses: 80000,
};

describe('UpsertUserSettingsUseCase', () => {
    let useCase: UpsertUserSettingsUseCase;

    beforeEach(() => {
        vi.clearAllMocks();
        useCase = new UpsertUserSettingsUseCase(mockRepo);
    });

    it('正常系: 全フィールドを保存できる', async () => {
        vi.mocked(mockRepo.upsert).mockResolvedValue(mockSettings);

        const result = await useCase.execute(validInput);

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value).toEqual(mockSettings);
        }
        expect(mockRepo.upsert).toHaveBeenCalledWith(validInput);
    });

    it('正常系: 月次収入 0 で保存できる', async () => {
        vi.mocked(mockRepo.upsert).mockResolvedValue({
            ...mockSettings,
            monthlyIncome: 0,
        });

        const result = await useCase.execute({ ...validInput, monthlyIncome: 0 });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.monthlyIncome).toBe(0);
        }
    });

    it('正常系: 総資産 0 で保存できる', async () => {
        vi.mocked(mockRepo.upsert).mockResolvedValue({
            ...mockSettings,
            totalAssets: 0,
        });

        const result = await useCase.execute({ ...validInput, totalAssets: 0 });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.totalAssets).toBe(0);
        }
    });

    it('正常系: 給料日 1 で保存できる（最小値）', async () => {
        vi.mocked(mockRepo.upsert).mockResolvedValue({
            ...mockSettings,
            paydayDay: 1,
        });

        const result = await useCase.execute({ ...validInput, paydayDay: 1 });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.paydayDay).toBe(1);
        }
    });

    it('正常系: 給料日 31 で保存できる（最大値）', async () => {
        vi.mocked(mockRepo.upsert).mockResolvedValue({
            ...mockSettings,
            paydayDay: 31,
        });

        const result = await useCase.execute({ ...validInput, paydayDay: 31 });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.paydayDay).toBe(31);
        }
    });

    it('異常系: 総資産が負数のとき ok=false で ValidationError を返す', async () => {
        const result = await useCase.execute({ ...validInput, totalAssets: -1 });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(ValidationError);
        }
    });

    it('異常系: 月次収入が負数のとき ok=false で ValidationError を返す', async () => {
        const result = await useCase.execute({ ...validInput, monthlyIncome: -1 });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(ValidationError);
        }
    });

    it('異常系: 給料日が 0 のとき ok=false で ValidationError を返す', async () => {
        const result = await useCase.execute({ ...validInput, paydayDay: 0 });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(ValidationError);
        }
    });

    it('異常系: 給料日が 32 のとき ok=false で ValidationError を返す', async () => {
        const result = await useCase.execute({ ...validInput, paydayDay: 32 });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(ValidationError);
        }
    });

    it('異常系: 固定費が負数のとき ok=false で ValidationError を返す', async () => {
        const result = await useCase.execute({ ...validInput, fixedExpenses: -1 });

        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error).toBeInstanceOf(ValidationError);
        }
    });

    it('正常系: initialSetupCompleted=true で保存できる', async () => {
        vi.mocked(mockRepo.upsert).mockResolvedValue({
            ...mockSettings,
            initialSetupCompleted: true,
        });

        const result = await useCase.execute({
            ...validInput,
            initialSetupCompleted: true,
        });

        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.initialSetupCompleted).toBe(true);
        }
        expect(mockRepo.upsert).toHaveBeenCalledWith({
            ...validInput,
            initialSetupCompleted: true,
        });
    });

    it('正常系: initialSetupCompleted を省略した場合もリポジトリが呼ばれる', async () => {
        vi.mocked(mockRepo.upsert).mockResolvedValue(mockSettings);

        const result = await useCase.execute(validInput);

        expect(result.ok).toBe(true);
        expect(mockRepo.upsert).toHaveBeenCalledWith(validInput);
    });
});
