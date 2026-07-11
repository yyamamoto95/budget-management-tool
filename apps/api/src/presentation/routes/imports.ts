import { createRoute } from '@hono/zod-openapi';
import type { RouteServices } from '../../app';
import { createOpenAPIApp } from '../../lib/openapi-app';
import {
    ErrorResponseSchema,
    ImportAnalyzeBodySchema,
    ImportAnalyzeResponseSchema,
    ImportCommitBodySchema,
    ImportCommitResponseSchema,
} from '../../openapi/schemas';
import { createAuthMiddleware } from '../middleware/auth';

const analyzeImportRoute = createRoute({
    method: 'post',
    path: '/imports/analyze',
    tags: ['Import'],
    summary: '明細一覧スクショの解析（取り込み候補の抽出）',
    description:
        'マネーツリー等の明細一覧スクショから取り込み候補を抽出し、既存明細との重複疑いを付けて返す。画像は解析後に破棄され保存されない。',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: { 'application/json': { schema: ImportAnalyzeBodySchema } },
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: ImportAnalyzeResponseSchema } },
            description: '取り込み候補列（skippedRows で部分成功を明示）',
        },
        400: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'バリデーションエラー・全手段で解析失敗',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
        429: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'AI 使用制限の超過',
        },
    },
});

const commitImportRoute = createRoute({
    method: 'post',
    path: '/imports/commit',
    tags: ['Import'],
    summary: '選択済み候補の一括登録',
    description: '確認画面で選択・編集された候補を明細として一括登録する。登録後は通常の明細として編集・削除できる。',
    security: [{ bearerAuth: [] }],
    request: {
        body: {
            required: true,
            content: { 'application/json': { schema: ImportCommitBodySchema } },
        },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: ImportCommitResponseSchema } },
            description: '登録完了（登録件数）',
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
            description: 'ユーザーが見つからない',
        },
    },
});

export function createImportRoutes({
    tokenService,
    analyzeImportUseCase,
    commitImportUseCase,
}: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    app.use('/imports/*', auth);

    app.openapi(analyzeImportRoute, async (c) => {
        const userId = c.get('userId');
        const { image, mimeType } = c.req.valid('json');

        const result = await analyzeImportUseCase.execute({
            userId,
            imageBase64: image,
            mimeType,
        });

        return c.json(result, 200);
    });

    app.openapi(commitImportRoute, async (c) => {
        const userId = c.get('userId');
        const { rows } = c.req.valid('json');

        const result = await commitImportUseCase.execute({ userId, rows });
        if (!result.ok) {
            return c.json(
                { result: 'error' as const, message: result.error.message },
                result.error.statusCode as 400 | 404
            );
        }
        return c.json({ registered: result.value.registered }, 200);
    });

    return app;
}
