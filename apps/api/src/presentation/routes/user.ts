import { createRoute, z } from '@hono/zod-openapi';
import { createAuthMiddleware } from '../middleware/auth';
import { createOpenAPIApp } from '../../lib/openapi-app';
import type { User } from '../../domain/models/User';
import type { RouteServices } from '../../app';
import {
    CreateUserBodySchema,
    ErrorResponseSchema,
    SuccessResponseSchema,
    UpdateUserBodySchema,
    UserIdParamSchema,
    UserResponseSchema,
} from '../../openapi/schemas';

// ─── レスポンス用複合スキーマ ─────────────────────────────────────

const UserListResponseSchema = z.object({ user: z.array(UserResponseSchema) }).openapi('UserListResponse');

const UserDetailResponseSchema = z.object({ user: UserResponseSchema }).openapi('UserDetailResponse');

// ─── Route 定義 ──────────────────────────────────────────────────

const getUsersRoute = createRoute({
    method: 'get',
    path: '/user',
    tags: ['User'],
    summary: 'ユーザー一覧取得',
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            content: { 'application/json': { schema: UserListResponseSchema } },
            description: 'ユーザー一覧',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '未認証',
        },
    },
});

const getUserRoute = createRoute({
    method: 'get',
    path: '/user/{userId}',
    tags: ['User'],
    summary: 'ユーザー詳細取得',
    security: [{ bearerAuth: [] }],
    request: { params: UserIdParamSchema },
    responses: {
        200: {
            content: { 'application/json': { schema: UserDetailResponseSchema } },
            description: 'ユーザー詳細',
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

const createUserRoute = createRoute({
    method: 'post',
    path: '/user',
    tags: ['User'],
    summary: 'ユーザー登録',
    security: [{ bearerAuth: [] }],
    request: {
        body: { content: { 'application/json': { schema: CreateUserBodySchema } }, required: true },
    },
    responses: {
        201: {
            content: { 'application/json': { schema: UserDetailResponseSchema } },
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

const updateUserRoute = createRoute({
    method: 'put',
    path: '/user/{userId}',
    tags: ['User'],
    summary: 'ユーザー更新',
    security: [{ bearerAuth: [] }],
    request: {
        params: UserIdParamSchema,
        body: { content: { 'application/json': { schema: UpdateUserBodySchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: UserDetailResponseSchema } },
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

const deleteUserRoute = createRoute({
    method: 'delete',
    path: '/user/{userId}',
    tags: ['User'],
    summary: 'ユーザー削除',
    security: [{ bearerAuth: [] }],
    request: { params: UserIdParamSchema },
    responses: {
        200: {
            content: { 'application/json': { schema: SuccessResponseSchema } },
            description: '削除成功',
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

// ─── DTO 変換 ─────────────────────────────────────────────────────

/** パスワードフィールドを除去し、レスポンス用 DTO に変換する */
function serializeUser(user: User) {
    return {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}

// ─── Handler 実装 ────────────────────────────────────────────────

export function createUserRoutes({
    tokenService,
    getUsersUseCase,
    getUserByIdUseCase,
    createUserUseCase,
    updateUserUseCase,
    deleteUserUseCase,
}: RouteServices) {
    const auth = createAuthMiddleware(tokenService);
    const app = createOpenAPIApp();

    // 全 User ルートに Bearer 認証を適用
    app.use('/user', auth);
    app.use('/user/*', auth);

    app.openapi(getUsersRoute, async (c) => {
        const users = await getUsersUseCase.execute();
        return c.json({ user: users.map(serializeUser) }, 200);
    });

    app.openapi(getUserRoute, async (c) => {
        const { userId } = c.req.valid('param');
        const user = await getUserByIdUseCase.execute(userId);
        return c.json({ user: serializeUser(user) }, 200);
    });

    app.openapi(createUserRoute, async (c) => {
        const body = c.req.valid('json');
        const user = await createUserUseCase.execute({
            userName: body.userName,
            password: body.password,
            email: body.email,
            role: body.role,
        });
        return c.json({ user: serializeUser(user) }, 201);
    });

    app.openapi(updateUserRoute, async (c) => {
        const { userId } = c.req.valid('param');
        const body = c.req.valid('json');
        const user = await updateUserUseCase.execute(userId, body);
        return c.json({ user: serializeUser(user) }, 200);
    });

    app.openapi(deleteUserRoute, async (c) => {
        const { userId } = c.req.valid('param');
        await deleteUserUseCase.execute(userId);
        return c.json({ result: 'success' as const }, 200);
    });

    return app;
}
