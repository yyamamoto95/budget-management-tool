import { createRoute } from '@hono/zod-openapi';
import type { RouteServices } from '../../app';
import { createOpenAPIApp } from '../../lib/openapi-app';
import { ErrorResponseSchema, ReceiptScanBodySchema, ReceiptScanResponseSchema } from '../../openapi/schemas';
import { createAuthMiddleware } from '../middleware/auth';

const scanReceiptRoute = createRoute({
    method: 'post',
    path: '/receipt-scan',
    tags: ['Receipt'],
    summary: 'レシート画像の解析',
    description:
        'レシート画像から合計金額・日付・店名を抽出する。解析手段は環境に応じて claude CLI / Claude API / OCR へフォールバックする。',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: { 'application/json': { schema: ReceiptScanBodySchema } },
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: ReceiptScanResponseSchema } },
            description: '解析結果（読み取れなかった項目は null）',
        },
        400: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'バリデーションエラー',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
        429: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'AI 使用制限の超過（Claude API 経路のみ）',
        },
        500: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '全手段で解析に失敗',
        },
    },
});

export function createReceiptRoutes({ tokenService, receiptScanService }: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    app.use('/receipt-scan', auth);

    app.openapi(scanReceiptRoute, async (c) => {
        const userId = c.get('userId');
        const { image, mimeType } = c.req.valid('json');

        const result = await receiptScanService.scan({
            imageBase64: image,
            mimeType,
            userId,
        });

        return c.json(
            {
                amount: result.amount,
                date: result.date,
                content: result.content,
                source: result.source,
            },
            200
        );
    });

    return app;
}
