/**
 * Expense 統合テスト（実 DB 使用）
 *
 * 【検証範囲】
 * - POST /api/expense: 認証チェック、Zod バリデーション、DB への実際の保存ロジック
 * - GET  /api/expense: 認証チェック、DB からの全件取得
 * - DELETE /api/expense/:id: 認証チェック、DB からの削除
 *
 * 【冪等性】
 * - beforeEach で resetDatabase() を実行し、各テストは独立した状態から開始する
 * - ID は seedTestData() 経由で ulid() により動的に生成する
 */

import { API_PATHS } from '@budget/api-client';
import type { ExpenseResponse, GetExpensesResponse } from '@budget/api-client';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
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

describeIf('Expense 統合テスト（実 DB）', () => {
    const prisma = new PrismaClient();
    const app = createApp({
        userRepository: new PrismaUserRepository(prisma),
        expenseRepository: new PrismaExpenseRepository(prisma),
        budgetRepository: new PrismaBudgetRepository(prisma),
        refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
        securityAnswerRepository: new PrismaSecurityAnswerRepository(prisma),
        passwordResetTokenRepository: new PrismaPasswordResetTokenRepository(prisma),
    });

    afterAll(async () => {
        await testPrisma.$disconnect();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await resetDatabase();
    });

    /** ログイン済みエージェントを返すヘルパー（seed された userId を使用） */
    async function loginClient(userId: string) {
        const client = new TestAgent(app);
        await client.login(API_PATHS.LOGIN, { userId, password: 'password123' });
        return client;
    }

    // ------------------------------------------------------------------
    // GET /api/expense
    // ------------------------------------------------------------------
    describe('GET /api/expense', () => {
        it('正常系 200: ログイン済みで全件取得できる', async () => {
            const { users } = await seedTestData({ pattern: 'lastMonthHeavyUser' });
            const client = await loginClient(users[0].userId);

            const res = await client.get(API_PATHS.EXPENSE);
            expect(res.status).toBe(200);
            // 前月 15 件 + 収入 1 件 = 16 件
            expect((res.body as GetExpensesResponse).expense).toHaveLength(16);
        });

        it('正常系 200: managerUser シナリオで複数カテゴリの支出を取得できる', async () => {
            const { users, budgets } = await seedTestData({ pattern: 'managerUser' });
            const client = await loginClient(users[0].userId);

            const res = await client.get(API_PATHS.EXPENSE);
            expect(res.status).toBe(200);
            expect((res.body as GetExpensesResponse).expense).toHaveLength(budgets.length);

            // 複数カテゴリが含まれていることを確認
            const categoryIds = (res.body as GetExpensesResponse).expense.map((e: ExpenseResponse) => e.categoryId);
            const uniqueCategories = new Set(categoryIds);
            expect(uniqueCategories.size).toBeGreaterThan(1);
        });

        it('正常系 200: resetDatabase 後は空配列を返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = await loginClient(users[0].userId);

            const res = await client.get(API_PATHS.EXPENSE);
            expect(res.status).toBe(200);
            expect((res.body as GetExpensesResponse).expense).toHaveLength(0);
        });

        it('異常系 401: 未認証は 401 を返す', async () => {
            const res = await testRequest(app, API_PATHS.EXPENSE);
            expect(res.status).toBe(401);
        });
    });

    // ------------------------------------------------------------------
    // POST /api/expense — DB 保存ロジックの正常性検証
    // ------------------------------------------------------------------
    describe('POST /api/expense', () => {
        it('正常系 200: 有効なデータが DB に保存され、ID が返される', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = await loginClient(users[0].userId);
            const today = new Date().toISOString().slice(0, 10);

            const res = await client.post(API_PATHS.EXPENSE, {
                newData: {
                    amount: 3000,
                    balanceType: 0,
                    userId: users[0].userId,
                    date: today,
                    content: '統合テスト用支出',
                },
            });

            expect(res.status).toBe(200);
            const body = res.body as { expense: ExpenseResponse };
            expect(body.expense).toBeDefined();
            // DB に保存された ID は ulid 形式（26文字）
            expect(body.expense.id).toHaveLength(26);
            expect(body.expense.amount).toBe(3000);
            expect(body.expense.userId).toBe(users[0].userId);
        });

        it('正常系 200: 保存後に GET で一覧に反映されている', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = await loginClient(users[0].userId);
            const today = new Date().toISOString().slice(0, 10);

            await client.post(API_PATHS.EXPENSE, {
                newData: {
                    amount: 5000,
                    balanceType: 1,
                    userId: users[0].userId,
                    date: today,
                    content: '収入テスト',
                },
            });

            const listRes = await client.get(API_PATHS.EXPENSE);
            expect(listRes.status).toBe(200);
            expect((listRes.body as GetExpensesResponse).expense).toHaveLength(1);
            expect((listRes.body as GetExpensesResponse).expense[0].amount).toBe(5000);
        });

        it('異常系 400: amount が 0 のとき Zod バリデーションエラーを返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = await loginClient(users[0].userId);

            const res = await client.post(API_PATHS.EXPENSE, {
                newData: {
                    amount: 0,
                    balanceType: 0,
                    userId: users[0].userId,
                    date: '2024-01-01',
                },
            });

            expect(res.status).toBe(400);
            expect((res.body as Record<string, unknown>).result).toBe('error');
        });

        it('異常系 400: balanceType が 0/1 以外のとき Zod バリデーションエラーを返す', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = await loginClient(users[0].userId);

            const res = await client.post(API_PATHS.EXPENSE, {
                newData: {
                    amount: 1000,
                    balanceType: 2,
                    userId: users[0].userId,
                    date: '2024-01-01',
                },
            });

            expect(res.status).toBe(400);
            expect((res.body as Record<string, unknown>).result).toBe('error');
        });

        it('異常系 401: 未認証は 401 を返す', async () => {
            const res = await testRequest(app, API_PATHS.EXPENSE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newData: { amount: 1000, balanceType: 0, userId: 'user-1', date: '2024-01-01' },
                }),
            });
            expect(res.status).toBe(401);
        });

        // edgeCases シナリオ: 実運用のイレギュラーデータでも正常動作することを確認
        it('正常系: edgeCases シナリオのデータが正しく取得できる', async () => {
            const { users, budgets } = await seedTestData({ pattern: 'edgeCases' });
            const client = await loginClient(users[0].userId);

            const res = await client.get(API_PATHS.EXPENSE);
            expect(res.status).toBe(200);
            expect((res.body as GetExpensesResponse).expense).toHaveLength(budgets.length);

            // 最小金額（1円）が含まれている
            const minEntry = (res.body as GetExpensesResponse).expense.find((e: ExpenseResponse) => e.amount === 1);
            expect(minEntry).toBeDefined();

            // content が null のエントリが含まれている
            const nullContent = (res.body as GetExpensesResponse).expense.find(
                (e: ExpenseResponse) => e.content === null
            );
            expect(nullContent).toBeDefined();
        });
    });

    // ------------------------------------------------------------------
    // DELETE /api/expense/:id
    // ------------------------------------------------------------------
    describe('DELETE /api/expense/:id', () => {
        it('正常系 200: 指定 ID の支出が DB から削除される', async () => {
            const { users } = await seedTestData({ pattern: 'minimal' });
            const client = await loginClient(users[0].userId);

            // まず支出を 1 件登録
            const today = new Date().toISOString().slice(0, 10);
            const postRes = await client.post(API_PATHS.EXPENSE, {
                newData: {
                    amount: 1000,
                    balanceType: 0,
                    userId: users[0].userId,
                    date: today,
                    content: '削除対象',
                },
            });
            const expenseId = (postRes.body as { expense: ExpenseResponse }).expense.id;

            // 削除
            const deleteRes = await client.delete(`${API_PATHS.EXPENSE}/${expenseId}`);
            expect(deleteRes.status).toBe(200);

            // 削除後は一覧に含まれない
            const listRes = await client.get(API_PATHS.EXPENSE);
            const ids = (listRes.body as GetExpensesResponse).expense.map((e: ExpenseResponse) => e.id);
            expect(ids).not.toContain(expenseId);
        });

        it('異常系 401: 未認証は 401 を返す', async () => {
            const res = await testRequest(app, `${API_PATHS.EXPENSE}/some-id`, { method: 'DELETE' });
            expect(res.status).toBe(401);
        });
    });
});
