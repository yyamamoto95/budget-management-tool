import { createRoute } from '@hono/zod-openapi';
import { createOpenAPIApp } from '../../lib/openapi-app';
import { createAuthMiddleware } from '../middleware/auth';
import type { RouteServices } from '../../app';
import { ErrorResponseSchema, ExportQuerySchema } from '../../openapi/schemas';
import { z } from '@hono/zod-openapi';

// ─── Route 定義 ──────────────────────────────────────────────────

const exportExpensesRoute = createRoute({
    method: 'get',
    path: '/export/expenses',
    tags: ['Export'],
    summary: '全取引データのエクスポート',
    description: 'ログイン中ユーザーの全取引データを JSON または CSV 形式でダウンロードする。',
    security: [{ bearerAuth: [] }],
    request: { query: ExportQuerySchema },
    responses: {
        200: {
            content: {
                'application/json': { schema: z.unknown() },
                'text/csv': { schema: z.unknown() },
            },
            description: 'エクスポートデータ',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

// ─── Handler 実装 ────────────────────────────────────────────────

export function createExportRoutes({ tokenService, exportUseCase }: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    app.use('/export/*', auth);

    app.openapi(exportExpensesRoute, async (c) => {
        const userId = c.get('userId');
        const { format } = c.req.valid('query');
        const { content, mimeType, filename } = await exportUseCase.execute(userId, format);

        return new Response(content, {
            headers: {
                'Content-Type': mimeType,
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });
    });

    return app;
}
