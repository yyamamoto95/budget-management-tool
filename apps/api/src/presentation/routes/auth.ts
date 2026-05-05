import { createRoute } from '@hono/zod-openapi';
import { createOpenAPIApp } from '../../lib/openapi-app';
import { createAuthMiddleware } from '../middleware/auth';
import type { RouteServices } from '../../app';
import {
    ErrorResponseSchema,
    LogoutRequestSchema,
    LogoutResponseSchema,
    LoginRequestSchema,
    RefreshRequestSchema,
    TokenPairResponseSchema,
} from '../../openapi/schemas';

const GUEST_USER_ID = 'Guest';

// ─── Route 定義 ──────────────────────────────────────────────────

const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    tags: ['Auth'],
    summary: 'ログイン',
    description: 'userId / password で認証し、JWT アクセストークンとリフレッシュトークンを返す。',
    request: {
        body: { content: { 'application/json': { schema: LoginRequestSchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: TokenPairResponseSchema } },
            description: 'ログイン成功',
        },
        400: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'バリデーションエラー',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '認証失敗（詳細は返さない）',
        },
        500: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'サーバーエラー',
        },
    },
});

const guestLoginRoute = createRoute({
    method: 'post',
    path: '/guest-login',
    tags: ['Auth'],
    summary: 'ゲストログイン',
    description: 'パスワード不要でゲストユーザーとしてログインし、JWT トークンペアを返す。',
    responses: {
        200: {
            content: { 'application/json': { schema: TokenPairResponseSchema } },
            description: 'ゲストログイン成功',
        },
        404: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'ゲストユーザーが存在しない',
        },
        500: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'サーバーエラー',
        },
    },
});

const refreshRoute = createRoute({
    method: 'post',
    path: '/refresh',
    tags: ['Auth'],
    summary: 'トークンリフレッシュ',
    description: 'リフレッシュトークンを消費し、新しいトークンペアを返す（Refresh Token Rotation）。',
    request: {
        body: { content: { 'application/json': { schema: RefreshRequestSchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: TokenPairResponseSchema } },
            description: 'リフレッシュ成功',
        },
        400: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'refreshToken が未指定',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'トークン無効または再利用検知',
        },
        500: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'サーバーエラー',
        },
    },
});

const logoutRoute = createRoute({
    method: 'post',
    path: '/logout',
    tags: ['Auth'],
    summary: 'ログアウト',
    description: 'リフレッシュトークンを失効させる。',
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { 'application/json': { schema: LogoutRequestSchema } }, required: false },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: LogoutResponseSchema } },
            description: 'ログアウト成功',
        },
        500: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'サーバーエラー',
        },
    },
});

// ─── Handler 実装 ────────────────────────────────────────────────

export function createAuthRoutes({ tokenService, userRepository }: RouteServices) {
    const app = createOpenAPIApp();
    const auth = createAuthMiddleware(tokenService);

    // ログアウトは認証済みユーザーのみ（OpenAPI の security 宣言と一致させる）
    app.use('/logout', auth);

    /** ログイン成功時にトークンペアをレスポンスする共通処理 */
    async function respondWithTokens(userId: string) {
        const [accessToken, refreshToken] = await Promise.all([
            tokenService.signAccessToken(userId),
            tokenService.issueRefreshToken(userId),
        ]);
        return { result: 'success' as const, accessToken, refreshToken, userId };
    }

    app.openapi(loginRoute, async (c) => {
        const { userId, password } = c.req.valid('json');
        try {
            const ok = await userRepository.verifyPassword(userId, password);
            if (!ok) {
                return c.json({ result: 'error' as const, message: '認証に失敗しました' }, 401);
            }
            return c.json(await respondWithTokens(userId), 200);
        } catch (err) {
            console.error('[POST /login]', err);
            return c.json({ result: 'error' as const, message: 'Something broken' }, 500);
        }
    });

    app.openapi(guestLoginRoute, async (c) => {
        try {
            const guest = await userRepository.findById(GUEST_USER_ID);
            if (!guest) {
                return c.json({ result: 'error' as const, message: 'ゲストユーザーが存在しません' }, 404);
            }
            return c.json(await respondWithTokens(GUEST_USER_ID), 200);
        } catch (err) {
            console.error('[POST /guest-login]', err);
            return c.json({ result: 'error' as const, message: 'Something broken' }, 500);
        }
    });

    app.openapi(refreshRoute, async (c) => {
        const { refreshToken } = c.req.valid('json');
        try {
            const tokens = await tokenService.rotateRefreshToken(refreshToken);
            return c.json({ result: 'success' as const, ...tokens }, 200);
        } catch (err) {
            const msg = err instanceof Error ? err.message : '';
            if (msg === 'REFRESH_TOKEN_REUSE_DETECTED') {
                return c.json({ result: 'error' as const, message: '不正なトークンが検出されました' }, 401);
            }
            if (msg === 'REFRESH_TOKEN_EXPIRED' || msg === 'INVALID_REFRESH_TOKEN') {
                return c.json({ result: 'error' as const, message: 'トークンが無効です。再ログインしてください' }, 401);
            }
            console.error('[POST /refresh]', err);
            return c.json({ result: 'error' as const, message: 'Something broken' }, 500);
        }
    });

    app.openapi(logoutRoute, async (c) => {
        try {
            const body = await c.req.json<{ refreshToken?: string }>().catch(() => ({}));
            if ('refreshToken' in body && typeof body.refreshToken === 'string') {
                await tokenService.revokeRefreshToken(body.refreshToken);
            }
            return c.json({ result: 'success' as const, message: 'ログアウトしました' }, 200);
        } catch (err) {
            console.error('[POST /logout]', err);
            return c.json({ result: 'error' as const, message: 'Something broken' }, 500);
        }
    });

    return app;
}
