import { Prisma, type PrismaClient } from '@prisma/client';
import { ulid } from 'ulid';
import type { FixedExpensesDetail, UserSettings } from '../../domain/models/UserSettings';
import type { IUserSettingsRepository, UpsertSettingsInput } from '../../domain/repositories/IUserSettingsRepository';

/** FixedExpensesDetail を Prisma JSON 入力値に変換する */
function toPrismaJson(
    detail: FixedExpensesDetail | null | undefined
): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    if (detail === undefined) return undefined;
    if (detail === null) return Prisma.JsonNull;
    return detail as unknown as Prisma.InputJsonValue;
}

/** JSON カラムから FixedExpensesDetail へ安全に変換する */
function parseFixedExpensesDetail(json: unknown): FixedExpensesDetail | null {
    if (json == null || typeof json !== 'object') return null;
    const obj = json as Record<string, unknown>;
    if (
        typeof obj.rent !== 'number' ||
        typeof obj.utilities !== 'number' ||
        typeof obj.insurance !== 'number' ||
        typeof obj.subscriptions !== 'number' ||
        typeof obj.transportation !== 'number' ||
        typeof obj.other !== 'number'
    ) {
        return null;
    }
    return {
        rent: obj.rent,
        utilities: obj.utilities,
        insurance: obj.insurance,
        subscriptions: obj.subscriptions,
        transportation: obj.transportation,
        other: obj.other,
    };
}

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
            fixedExpensesDetail: parseFixedExpensesDetail(record.fixedExpensesDetail),
            savingsGoal: record.savingsGoal,
            initialSetupCompleted: record.initialSetupCompleted,
            autoFixedEnabled: record.autoFixedEnabled,
            autoFixedDay: record.autoFixedDay,
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
                fixedExpensesDetail: toPrismaJson(settings.fixedExpensesDetail),
                savingsGoal: settings.savingsGoal ?? 0,
                initialSetupCompleted: settings.initialSetupCompleted ?? false,
                autoFixedEnabled: settings.autoFixedEnabled ?? false,
                autoFixedDay: settings.autoFixedDay ?? 27,
            },
            update: {
                totalAssets: settings.totalAssets,
                monthlyIncome: settings.monthlyIncome,
                paydayDay: settings.paydayDay,
                fixedExpenses: settings.fixedExpenses,
                ...(settings.fixedExpensesDetail !== undefined && {
                    fixedExpensesDetail: toPrismaJson(settings.fixedExpensesDetail),
                }),
                ...(settings.savingsGoal !== undefined && {
                    savingsGoal: settings.savingsGoal,
                }),
                ...(settings.initialSetupCompleted !== undefined && {
                    initialSetupCompleted: settings.initialSetupCompleted,
                }),
                ...(settings.autoFixedEnabled !== undefined && {
                    autoFixedEnabled: settings.autoFixedEnabled,
                }),
                ...(settings.autoFixedDay !== undefined && {
                    autoFixedDay: settings.autoFixedDay,
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
            fixedExpensesDetail: parseFixedExpensesDetail(record.fixedExpensesDetail),
            savingsGoal: record.savingsGoal,
            initialSetupCompleted: record.initialSetupCompleted,
            autoFixedEnabled: record.autoFixedEnabled,
            autoFixedDay: record.autoFixedDay,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
}
