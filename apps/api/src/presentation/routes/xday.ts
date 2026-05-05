import { createRoute } from '@hono/zod-openapi';
import { createOpenAPIApp } from '../../lib/openapi-app';
import { createAuthMiddleware } from '../middleware/auth';
import type { RouteServices } from '../../app';
import {
    ErrorResponseSchema,
    XDayQuerySchema,
    XDayResponseSchema,
    ExpenditureAnalysisResponseSchema,
} from '../../openapi/schemas';
import { z } from '@hono/zod-openapi';

// ─── Route 定義 ──────────────────────────────────────────────────

const getXDayRoute = createRoute({
    method: 'get',
    path: '/xday',
    tags: ['XDay'],
    summary: 'Xデー（資産枯渇日）の算出',
    description: '総資産・収入・実績支出データから資産が底をつく日を計算する。',
    security: [{ bearerAuth: [] }],
    request: { query: XDayQuerySchema },
    responses: {
        200: {
            content: { 'application/json': { schema: XDayResponseSchema } },
            description: 'Xデー算出結果',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

const getAnalysisRoute = createRoute({
    method: 'get',
    path: '/xday/analysis',
    tags: ['XDay'],
    summary: '支出解剖（断罪UI）',
    description: '今月のカテゴリ別支出と統計偏差値・Xデーへの影響日数を返す。',
    security: [{ bearerAuth: [] }],
    request: {
        query: z.object({
            netDailyExpense: z.coerce.number().min(0).default(0).openapi({
                description: 'Xデー算出で得た純日次消費（E_net）。0の場合はXデーへの影響日数は計算しない',
                example: 4067,
            }),
        }),
    },
    responses: {
        200: {
            content: { 'application/json': { schema: ExpenditureAnalysisResponseSchema } },
            description: '支出解剖データ',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

// ─── Handler 実装 ────────────────────────────────────────────────

export function createXDayRoutes({ tokenService, getXDayUseCase, getAnalysisUseCase }: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    app.use('/xday', auth);
    app.use('/xday/analysis', auth);

    app.openapi(getXDayRoute, async (c) => {
        const { totalAssets, monthlyIncome } = c.req.valid('query');
        const userId = c.get('userId');
        const snapshotAt = new Date().toISOString();

        const result = await getXDayUseCase.execute({ userId, totalAssets, monthlyIncome });

        return c.json({ ...result, snapshotAt }, 200);
    });

    app.openapi(getAnalysisRoute, async (c) => {
        const { netDailyExpense } = c.req.valid('query');
        const userId = c.get('userId');

        const result = await getAnalysisUseCase.execute(userId, netDailyExpense);

        return c.json(result, 200);
    });

    return app;
}
