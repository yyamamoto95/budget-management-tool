import type { AppDeps, RouteServices } from './app';
import type { TokenService } from './application/auth/TokenService';
import { GetRecoveryQuestionUseCase } from './application/use-cases/auth/GetRecoveryQuestionUseCase';
import { GetSecurityQuestionsUseCase } from './application/use-cases/auth/GetSecurityQuestionsUseCase';
import { RegisterUserUseCase } from './application/use-cases/auth/RegisterUserUseCase';
import { ResetPasswordUseCase } from './application/use-cases/auth/ResetPasswordUseCase';
import { VerifyRecoveryAnswerUseCase } from './application/use-cases/auth/VerifyRecoveryAnswerUseCase';
import { GetCategoriesUseCase } from './application/use-cases/category/GetCategoriesUseCase';
import { CreateExpenseUseCase } from './application/use-cases/CreateExpenseUseCase';
import { GetDashboardUseCase } from './application/use-cases/dashboard/GetDashboardUseCase';
import { RegisterAutoFixedExpensesUseCase } from './application/use-cases/dashboard/RegisterAutoFixedExpensesUseCase';
import { AnalyzeImportUseCase } from './application/use-cases/import/AnalyzeImportUseCase';
import { CommitImportUseCase } from './application/use-cases/import/CommitImportUseCase';
import { ClaudeApiStatementAnalyzer } from './application/services/import/ClaudeApiStatementAnalyzer';
import { ClaudeCliStatementAnalyzer } from './application/services/import/ClaudeCliStatementAnalyzer';
import { StatementScanService } from './application/services/import/StatementScanService';
import { ExportUserDataUseCase } from './application/use-cases/export/ExportUserDataUseCase';
import { ParseExpenseUseCase, RuleBasedExpenseParser } from './application/use-cases/parse/ParseExpenseUseCase';
import { UpdateExpenseUseCase } from './application/use-cases/UpdateExpenseUseCase';
import { CheckUserNameUseCase } from './application/use-cases/user/CheckUserNameUseCase';
import { CreateUserUseCase } from './application/use-cases/user/CreateUserUseCase';
import { DeleteUserUseCase } from './application/use-cases/user/DeleteUserUseCase';
import { GetUserByIdUseCase } from './application/use-cases/user/GetUserByIdUseCase';
import { GetUsersUseCase } from './application/use-cases/user/GetUsersUseCase';
import { UpdateUserUseCase } from './application/use-cases/user/UpdateUserUseCase';
import { GetUserSettingsUseCase } from './application/use-cases/settings/GetUserSettingsUseCase';
import { UpsertUserSettingsUseCase } from './application/use-cases/settings/UpsertUserSettingsUseCase';
import { PrismaCategoryRepository } from './infrastructure/persistence/PrismaCategoryRepository';
import { PrismaExpenseRepository } from './infrastructure/persistence/PrismaExpenseRepository';
import { PrismaPasswordResetTokenRepository } from './infrastructure/persistence/PrismaPasswordResetTokenRepository';
import { PrismaUserSettingsRepository } from './infrastructure/persistence/PrismaUserSettingsRepository';
import { PrismaAutoFixedRegistrar } from './infrastructure/persistence/PrismaAutoFixedRegistrar';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/PrismaRefreshTokenRepository';
import { PrismaSecurityAnswerRepository } from './infrastructure/persistence/PrismaSecurityAnswerRepository';
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { prisma } from './infrastructure/persistence/prisma-client';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher';
import { LlmClient } from './application/services/LlmClient';
import { LlmUsageGuard } from './application/services/LlmUsageGuard';
import { ClaudeApiReceiptAnalyzer } from './application/services/receipt/ClaudeApiReceiptAnalyzer';
import { ClaudeCliReceiptAnalyzer } from './application/services/receipt/ClaudeCliReceiptAnalyzer';
import { ReceiptScanService } from './application/services/receipt/ReceiptScanService';
import { TesseractReceiptAnalyzer } from './application/services/receipt/TesseractReceiptAnalyzer';
import { PrismaLlmUsageRepository } from './infrastructure/persistence/PrismaLlmUsageRepository';

/**
 * 本番用依存関係コンテナ。
 * PrismaClient は prisma-client.ts のシングルトンを使用する。
 */
