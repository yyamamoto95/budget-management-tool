/**
 * Settings 統合テスト（実 DB 使用）
 *
 * 【検証範囲】
 * - GET  /api/settings: 認証チェック、未設定時のデフォルト値返却
 * - PUT  /api/settings: 認証チェック、Zod バリデーション、DB への保存と上書き
 */

import { API_PATHS } from '@budget/api-client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../app';
import { PrismaExpenseRepository } from '../../infrastructure/persistence/PrismaExpenseRepository';
import { PrismaPasswordResetTokenRepository } from '../../infrastructure/persistence/PrismaPasswordResetTokenRepository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/persistence/PrismaRefreshTokenRepository';
import { PrismaSecurityAnswerRepository } from '../../infrastructure/persistence/PrismaSecurityAnswerRepository';
import { PrismaUserRepository } from '../../infrastructure/persistence/PrismaUserRepository';
import { PrismaUserSettingsRepository } from '../../infrastructure/persistence/PrismaUserSettingsRepository';
import { testPrisma, resetDatabase, seedTestData } from '../helpers/db';
import { TestAgent, testRequest } from '../helpers/testClient';

let dbAvailable = false;
try {
    await testPrisma.$connect();
    dbAvailable = true;
} catch {
    dbAvailable = false;
}

const describeIf = dbAvailable ? describe : describe.skip;

describeIf('Settings 統合テスト（実 DB）', () => {
    const prisma = new PrismaClient();
    const app = createApp({
        userRepository: new PrismaUserRepository(prisma),
        expenseRepository: new PrismaExpenseRepository(prisma),
        refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
        securityAnswerRepository: new PrismaSecurityAnswerRepository(prisma),
        passwordResetTokenRepository: new PrismaPasswordResetTokenRepository(prisma),
        userSettingsRepository: new PrismaUserSettingsRepository(prisma),
    });

    afterAll(async () => {
        await testPrisma.$disconnect();
        await prisma.$disconnect();
    });

    /** ログイン済みエージェントを返すヘルパー */
    async function loginClient(userId: string): Promise<TestAgent> {
        const client = new TestAgent(app);
        await client.login(API_PATHS.LOGIN, { userId, password: 'password123' });
        return client;
    }

    beforeEach(async () => {
        await resetDatabase();
        // user_settings テーブルも truncate（resetDatabase は budget_list/user_list のみ対象のため）
        await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0');
        await testPrisma.$executeRawUnsafe('TRUNCATE TABLE user_settings');
        await testPrisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1');
    });

    describe('GET /api/settings', () => {
        it('正常系: 未設定のとき totalAssets=0, monthlyIncome=0, paydayDay=25, fixedExpenses=0, initialSetupCompleted=false を返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            const res = await agent.get('/api/settings');
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                totalAssets: 0,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: 0,
                initialSetupCompleted: false,
            });
        });

        it('認証エラー: Bearer トークンなしで 401 を返す', async () => {
            const res = await testRequest(app, '/api/settings');
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/settings', () => {
        it('正常系: 全フィールドを保存して返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            const res = await agent.put('/api/settings', {
                totalAssets: 5000000,
                monthlyIncome: 200000,
                paydayDay: 25,
                fixedExpenses: 80000,
            });
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                totalAssets: 5000000,
                monthlyIncome: 200000,
                paydayDay: 25,
                fixedExpenses: 80000,
                initialSetupCompleted: false,
            });
        });

        it('正常系: initialSetupCompleted=true で保存・取得できる', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            const res = await agent.put('/api/settings', {
                totalAssets: 0,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: 0,
                initialSetupCompleted: true,
            });
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ initialSetupCompleted: true });

            const getRes = await agent.get('/api/settings');
            expect(getRes.body).toMatchObject({ initialSetupCompleted: true });
        });

        it('正常系: initialSetupCompleted を省略した更新で既存フラグが保持される', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            await agent.put('/api/settings', {
                totalAssets: 0,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: 0,
                initialSetupCompleted: true,
            });

            await agent.put('/api/settings', {
                totalAssets: 100000,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: 0,
            });

            const getRes = await agent.get('/api/settings');
            expect(getRes.body).toMatchObject({
                initialSetupCompleted: true,
                totalAssets: 100000,
            });
        });

        it('正常系: 給料日1日・固定費0円で保存できる', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            const res = await agent.put('/api/settings', {
                totalAssets: 1000000,
                monthlyIncome: 0,
                paydayDay: 1,
                fixedExpenses: 0,
            });
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({ paydayDay: 1, fixedExpenses: 0 });
        });

        it('正常系: 上書き保存できる', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            await agent.put('/api/settings', {
                totalAssets: 1000000,
                monthlyIncome: 100000,
                paydayDay: 20,
                fixedExpenses: 50000,
            });
            const res = await agent.put('/api/settings', {
                totalAssets: 2000000,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: 100000,
            });
            expect(res.status).toBe(200);
            expect(res.body).toMatchObject({
                totalAssets: 2000000,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: 100000,
            });
        });

        it('バリデーションエラー: totalAssets が負数のとき 400 を返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            const res = await agent.put('/api/settings', {
                totalAssets: -1,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: 0,
            });
            expect(res.status).toBe(400);
        });

        it('バリデーションエラー: paydayDay が 32 のとき 400 を返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            const res = await agent.put('/api/settings', {
                totalAssets: 0,
                monthlyIncome: 0,
                paydayDay: 32,
                fixedExpenses: 0,
            });
            expect(res.status).toBe(400);
        });

        it('バリデーションエラー: fixedExpenses が負数のとき 400 を返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const agent = await loginClient(users[0].userId);

            const res = await agent.put('/api/settings', {
                totalAssets: 0,
                monthlyIncome: 0,
                paydayDay: 25,
                fixedExpenses: -1,
            });
            expect(res.status).toBe(400);
        });

        it('認証エラー: Bearer トークンなしで 401 を返す', async () => {
            const res = await testRequest(app, '/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    totalAssets: 1000000,
                    monthlyIncome: 0,
                    paydayDay: 25,
                    fixedExpenses: 0,
                }),
            });
            expect(res.status).toBe(401);
        });
    });
});
