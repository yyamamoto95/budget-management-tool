import { prisma } from './infrastructure/persistence/prisma-client';
import { PrismaBudgetRepository } from './infrastructure/persistence/PrismaBudgetRepository';
import { PrismaExpenseRepository } from './infrastructure/persistence/PrismaExpenseRepository';
import { PrismaRefreshTokenRepository } from './infrastructure/persistence/PrismaRefreshTokenRepository';
import { PrismaUserRepository } from './infrastructure/persistence/PrismaUserRepository';
import { PrismaSecurityAnswerRepository } from './infrastructure/persistence/PrismaSecurityAnswerRepository';
import { PrismaPasswordResetTokenRepository } from './infrastructure/persistence/PrismaPasswordResetTokenRepository';
import { BcryptPasswordHasher } from './infrastructure/security/BcryptPasswordHasher';
import type { AppDeps, RouteServices } from './app';
import type { TokenService } from './application/auth/TokenService';
import { CreateExpenseUseCase } from './application/use-cases/CreateExpenseUseCase';
import { ExportUserDataUseCase } from './application/use-cases/export/ExportUserDataUseCase';
import { RegisterUserUseCase } from './application/use-cases/auth/RegisterUserUseCase';
import { GetSecurityQuestionsUseCase } from './application/use-cases/auth/GetSecurityQuestionsUseCase';
import { GetRecoveryQuestionUseCase } from './application/use-cases/auth/GetRecoveryQuestionUseCase';
import { VerifyRecoveryAnswerUseCase } from './application/use-cases/auth/VerifyRecoveryAnswerUseCase';
import { ResetPasswordUseCase } from './application/use-cases/auth/ResetPasswordUseCase';
import { CheckUserNameUseCase } from './application/use-cases/user/CheckUserNameUseCase';
import { GetUsersUseCase } from './application/use-cases/user/GetUsersUseCase';
import { GetUserByIdUseCase } from './application/use-cases/user/GetUserByIdUseCase';
import { CreateUserUseCase } from './application/use-cases/user/CreateUserUseCase';
import { UpdateUserUseCase } from './application/use-cases/user/UpdateUserUseCase';
import { DeleteUserUseCase } from './application/use-cases/user/DeleteUserUseCase';
import { GetXDayUseCase } from './application/use-cases/xday/GetXDayUseCase';
import { GetExpenditureAnalysisUseCase } from './application/use-cases/xday/GetExpenditureAnalysisUseCase';

/**
 * 本番用依存関係コンテナ。
 * PrismaClient は prisma-client.ts のシングルトンを使用する。
 */
export function buildDeps(): AppDeps {
    return {
        userRepository: new PrismaUserRepository(prisma),
        expenseRepository: new PrismaExpenseRepository(prisma),
        budgetRepository: new PrismaBudgetRepository(prisma),
        refreshTokenRepository: new PrismaRefreshTokenRepository(prisma),
        securityAnswerRepository: new PrismaSecurityAnswerRepository(prisma),
        passwordResetTokenRepository: new PrismaPasswordResetTokenRepository(prisma),
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
        budgetRepository: deps.budgetRepository,
        expenseRepository: deps.expenseRepository,
        // Expense
        createExpenseUseCase: new CreateExpenseUseCase(deps.expenseRepository, deps.userRepository),
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
        // XDay
        getXDayUseCase: new GetXDayUseCase(deps.expenseRepository),
        getAnalysisUseCase: new GetExpenditureAnalysisUseCase(deps.expenseRepository),
    };
}