export function buildDeps(): AppDeps {
    return {
        userRepository: new PrismaUserRepository(prisma),
        expenseRepository: new PrismaExpenseRepository(prisma),
        categoryRepository: new PrismaCategoryRepository(prisma),
        refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
        securityAnswerRepository: new PrismaSecurityAnswerRepository(prisma),
        passwordResetTokenRepository: new PrismaPasswordResetTokenRepository(prisma),
        userSettingsRepository: new PrismaUserSettingsRepository(prisma),
        autoFixedRegistrar: new PrismaAutoFixedRegistrar(prisma),
    };
}

/**
 * ルート層に渡すサービス群を構築する。
 * UseCase のインスタンス生成はすべてここに集約し、ルートファクトリ内での new を禁止する。
 */
export function buildServices(deps: AppDeps, tokenService: TokenService): RouteServices {
    const passwordHasher = new BcryptPasswordHasher();
    return {
        tokenService,
        // リポジトリ直接参照（UseCase未抽出のルート用）
        userRepository: deps.userRepository,
        expenseRepository: deps.expenseRepository,
        // Categories
        getCategoriesUseCase: new GetCategoriesUseCase(deps.categoryRepository),
        // Expense
        createExpenseUseCase: new CreateExpenseUseCase(deps.expenseRepository, deps.userRepository),
        updateExpenseUseCase: new UpdateExpenseUseCase(deps.expenseRepository),
        parseExpenseUseCase: new ParseExpenseUseCase(new RuleBasedExpenseParser()),
        // Export
        exportUseCase: new ExportUserDataUseCase(deps.expenseRepository),
        // Recovery / Registration
        registerUseCase: new RegisterUserUseCase(deps.userRepository, deps.securityAnswerRepository, passwordHasher),
        checkUserNameUseCase: new CheckUserNameUseCase(deps.userRepository),
        getSecurityQuestionsUseCase: new GetSecurityQuestionsUseCase(deps.securityAnswerRepository),
        getRecoveryQuestionUseCase: new GetRecoveryQuestionUseCase(deps.userRepository, deps.securityAnswerRepository),
        verifyRecoveryAnswerUseCase: new VerifyRecoveryAnswerUseCase(
            deps.securityAnswerRepository,
            deps.passwordResetTokenRepository
        ),
        resetPasswordUseCase: new ResetPasswordUseCase(deps.userRepository, deps.passwordResetTokenRepository),
        // User management
        getUsersUseCase: new GetUsersUseCase(deps.userRepository),
        getUserByIdUseCase: new GetUserByIdUseCase(deps.userRepository),
        createUserUseCase: new CreateUserUseCase(deps.userRepository, passwordHasher),
        updateUserUseCase: new UpdateUserUseCase(deps.userRepository),
        deleteUserUseCase: new DeleteUserUseCase(deps.userRepository),
        // Settings
        getUserSettingsUseCase: new GetUserSettingsUseCase(deps.userSettingsRepository),
        upsertUserSettingsUseCase: new UpsertUserSettingsUseCase(deps.userSettingsRepository),
        // Dashboard
        getDashboardUseCase: new GetDashboardUseCase(deps.expenseRepository, deps.userSettingsRepository),
        registerAutoFixedExpensesUseCase: new RegisterAutoFixedExpensesUseCase(
            deps.userSettingsRepository,
            deps.autoFixedRegistrar
        ),
        // Receipt（#514）: claude CLI（ローカル・課金ゼロ）→ Claude API（キー設定時）→ OCR の順にフォールバック
        // Import（#564）: 明細一覧スクショ → 候補抽出 → 一括登録
        analyzeImportUseCase: new AnalyzeImportUseCase(
            new StatementScanService([
                new ClaudeCliStatementAnalyzer(),
                new ClaudeApiStatementAnalyzer(new LlmClient(), new LlmUsageGuard(new PrismaLlmUsageRepository(prisma))),
            ]),
            deps.expenseRepository
        ),
        commitImportUseCase: new CommitImportUseCase(deps.expenseRepository, deps.userRepository),
        receiptScanService: new ReceiptScanService([
            new ClaudeCliReceiptAnalyzer(),
            new ClaudeApiReceiptAnalyzer(new LlmClient(), new LlmUsageGuard(new PrismaLlmUsageRepository(prisma))),
            new TesseractReceiptAnalyzer(),
        ]),
    };
}
