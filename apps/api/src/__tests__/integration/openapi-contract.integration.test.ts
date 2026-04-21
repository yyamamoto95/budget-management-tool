/**
 * OpenAPI 統合テスト（型レベル結合テスト）
 *
 * 【目的】
 * - OpenAPI スペック（packages/api-spec/openapi.json）が実際の API の振る舞いと一致することを検証する
 * - 生成された API クライアント（@budget/api-client）を通じて、型と実際のレスポンスが整合していることを確認する
 *
 * 【検証観点】
 * 1. POST /api/expense のレスポンスが ExpenseResponse 型に準拠している
 * 2. GET /api/expense のレスポンスが GetExpensesResponse 型に準拠している
 * 3. エラーレスポンスが ErrorResponse 型に準拠している
 * 4. 生成されたスキーマの必須フィールドがすべて実際のレスポンスに含まれている
 */

import { API_PATHS } from '@budget/api-client';
import type { ErrorResponse, ExpenseResponse, GetExpensesResponse } from '@budget/api-client';
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

/**
 * ExpenseResponse の必須フィールドをすべて持っているかを検証する型ガード。
 * OpenAPI スキーマと実レスポンスの整合性を実行時に確認する。
 */
function isValidExpenseResponse(obj: unknown): obj is ExpenseResponse {
    if (typeof obj !== 'object' || obj === null) return false;
    const e = obj as Record<string, unknown>;
    return (
        typeof e.id === 'string' &&
        typeof e.amount === 'number' &&
        (e.balanceType === 0 || e.balanceType === 1) &&
        typeof e.userId === 'string' &&
        typeof e.categoryId === 'number' &&
        typeof e.date === 'string' &&
        typeof e.createdDate === 'string' &&
        typeof e.updatedDate === 'string' &&
        (e.deletedDate === null || typeof e.deletedDate === 'string')
    );
}

/**
 * ErrorResponse の必須フィールドを検証する型ガード。
 */
function isValidErrorResponse(obj: unknown): obj is ErrorResponse {
    if (typeof obj !== 'object' || obj === null) return false;
    const e = obj as Record<string, unknown>;
    return e.result === 'error' && typeof e.message === 'string';
}

describeIf('OpenAPI 結合テスト: スキーマと実レスポンスの整合性検証', () => {
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

    async function loginClient(userId: string) {
        const client = new TestAgent(app);
        await client.login(API_PATHS.LOGIN, { userId, password: 'password123' });
        return client;
    }

    // ──────────────────────────────────────────────────────────────
    // POST /api/expense: レスポンスが ExpenseResponse 型に準拠
    // ──────────────────────────────────────────────────────────────
    it('POST /api/expense のレスポンスが OpenAPI スキーマの ExpenseResponse 型に準拠している', async () => {
        const { users } = await seedTestData({ pattern: 'minimal' });
        const client = await loginClient(users[0].userId);

        const res = await client.post(API_PATHS.EXPENSE, {
            newData: {
                amount: 1500,
                balanceType: 0,
                userId: users[0].userId,
                date: '2024-06-01',
                content: 'コントラクトテスト',
            },
        });

        expect(res.status).toBe(200);
        const body = res.body as { expense: unknown };
        const expense = body.expense;

        // 型ガードで全必須フィールドの存在と型を検証
        expect(isValidExpenseResponse(expense)).toBe(true);

        if (isValidExpenseResponse(expense)) {
            expect(expense.amount).toBe(1500);
            expect(expense.balanceType).toBe(0);
            expect(expense.userId).toBe(users[0].userId);
            // ULID: 26文字の文字列
            expect(expense.id).toHaveLength(26);
        }
    });

    // ──────────────────────────────────────────────────────────────
    // GET /api/expense: レスポンスが GetExpensesResponse 型に準拠
    // ──────────────────────────────────────────────────────────────
    it('GET /api/expense のレスポンスが OpenAPI スキーマの GetExpensesResponse 型に準拠している', async () => {
        const { users } = await seedTestData({ pattern: 'lastMonthHeavyUser' });
        const client = await loginClient(users[0].userId);

        const res = await client.get(API_PATHS.EXPENSE);

        expect(res.status).toBe(200);
        const body = res.body as GetExpensesResponse;

        expect(Array.isArray(body.expense)).toBe(true);
        // すべての要素が ExpenseResponse 型に準拠
        for (const item of body.expense) {
            expect(isValidExpenseResponse(item)).toBe(true);
        }
    });

    // ──────────────────────────────────────────────────────────────
    // エラーレスポンス: ErrorResponse 型に準拠
    // ──────────────────────────────────────────────────────────────
    it('未認証リクエストのエラーレスポンスが OpenAPI スキーマの ErrorResponse 型に準拠している', async () => {
        const res = await testRequest(app, API_PATHS.EXPENSE);

        expect(res.status).toBe(401);
        expect(isValidErrorResponse(res.body)).toBe(true);
    });

    it('Zod バリデーションエラーのレスポンスが OpenAPI スキーマの ErrorResponse 型に準拠している', async () => {
        const { users } = await seedTestData({ pattern: 'minimal' });
        const client = await loginClient(users[0].userId);

        // amount を -1（最小値 1 未満）にしてバリデーションエラーを発生させる
        const res = await client.post(API_PATHS.EXPENSE, {
            newData: {
                amount: -1,
                balanceType: 0,
                userId: users[0].userId,
                date: '2024-06-01',
            },
        });

        expect(res.status).toBe(400);
        expect(isValidErrorResponse(res.body)).toBe(true);
    });
});
