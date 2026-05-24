import { createRoute, z } from '@hono/zod-openapi';
import type { RouteServices } from '../../app';
import { createOpenAPIApp } from '../../lib/openapi-app';
import { CategoriesResponseSchema, ErrorResponseSchema } from '../../openapi/schemas';
import { createAuthMiddleware } from '../middleware/auth';

// ─── Route 定義 ──────────────────────────────────────────────────

const getCategoriesRoute = createRoute({
    method: 'get',
    path: '/categories',
    tags: ['Categories'],
    summary: 'カテゴリ一覧取得',
    security: [{ bearerAuth: [] }],
    request: {
        query: z.object({
            balanceType: z
                .union([z.literal('0'), z.literal('1')])
                .openapi({ description: '収支タイプ（0=支出, 1=収入）', example: '0' }),
        }),
    },
    responses: {
        200: {
            content: { 'application/json': { schema: CategoriesResponseSchema } },
            description: 'カテゴリ一覧（displayOrder 昇順）',
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

// ─── Handler 実装 ────────────────────────────────────────────────

export function createCategoryRoutes({ tokenService, getCategoriesUseCase }: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    app.use('/categories', auth);

    app.openapi(getCategoriesRoute, async (c) => {
        const { balanceType } = c.req.valid('query');
        const categories = await getCategoriesUseCase.execute(Number(balanceType) as 0 | 1);
        return c.json(
            categories.map((cat) => ({
                id: cat.id,
                key: cat.key,
                name: cat.name,
                color: cat.color,
                bg: cat.bg,
                balanceType: cat.balanceType,
                displayOrder: cat.displayOrder,
            })),
            200
        );
    });

    return app;
}
