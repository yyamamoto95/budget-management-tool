/**
 * Auth 統合テスト（実 DB 使用）
 *
 * 【前提】
 * - docker-compose.test.yml の db_test コンテナが起動済みであること
 * - 環境変数は vitest.integration.config.ts が .env.test から自動注入する
 *
 * 【冪等性の保証】
 * - beforeEach で resetDatabase() を実行し、各テストが独立した DB 状態から開始する
 * - seedTestData() で動的 ID（ulid）を使用し、固定値は一切ハードコードしない
 */

import { API_PATHS } from '@budget/api-client';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../app';
import { PrismaBudgetRepository } from '../../infrastructure/persistence/PrismaBudgetRepository';
import { PrismaExpenseRepository } from '../../infrastructure/persistence/PrismaExpenseRepository';
import { PrismaPasswordResetTokenRepository } from '../../infrastructure/persistence/PrismaPasswordResetTokenRepository';
import { PrismaRefreshTokenRepository } from '../../infrastructure/persistence/PrismaRefreshTokenRepository';
import { PrismaSecurityAnswerRepository } from '../../infrastructure/persistence/PrismaSecurityAnswerRepository';
import { PrismaUserRepository } from '../../infrastructure/persistence/PrismaUserRepository';
import { testPrisma, resetDatabase, seedTestData } from '../helpers/db';
import { TestAgent, testRequest } from '../helpers/testClient';

// DB に接続できない場合はスキップ
let dbAvailable = false;
try {
    await testPrisma.$connect();
    dbAvailable = true;
} catch {
    dbAvailable = false;
}

const describeIf = dbAvailable ? describe : describe.skip;

describeIf('Auth 統合テスト（実 DB）', () => {
    const prisma = new PrismaClient();
    const app = createApp({
        userRepository: new PrismaUserRepository(prisma),
        expenseRepository: new PrismaExpenseRepository(prisma),
        budgetRepository: new PrismaBudgetRepository(prisma),
        refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
        securityAnswerRepository: new PrismaSecurityAnswerRepository(prisma),
        passwordResetTokenRepository: new PrismaPasswordResetTokenRepository(prisma),
    });

    beforeAll(async () => {
        if (!dbAvailable) return;
    });

    afterAll(async () => {
        await testPrisma.$disconnect();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // 各テスト前に DB をリセットし冪等性を担保
        await resetDatabase();
    });

    // ------------------------------------------------------------------
    // POST /api/login — 正常系
    // ------------------------------------------------------------------
    describe('POST /api/login', () => {
        it('正常系: シードされたユーザーでログインできる', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const { userId } = users[0];

            const res = await testRequest(app, API_PATHS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password: 'password123' }),
            });

            expect(res.status).toBe(200);
            expect((res.body as Record<string, unknown>).result).toBe('success');
            expect((res.body as Record<string, unknown>).userId).toBe(userId);
        });

        it('正常系: ログイン後のトークンで認証が維持される', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const { userId } = users[0];
            const client = new TestAgent(app);

            await client.login(API_PATHS.LOGIN, { userId, password: 'password123' });

            // JWT トークン保持確認: 認証が必要なエンドポイントにアクセスできる
            const res = await client.get(API_PATHS.EXPENSE);
            expect(res.status).toBe(200);
        });

        it('異常系: 存在しないユーザーは 401 を返す', async () => {
            const res = await testRequest(app, API_PATHS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'nonexistent-user', password: 'password123' }),
            });

            expect(res.status).toBe(401);
            expect((res.body as Record<string, unknown>).result).toBe('error');
        });

        it('異常系: パスワードが誤っている場合は 401 を返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const { userId } = users[0];

            const res = await testRequest(app, API_PATHS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, password: 'wrong-password' }),
            });

            expect(res.status).toBe(401);
            expect((res.body as Record<string, unknown>).result).toBe('error');
        });

        it('異常系: userId が空文字のとき Zod バリデーションエラー (400) を返す', async () => {
            const res = await testRequest(app, API_PATHS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: '', password: 'password123' }),
            });

            expect(res.status).toBe(400);
            expect((res.body as Record<string, unknown>).result).toBe('error');
        });

        it('異常系: password が未指定のとき Zod バリデーションエラー (400) を返す', async () => {
            const res = await testRequest(app, API_PATHS.LOGIN, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: 'some-user' }),
            });

            expect(res.status).toBe(400);
            expect((res.body as Record<string, unknown>).result).toBe('error');
        });
    });

    // ------------------------------------------------------------------
    // POST /api/logout
    // ------------------------------------------------------------------
    describe('POST /api/logout', () => {
        it('正常系: ログイン済みユーザーがログアウトできる', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = new TestAgent(app);

            await client.login(API_PATHS.LOGIN, { userId: users[0].userId, password: 'password123' });

            // refreshToken を含めた body を送信（Content-Type: application/json + 空 body は Malformed JSON になるため）
            const res = await client.post(API_PATHS.LOGOUT, { refreshToken: client.getRefreshToken() });
            expect(res.status).toBe(200);
            expect((res.body as Record<string, unknown>).result).toBe('success');
        });

        it('異常系: 未ログイン状態でのログアウトは 401 を返す', async () => {
            const res = await testRequest(app, API_PATHS.LOGOUT, { method: 'POST' });
            expect(res.status).toBe(401);
        });

        it('正常系: ログアウト後は認証が必要なエンドポイントに 401 で弾かれる', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = new TestAgent(app);

            await client.login(API_PATHS.LOGIN, { userId: users[0].userId, password: 'password123' });
            await client.post(API_PATHS.LOGOUT, { refreshToken: client.getRefreshToken() });

            const res = await client.get(API_PATHS.EXPENSE);
            expect(res.status).toBe(401);
        });
    });
});
