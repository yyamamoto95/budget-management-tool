import type { CreateExpenseInput, UpdateExpenseInput } from '@budget/common';
import { createRoute, z } from '@hono/zod-openapi';
import type { RouteServices } from '../../app';
import type { Expense } from '../../domain/models/Expense';
import { createOpenAPIApp } from '../../lib/openapi-app';
import {
    CreateExpenseBodySchema,
    ErrorResponseSchema,
    ExpenseResponseSchema,
    IdParamSchema,
    UpdateExpenseBodySchema,
} from '../../openapi/schemas';
import { createAuthMiddleware } from '../middleware/auth';

/** Date フィールドを ISO 文字列に変換してレスポンス用 DTO を生成する */
function serializeExpense(e: Expense) {
    return {
        id: e.id,
        amount: e.amount,
        balanceType: e.balanceType,
        userId: e.userId,
        categoryId: e.categoryId,
        content: e.content,
        date: e.date,
        createdDate: e.createdDate.toISOString(),
        updatedDate: e.updatedDate.toISOString(),
        deletedDate: e.deletedDate?.toISOString() ?? null,
    };
}

// ─── レスポンス用複合スキーマ ─────────────────────────────────────

const ExpenseListResponseSchema = z.object({ expense: z.array(ExpenseResponseSchema) }).openapi('ExpenseListResponse');

const ExpenseDetailResponseSchema = z.object({ expense: ExpenseResponseSchema }).openapi('ExpenseDetailResponse');

// ─── Route 定義 ──────────────────────────────────────────────────

const getExpensesRoute = createRoute({
    method: 'get',
    path: '/expense',
    tags: ['Expense'],
    summary: '支出一覧取得',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            content: { 'application/json': { schema: ExpenseListResponseSchema } },
            description: '支出一覧',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

const getExpenseRoute = createRoute({
    method: 'get',
    path: '/expense/{id}',
    tags: ['Expense'],
    summary: '支出詳細取得',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
        200: {
            content: { 'application/json': { schema: ExpenseDetailResponseSchema } },
            description: '支出詳細',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
        404: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'リソースが見つからない',
        },
    },
});

const createExpenseRoute = createRoute({
    method: 'post',
    path: '/expense',
    tags: ['Expense'],
    summary: '支出登録',
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { 'application/json': { schema: CreateExpenseBodySchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: ExpenseDetailResponseSchema } },
            description: '登録成功',
        },
        400: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'バリデーションエラー',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

const updateExpenseRoute = createRoute({
    method: 'put',
    path: '/expense/{id}',
    tags: ['Expense'],
    summary: '支出更新',
    security: [{ bearerAuth: [] }],
    request: {
        params: IdParamSchema,
        body: { content: { 'application/json': { schema: UpdateExpenseBodySchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: ExpenseDetailResponseSchema } },
            description: '更新成功',
        },
        400: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'バリデーションエラー',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

const deleteExpenseRoute = createRoute({
    method: 'delete',
    path: '/expense/{id}',
    tags: ['Expense'],
    summary: '支出削除',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
        200: {
            content: { 'application/json': { schema: z.object({ result: z.literal('success') }) } },
            description: '削除成功',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

// ─── Handler 実装 ────────────────────────────────────────────────

export function createExpenseRoutes({
    tokenService,
    expenseRepository,
    createExpenseUseCase,
    updateExpenseUseCase,
}: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    // 全 Expense ルートに Bearer 認証を適用
    app.use('/expense', auth);
    app.use('/expense/*', auth);

    app.openapi(getExpensesRoute, async (c) => {
        const expenses = await expenseRepository.findAll();
        return c.json({ expense: expenses.map(serializeExpense) }, 200);
    });

    app.openapi(getExpenseRoute, async (c) => {
        const { id } = c.req.valid('param');
        const expense = await expenseRepository.findById(id);
        if (!expense) {
            return c.json({ result: 'error' as const, message: 'リソースが見つかりません' }, 404);
        }
        return c.json({ expense: serializeExpense(expense) }, 200);
    });

    app.openapi(createExpenseRoute, async (c) => {
        const { newData } = c.req.valid('json');
        const expense = await createExpenseUseCase.execute(newData as CreateExpenseInput);
        return c.json({ expense: serializeExpense(expense) }, 200);
    });

    app.openapi(updateExpenseRoute, async (c) => {
        const { id } = c.req.valid('param');
        const { updateData } = c.req.valid('json');
        const expense = await updateExpenseUseCase.execute(id, updateData as UpdateExpenseInput);
        return c.json({ expense: serializeExpense(expense) }, 200);
    });

    app.openapi(deleteExpenseRoute, async (c) => {
        const { id } = c.req.valid('param');
        await expenseRepository.remove(id);
        return c.json({ result: 'success' as const }, 200);
    });

    return app;
}
