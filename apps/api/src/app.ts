import { OpenAPIHono } from '@hono/zod-openapi';
import { secureHeaders } from 'hono/secure-headers';
import type { IBudgetRepository } from './domain/repositories/IBudgetRepository';
import type { IExpenseRepository } from './domain/repositories/IExpenseRepository';
import type { IUserRepository } from './domain/repositories/IUserRepository';
import type { IRefreshTokenRepository } from './domain/repositories/IRefreshTokenRepository';
import type { ISecurityAnswerRepository } from './domain/repositories/ISecurityAnswerRepository';
import type { IPasswordResetTokenRepository } from './domain/repositories/IPasswordResetTokenRepository';
import { TokenService } from './application/auth/TokenService';
import { DomainException } from './shared/errors/DomainException';
import { createAuthRoutes } from './presentation/routes/auth';
import { createBudgetRoutes } from './presentation/routes/budget';
import { createExpenseRoutes } from './presentation/routes/expense';
import { createUserRoutes } from './presentation/routes/user';
import { createRecoveryRoutes } from './presentation/routes/recovery';
import { createExportRoutes } from './presentation/routes/export';
import { createXDayRoutes } from './presentation/routes/xday';

export type AppDeps = {
    userRepository: IUserRepository;
    expenseRepository: IExpenseRepository;
    budgetRepository: IBudgetRepository;
    refreshTokenRepository: IRefreshTokenRepository;
    securityAnswerRepository: ISecurityAnswerRepository;
    passwordResetTokenRepository: IPasswordResetTokenRepository;
};

/** Hono context の型変数定義（認証済みルートで userId を参照するために使用） */
export type HonoEnv = {
    Variables: {
        userId: string;
    };
};

export function createApp(deps: AppDeps) {
    const privateKeyPem = process.env.JWT_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '';
    const publicKeyPem = process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, '\n') ?? '';
    const tokenService = new TokenService(privateKeyPem, publicKeyPem, deps.refreshTokenRepository);

    const app = new OpenAPIHono<HonoEnv>();

    // ─── Layer 3: セキュリティヘッダー（helmet 相当） ─────────────────────────────
    // X-Content-Type-Options, X-Frame-Options, Referrer-Policy 等を付与
    app.use('*', secureHeaders());

    // JWT Bearer 認証スキームをレジストリに登録（createRoute の security: [{ bearerAuth: [] }] と対応）
    app.openAPIRegistry.registerComponent('securitySchemes', 'bearerAuth', {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
    });

    // ECS ヘルスチェック用エンドポイント（認証不要）
    app.get('/api/health', (c) => c.json({ status: 'ok' }));

    app.route('/api', createAuthRoutes(deps, tokenService));
    app.route('/api', createExpenseRoutes(deps, tokenService));
    app.route('/api', createBudgetRoutes(deps, tokenService));
    app.route('/api', createUserRoutes(deps, tokenService));
    app.route('/api', createRecoveryRoutes(deps));
    app.route('/api', createExportRoutes(deps, tokenService));
    app.route('/api', createXDayRoutes(deps, tokenService));

    app.onError((err, c) => {
        if (err instanceof DomainException) {
            return c.json({ result: 'error', message: err.message }, err.statusCode as 400 | 401 | 403 | 404 | 500);
        }
        console.error('[unhandled error]', err);
        return c.json({ result: 'error', message: 'Something broken' }, 500);
    });

    return app;
}

/** フロントエンドの型安全 RPC クライアント（hono/client の hc<AppType>）で使用する型 */
export type AppType = ReturnType<typeof createApp>;
