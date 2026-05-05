import { OpenAPIHono } from '@hono/zod-openapi';
import { secureHeaders } from 'hono/secure-headers';
import type { TokenService } from './application/auth/TokenService';
import { TokenService as TokenServiceImpl } from './application/auth/TokenService';
import type { GetRecoveryQuestionUseCase } from './application/use-cases/auth/GetRecoveryQuestionUseCase';
import type { GetSecurityQuestionsUseCase } from './application/use-cases/auth/GetSecurityQuestionsUseCase';
import type { RegisterUserUseCase } from './application/use-cases/auth/RegisterUserUseCase';
import type { ResetPasswordUseCase } from './application/use-cases/auth/ResetPasswordUseCase';
import type { VerifyRecoveryAnswerUseCase } from './application/use-cases/auth/VerifyRecoveryAnswerUseCase';
import type { CreateExpenseUseCase } from './application/use-cases/CreateExpenseUseCase';
import type { ExportUserDataUseCase } from './application/use-cases/export/ExportUserDataUseCase';
import type { UpdateExpenseUseCase } from './application/use-cases/UpdateExpenseUseCase';
import type { CheckUserNameUseCase } from './application/use-cases/user/CheckUserNameUseCase';
import type { CreateUserUseCase } from './application/use-cases/user/CreateUserUseCase';
import type { DeleteUserUseCase } from './application/use-cases/user/DeleteUserUseCase';
import type { GetUserByIdUseCase } from './application/use-cases/user/GetUserByIdUseCase';
import type { GetUsersUseCase } from './application/use-cases/user/GetUsersUseCase';
import type { UpdateUserUseCase } from './application/use-cases/user/UpdateUserUseCase';
import type { GetExpenditureAnalysisUseCase } from './application/use-cases/xday/GetExpenditureAnalysisUseCase';
import type { GetXDayUseCase } from './application/use-cases/xday/GetXDayUseCase';
import { buildServices } from './container';
import type { IBudgetRepository } from './domain/repositories/IBudgetRepository';
import type { IExpenseRepository } from './domain/repositories/IExpenseRepository';
import type { IPasswordResetTokenRepository } from './domain/repositories/IPasswordResetTokenRepository';
import type { IRefreshTokenRepository } from './domain/repositories/IRefreshTokenRepository';
import type { ISecurityAnswerRepository } from './domain/repositories/ISecurityAnswerRepository';
import type { IUserRepository } from './domain/repositories/IUserRepository';
import { createAuthRoutes } from './presentation/routes/auth';
import { createBudgetRoutes } from './presentation/routes/budget';
import { createExpenseRoutes } from './presentation/routes/expense';
import { createExportRoutes } from './presentation/routes/export';
import { createRecoveryRoutes } from './presentation/routes/recovery';
import { createUserRoutes } from './presentation/routes/user';
import { createXDayRoutes } from './presentation/routes/xday';
import { DomainException } from './shared/errors/DomainException';

export type AppDeps = {
    userRepository: IUserRepository;
    expenseRepository: IExpenseRepository;
    budgetRepository: IBudgetRepository;
    refreshTokenRepository: IRefreshTokenRepository;
    securityAnswerRepository: ISecurityAnswerRepository;
    passwordResetTokenRepository: IPasswordResetTokenRepository;
};

/**
 * ルートファクトリが受け取るサービス群の型。
 * UseCase のインスタンス生成は container.ts::buildServices() に集約する。
 * リポジトリ直接参照は UseCase 未抽出のルート（auth / budget）用の暫定的な措置。
 */
export type RouteServices = {
    tokenService: TokenService;
    // UseCase 未抽出のルートが直接リポジトリを参照する箇所（暫定）
    userRepository: IUserRepository;
    budgetRepository: IBudgetRepository;
    expenseRepository: IExpenseRepository;
    // Expense
    createExpenseUseCase: CreateExpenseUseCase;
    updateExpenseUseCase: UpdateExpenseUseCase;
    // Export
    exportUseCase: ExportUserDataUseCase;
    // Recovery / Registration
    registerUseCase: RegisterUserUseCase;
    checkUserNameUseCase: CheckUserNameUseCase;
    getSecurityQuestionsUseCase: GetSecurityQuestionsUseCase;
    getRecoveryQuestionUseCase: GetRecoveryQuestionUseCase;
    verifyRecoveryAnswerUseCase: VerifyRecoveryAnswerUseCase;
    resetPasswordUseCase: ResetPasswordUseCase;
    // User management
    getUsersUseCase: GetUsersUseCase;
    getUserByIdUseCase: GetUserByIdUseCase;
    createUserUseCase: CreateUserUseCase;
    updateUserUseCase: UpdateUserUseCase;
    deleteUserUseCase: DeleteUserUseCase;
    // XDay
    getXDayUseCase: GetXDayUseCase;
    getAnalysisUseCase: GetExpenditureAnalysisUseCase;
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
    const tokenService = new TokenServiceImpl(privateKeyPem, publicKeyPem, deps.refreshTokenRepository);

    // UseCase のインスタンス生成を container に委譲し、ルート層での new を禁止する
    const services = buildServices(deps, tokenService);

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

    app.route('/api', createAuthRoutes(services));
    app.route('/api', createExpenseRoutes(services));
    app.route('/api', createBudgetRoutes(services));
    app.route('/api', createUserRoutes(services));
    app.route('/api', createRecoveryRoutes(services));
    app.route('/api', createExportRoutes(services));
    app.route('/api', createXDayRoutes(services));

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
