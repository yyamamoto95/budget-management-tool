import type { PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import type { UserSettings } from '../../domain/models/UserSettings';
import type { IUserSettingsRepository, UpsertSettingsInput } from '../../domain/repositories/IUserSettingsRepository';

export class PrismaUserSettingsRepository implements IUserSettingsRepository {
    constructor(private readonly prisma: PrismaClient) {}

    async findByUserId(userId: string): Promise<UserSettings | null> {
        const record = await this.prisma.userSettings.findUnique({
            where: { userId },
        });
        if (!record) return null;
        return {
            id: record.id,
            userId: record.userId,
            totalAssets: record.totalAssets,
            monthlyIncome: record.monthlyIncome,
            paydayDay: record.paydayDay,
            fixedExpenses: record.fixedExpenses,
            initialSetupCompleted: record.initialSetupCompleted,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }

    async upsert(settings: UpsertSettingsInput): Promise<UserSettings> {
        const record = await this.prisma.userSettings.upsert({
            where: { userId: settings.userId },
            create: {
                id: ulid(),
                userId: settings.userId,
                totalAssets: settings.totalAssets,
                monthlyIncome: settings.monthlyIncome,
                paydayDay: settings.paydayDay,
                fixedExpenses: settings.fixedExpenses,
                initialSetupCompleted: settings.initialSetupCompleted ?? false,
            },
            update: {
                totalAssets: settings.totalAssets,
                monthlyIncome: settings.monthlyIncome,
                paydayDay: settings.paydayDay,
                fixedExpenses: settings.fixedExpenses,
                ...(settings.initialSetupCompleted !== undefined && {
                    initialSetupCompleted: settings.initialSetupCompleted,
                }),
            },
        });
        return {
            id: record.id,
            userId: record.userId,
            totalAssets: record.totalAssets,
            monthlyIncome: record.monthlyIncome,
            paydayDay: record.paydayDay,
            fixedExpenses: record.fixedExpenses,
            initialSetupCompleted: record.initialSetupCompleted,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
}
