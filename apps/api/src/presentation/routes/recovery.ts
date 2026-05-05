import { createRoute, z } from '@hono/zod-openapi';
import { createOpenAPIApp } from '../../lib/openapi-app';
import type { RouteServices } from '../../app';
import {
    CheckUserNameQuerySchema,
    CheckUserNameResponseSchema,
    ErrorResponseSchema,
    PasswordResetTokenResponseSchema,
    RecoveryQuestionResponseSchema,
    RegisterBodySchema,
    ResetPasswordBodySchema,
    SecurityQuestionListResponseSchema,
    SuccessResponseSchema,
    UserIdParamSchema,
    UserResponseSchema,
    VerifyRecoveryBodySchema,
} from '../../openapi/schemas';
import type { User } from '../../domain/models/User';

/** パスワードフィールドを除去して DTO に変換 */
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

// ─── Route 定義 ──────────────────────────────────────────────────

const registerRoute = createRoute({
    method: 'post',
    path: '/register',
    tags: ['Auth'],
    summary: '自己登録',
    description: 'メールアドレス不要の匿名登録。秘密の質問もあわせて設定する。',
    request: {
        body: { content: { 'application/json': { schema: RegisterBodySchema } }, required: true },
    },
    responses: {
        201: {
            content: { 'application/json': { schema: z.object({ user: UserResponseSchema }) } },
            description: '登録成功',
        },
        400: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'バリデーションエラー / ユーザーID重複',
        },
    },
});

const checkUserNameRoute = createRoute({
    method: 'get',
    path: '/register/check-username',
    tags: ['Auth'],
    summary: 'ユーザー名使用可能確認',
    request: { query: CheckUserNameQuerySchema },
    responses: {
        200: {
            content: { 'application/json': { schema: CheckUserNameResponseSchema } },
            description: '確認結果',
        },
    },
});

const getSecurityQuestionsRoute = createRoute({
    method: 'get',
    path: '/security-questions',
    tags: ['Recovery'],
    summary: '秘密の質問一覧取得',
    responses: {
        200: {
            content: { 'application/json': { schema: SecurityQuestionListResponseSchema } },
            description: '質問一覧',
        },
    },
});

const getRecoveryQuestionRoute = createRoute({
    method: 'get',
    path: '/recovery/question',
    tags: ['Recovery'],
    summary: 'パスワードリカバリ: 秘密の質問取得',
    request: { query: z.object({ userId: z.string().min(1) }) },
    responses: {
        200: {
            content: { 'application/json': { schema: RecoveryQuestionResponseSchema } },
            description: '質問取得成功',
        },
        404: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'ユーザーが存在しないか質問未設定',
        },
    },
});

const verifyRecoveryRoute = createRoute({
    method: 'post',
    path: '/recovery/verify',
    tags: ['Recovery'],
    summary: 'パスワードリカバリ: 回答照合',
    request: {
        body: { content: { 'application/json': { schema: VerifyRecoveryBodySchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: PasswordResetTokenResponseSchema } },
            description: '照合成功。リセットトークンを返す（30分有効）',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: '回答が不正',
        },
        404: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'ユーザーが存在しないか質問未設定',
        },
    },
});

const resetPasswordRoute = createRoute({
    method: 'post',
    path: '/recovery/reset-password',
    tags: ['Recovery'],
    summary: 'パスワードリカバリ: パスワードリセット',
    request: {
        body: { content: { 'application/json': { schema: ResetPasswordBodySchema } }, required: true },
    },
    responses: {
        200: {
            content: { 'application/json': { schema: SuccessResponseSchema } },
            description: 'パスワード更新成功',
        },
        401: {
            content: { 'application/json': { schema: ErrorResponseSchema } },
            description: 'トークンが無効または期限切れ',
        },
    },
});

// ─── Handler 実装 ────────────────────────────────────────────────

export function createRecoveryRoutes({
    registerUseCase,
    checkUserNameUseCase,
    getSecurityQuestionsUseCase,
    getRecoveryQuestionUseCase,
    verifyRecoveryAnswerUseCase,
    resetPasswordUseCase,
}: RouteServices) {
    const app = createOpenAPIApp();

    app.openapi(registerRoute, async (c) => {
        const body = c.req.valid('json');
        const user = await registerUseCase.execute({
            userId: body.userId,
            displayName: body.displayName,
            password: body.password,
            securityQuestionId: body.securityQuestionId,
            securityAnswer: body.securityAnswer,
        });
        return c.json({ user: serializeUser(user) }, 201);
    });

    app.openapi(checkUserNameRoute, async (c) => {
        const { userId } = c.req.valid('query');
        const result = await checkUserNameUseCase.execute(userId);
        return c.json(result, 200);
    });

    app.openapi(getSecurityQuestionsRoute, async (c) => {
        const questions = await getSecurityQuestionsUseCase.execute();
        return c.json({ questions }, 200);
    });

    app.openapi(getRecoveryQuestionRoute, async (c) => {
        const { userId } = c.req.valid('query');
        const question = await getRecoveryQuestionUseCase.execute(userId);
        return c.json(question, 200);
    });

    app.openapi(verifyRecoveryRoute, async (c) => {
        const { userId, answer } = c.req.valid('json');
        const result = await verifyRecoveryAnswerUseCase.execute(userId, answer);
        return c.json({ result: 'success' as const, ...result }, 200);
    });

    app.openapi(resetPasswordRoute, async (c) => {
        const { resetToken, newPassword } = c.req.valid('json');
        await resetPasswordUseCase.execute(resetToken, newPassword);
        return c.json({ result: 'success' as const }, 200);
    });

    return app;
}
