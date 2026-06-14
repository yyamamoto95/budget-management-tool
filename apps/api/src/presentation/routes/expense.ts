import type { CreateExpenseInput, UpdateExpenseInput } from '@budget/common';
import { createRoute, z } from '@hono/zod-openapi';
import type { RouteServices } from '../../app';
import { createOpenAPIApp } from '../../lib/openapi-app';
import {
    CreateExpenseBodySchema,
    ErrorResponseSchema,
    ExpenseParseRequestSchema,
    ExpenseParseResponseSchema,
    ExpenseResponseSchema,
    IdParamSchema,
    UpdateExpenseBodySchema,
} from '../../openapi/schemas';
import { createAuthMiddleware } from '../middleware/auth';
import { toExpenseDto } from '../mappers/expenseMapper';

function toISODate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// ─── レスポンス用複合スキーマ ─────────────────────────────────────

const ExpenseListResponseSchema = z.object({ expense: z.array(ExpenseResponseSchema) }).openapi('ExpenseListResponse');

const ExpenseDetailResponseSchema = z.object({ expense: ExpenseResponseSchema }).openapi('ExpenseDetailResponse');

// ─── Route 定義 ──────────────────────────────────────────────────

const ExpenseQuerySchema = z.object({
    period: z.enum(['week', 'month', 'lastMonth', 'all']).optional().openapi({ description: '期間フィルタ' }),
    search: z.string().optional().openapi({ description: 'テキスト検索（content）' }),
    date: z.string().optional().openapi({ description: '日付フィルタ (YYYY-MM-DD)' }),
    limit: z.coerce.number().int().min(1).max(100).optional().openapi({ description: '取得件数上限' }),
    offset: z.coerce.number().int().min(0).optional().openapi({ description: 'オフセット' }),
});

const getExpensesRoute = createRoute({
    method: 'get',
    path: '/expense',
    tags: ['Expense'],
    summary: '支出一覧取得',
    security: [{ bearerAuth: [] }],
    request: { query: ExpenseQuerySchema },
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
        body: {
            content: { 'application/json': { schema: CreateExpenseBodySchema } },
            required: true,
        },
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
        404: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'リソースが見つからない',
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
        body: {
            content: { 'application/json': { schema: UpdateExpenseBodySchema } },
            required: true,
        },
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
        404: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'リソースが見つからない',
        },
    },
});

const parseExpenseRoute = createRoute({
    method: 'post',
    path: '/expense/parse',
    tags: ['Expense'],
    summary: 'テキストから支出情報をパース',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            content: { 'application/json': { schema: ExpenseParseRequestSchema } },
            required: true,
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: ExpenseParseResponseSchema } },
            description: 'パース結果',
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
            content: {
                'application/json': {
                    schema: z.object({ result: z.literal('success') }),
                },
            },
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
    parseExpenseUseCase,
}: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    // 全 Expense ルートに Bearer 認証を適用
    app.use('/expense', auth);
    app.use('/expense/*', auth);

    app.openapi(getExpensesRoute, async (c) => {
        const userId = c.get('userId');
        const { period, search, date, limit, offset } = c.req.valid('query');

        let expenses = await expenseRepository.findByUserId(userId);

        // 期間フィルタ
        if (period && period !== 'all') {
            const now = new Date();
            const y = now.getFullYear();
            const m = now.getMonth();
            let startDate: string;
            let endDate: string | undefined;

            if (period === 'week') {
                const weekAgo = new Date(y, m, now.getDate() - 6);
                startDate = toISODate(weekAgo);
            } else if (period === 'month') {
                startDate = `${y}-${String(m + 1).padStart(2, '0')}-01`;
            } else {
                // lastMonth
                const lm = new Date(y, m - 1, 1);
                startDate = toISODate(lm);
                const lastDay = new Date(y, m, 0);
                endDate = toISODate(lastDay);
            }

            expenses = expenses.filter((e) => {
                if (e.date < startDate) return false;
                if (endDate && e.date > endDate) return false;
                return true;
            });
        }

        // 日付フィルタ
        if (date) {
            expenses = expenses.filter((e) => e.date === date);
        }

        // テキスト検索
        if (search) {
            const q = search.toLowerCase();
            expenses = expenses.filter((e) => e.content?.toLowerCase().includes(q));
        }

        // 日付降順ソート
        expenses.sort((a, b) => {
            if (a.date > b.date) return -1;
            if (a.date < b.date) return 1;
            return b.createdDate.getTime() - a.createdDate.getTime();
        });

        // ページング
        const start = offset ?? 0;
        const end = limit ? start + limit : undefined;
        expenses = expenses.slice(start, end);

        return c.json({ expense: expenses.map(toExpenseDto) }, 200);
    });

    app.openapi(getExpenseRoute, async (c) => {
        const { id } = c.req.valid('param');
        const expense = await expenseRepository.findById(id);
        if (!expense) {
            return c.json({ result: 'error' as const, message: 'リソースが見つかりません' }, 404);
        }
        return c.json({ expense: toExpenseDto(expense) }, 200);
    });

    app.openapi(createExpenseRoute, async (c) => {
        const { newData } = c.req.valid('json');
        const result = await createExpenseUseCase.execute(newData as CreateExpenseInput);
        if (!result.ok) {
            return c.json(
                { result: 'error' as const, message: result.error.message },
                result.error.statusCode as 400 | 404
            );
        }
        return c.json({ expense: toExpenseDto(result.value) }, 200);
    });

    app.openapi(updateExpenseRoute, async (c) => {
        const { id } = c.req.valid('param');
        const { updateData } = c.req.valid('json');
        const result = await updateExpenseUseCase.execute(id, updateData as UpdateExpenseInput);
        if (!result.ok) {
            return c.json(
                { result: 'error' as const, message: result.error.message },
                result.error.statusCode as 400 | 404
            );
        }
        return c.json({ expense: toExpenseDto(result.value) }, 200);
    });

    app.openapi(parseExpenseRoute, (c) => {
        const { text } = c.req.valid('json');
        const result = parseExpenseUseCase.execute({ text });
        return c.json(result, 200);
    });

    app.openapi(deleteExpenseRoute, async (c) => {
        const { id } = c.req.valid('param');
        await expenseRepository.remove(id);
        return c.json({ result: 'success' as const }, 200);
    });

    return app;
}
