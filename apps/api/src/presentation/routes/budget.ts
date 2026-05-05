import { createRoute, z } from '@hono/zod-openapi';
import { createAuthMiddleware } from '../middleware/auth';
import { createOpenAPIApp } from '../../lib/openapi-app';
import type { Budget } from '../../domain/models/Budget';
import type { RouteServices } from '../../app';
import {
    BudgetResponseSchema,
    CreateBudgetBodySchema,
    ErrorResponseSchema,
    IdParamSchema,
} from '../../openapi/schemas';

/** Date フィールドを ISO 文字列に変換してレスポンス用 DTO を生成する */
function serializeBudget(b: Budget) {
    return {
        id: b.id,
        amount: b.amount,
        balanceType: b.balanceType,
        userId: b.userId,
        categoryId: b.categoryId,
        content: b.content,
        date: b.date,
        createdDate: b.createdDate.toISOString(),
        updatedDate: b.updatedDate.toISOString(),
        deletedDate: b.deletedDate?.toISOString() ?? null,
    };
}

// ─── レスポンス用複合スキーマ ─────────────────────────────────────

const BudgetListResponseSchema = z.object({ budget: z.array(BudgetResponseSchema) }).openapi('BudgetListResponse');

const BudgetDetailResponseSchema = z.object({ budget: BudgetResponseSchema }).openapi('BudgetDetailResponse');

// ─── Route 定義 ──────────────────────────────────────────────────

const getBudgetsRoute = createRoute({
    method: 'get',
    path: '/budget',
    tags: ['Budget'],
    summary: '予算一覧取得',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            content: { 'application/json': { schema: BudgetListResponseSchema } },
            description: '予算一覧',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

const getBudgetRoute = createRoute({
    method: 'get',
    path: '/budget/{id}',
    tags: ['Budget'],
    summary: '予算詳細取得',
    security: [{ bearerAuth: [] }],
    request: { params: IdParamSchema },
    responses: {
        200: {
            content: { 'application/json': { schema: BudgetDetailResponseSchema } },
            description: '予算詳細',
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

const createBudgetRoute = createRoute({
    method: 'post',
    path: '/budget',
    tags: ['Budget'],
    summary: '予算登録',
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { 'application/json': { schema: CreateBudgetBodySchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: BudgetDetailResponseSchema } },
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

const updateBudgetRoute = createRoute({
    method: 'put',
    path: '/budget/{id}',
    tags: ['Budget'],
    summary: '予算更新',
    security: [{ bearerAuth: [] }],
    request: {
        params: IdParamSchema,
        body: { content: { 'application/json': { schema: CreateBudgetBodySchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: BudgetDetailResponseSchema } },
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

const deleteBudgetRoute = createRoute({
    method: 'delete',
    path: '/budget/{id}',
    tags: ['Budget'],
    summary: '予算削除',
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

export function createBudgetRoutes({ tokenService, budgetRepository }: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    // 全 Budget ルートに Bearer 認証を適用
    app.use('/budget', auth);
    app.use('/budget/*', auth);

    app.openapi(getBudgetsRoute, async (c) => {
        const budgets = await budgetRepository.all();
        return c.json({ budget: budgets.map(serializeBudget) }, 200);
    });

    app.openapi(getBudgetRoute, async (c) => {
        const { id } = c.req.valid('param');
        const budget = await budgetRepository.one(id);
        if (!budget) {
            return c.json({ result: 'error' as const, message: 'リソースが見つかりません' }, 404);
        }
        return c.json({ budget: serializeBudget(budget) }, 200);
    });

    app.openapi(createBudgetRoute, async (c) => {
        const { newData } = c.req.valid('json');
        const budget = await budgetRepository.save(newData);
        return c.json({ budget: serializeBudget(budget) }, 200);
    });

    app.openapi(updateBudgetRoute, async (c) => {
        const { newData } = c.req.valid('json');
        const budget = await budgetRepository.save(newData);
        return c.json({ budget: serializeBudget(budget) }, 200);
    });

    app.openapi(deleteBudgetRoute, async (c) => {
        const { id } = c.req.valid('param');
        await budgetRepository.remove(id);
        return c.json({ result: 'success' as const }, 200);
    });

    return app;
}
