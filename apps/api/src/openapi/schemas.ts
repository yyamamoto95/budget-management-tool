/**
 * OpenAPI ドキュメント生成用の共通 Zod スキーマ定義。
 * @hono/zod-openapi の z を使用することで .openapi() メタデータを付与できる。
 *
 * ここで定義したスキーマが HTTP レイヤーの SSOT となる。
 * ルートハンドラーは c.req.valid() でこのスキーマに基づいた型安全なアクセスを行う。
 */
import { z } from '@hono/zod-openapi';

// ─── 共通レスポンス ──────────────────────────────────────────────

export const ErrorResponseSchema = z
    .object({
        result: z.literal('error').openapi({ example: 'error' }),
        message: z.string().openapi({ example: 'エラーメッセージ' }),
    })
    .openapi('ErrorResponse');

export const SuccessResponseSchema = z
    .object({
        result: z.literal('success').openapi({ example: 'success' }),
    })
    .openapi('SuccessResponse');

// ─── 認証 ────────────────────────────────────────────────────────

export const LoginRequestSchema = z
    .object({
        userId: z.string().min(1, 'ユーザーIDを入力してください').openapi({ example: 'user01' }),
        password: z.string().min(1, 'パスワードを入力してください').openapi({ example: '••••••••' }),
    })
    .openapi('LoginRequest');

export const RefreshRequestSchema = z
    .object({
        refreshToken: z.string().min(1, 'refreshToken が必要です').openapi({ example: 'eyJ...' }),
    })
    .openapi('RefreshRequest');

export const LogoutRequestSchema = z
    .object({
        refreshToken: z.string().optional().openapi({ example: 'eyJ...' }),
    })
    .openapi('LogoutRequest');

export const TokenPairResponseSchema = z
    .object({
        result: z.literal('success'),
        accessToken: z.string().openapi({ example: 'eyJhbGciOiJSUzI1NiJ9...' }),
        refreshToken: z.string().openapi({ example: 'eyJhbGciOiJSUzI1NiJ9...' }),
        userId: z.string().openapi({ example: 'user01' }),
    })
    .openapi('TokenPairResponse');

export const LogoutResponseSchema = z
    .object({
        result: z.enum(['success', 'error']).openapi({ example: 'success' }),
        message: z.string().openapi({ example: 'ログアウトしました' }),
    })
    .openapi('LogoutResponse');

// ─── 支出 (Expense) ──────────────────────────────────────────────

export const ExpenseResponseSchema = z
    .object({
        id: z.string().openapi({ description: 'Expense ID (ULID)', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }),
        amount: z.number().int().openapi({ description: '金額（円）', example: 1000 }),
        balanceType: z.union([z.literal(0), z.literal(1)]).openapi({
            description: '収支区分: 0=支出, 1=収入',
            example: 0,
        }),
        userId: z.string().openapi({ description: 'ユーザーID', example: 'user01' }),
        categoryId: z.number().int().openapi({ description: 'カテゴリID', example: 1 }),
        content: z.string().nullable().openapi({ description: '備考', example: '昼食代' }),
        date: z.string().openapi({ description: '日付 (YYYY-MM-DD)', example: '2024-03-15' }),
        createdDate: z.string().openapi({
            description: '作成日時 (ISO 8601)',
            example: '2024-03-15T12:00:00.000Z',
        }),
        updatedDate: z.string().openapi({
            description: '更新日時 (ISO 8601)',
            example: '2024-03-15T12:00:00.000Z',
        }),
        deletedDate: z.string().nullable().openapi({ description: '削除日時 (ISO 8601)', example: null }),
    })
    .openapi('ExpenseResponse');

export const CreateExpenseBodySchema = z
    .object({
        newData: z
            .object({
                amount: z
                    .number({ invalid_type_error: '金額は数値で入力してください' })
                    .int('金額は整数で入力してください')
                    .min(1, '金額は1以上の値を入力してください')
                    .openapi({ description: '金額（円）', example: 1500 }),
                balanceType: z
                    .union([z.literal(0), z.literal(1)], {
                        errorMap: () => ({ message: '種別を選択してください' }),
                    })
                    .openapi({ description: '収支区分: 0=支出, 1=収入', example: 0 }),
                userId: z.string().min(1, 'ユーザーIDが必要です').openapi({
                    description: 'ユーザーID',
                    example: 'user01',
                }),
                date: z.string().min(1, '日付を入力してください').openapi({
                    description: '日付 (YYYY-MM-DD)',
                    example: '2024-03-15',
                }),
                content: z.string().nullable().optional().openapi({ description: '備考', example: '昼食代' }),
            })
            .openapi({ description: '支出データ' }),
    })
    .openapi('CreateExpenseBody');

export const UpdateExpenseBodySchema = z
    .object({
        updateData: z
            .object({
                amount: z
                    .number({ invalid_type_error: '金額は数値で入力してください' })
                    .int('金額は整数で入力してください')
                    .min(1, '金額は1以上の値を入力してください')
                    .openapi({ description: '金額（円）', example: 1500 }),
                balanceType: z
                    .union([z.literal(0), z.literal(1)], {
                        errorMap: () => ({ message: '種別を選択してください' }),
                    })
                    .openapi({ description: '収支区分: 0=支出, 1=収入', example: 0 }),
                date: z.string().min(1, '日付を入力してください').openapi({
                    description: '日付 (YYYY-MM-DD)',
                    example: '2024-03-15',
                }),
                content: z.string().nullable().optional().openapi({ description: '備考', example: '昼食代' }),
            })
            .openapi({ description: '更新データ' }),
    })
    .openapi('UpdateExpenseBody');

export const IdParamSchema = z.object({
    id: z.string().openapi({ description: 'リソース ID (ULID)', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }),
});

// ─── 予算 (Budget) ───────────────────────────────────────────────

export const BudgetResponseSchema = z
    .object({
        id: z.string().openapi({ description: 'Budget ID (ULID)', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }),
        amount: z.number().int().openapi({ description: '金額（円）', example: 1000 }),
        balanceType: z.union([z.literal(0), z.literal(1)]).openapi({
            description: '収支区分: 0=支出, 1=収入',
            example: 0,
        }),
        userId: z.string().openapi({ description: 'ユーザーID', example: 'user01' }),
        categoryId: z.number().int().openapi({ description: 'カテゴリID', example: 1 }),
        content: z.string().nullable().openapi({ description: '備考', example: '食費予算' }),
        date: z.string().openapi({ description: '日付 (YYYY-MM)', example: '2024-03' }),
        createdDate: z.string().openapi({ description: '作成日時 (ISO 8601)' }),
        updatedDate: z.string().openapi({ description: '更新日時 (ISO 8601)' }),
        deletedDate: z.string().nullable().openapi({ description: '削除日時 (ISO 8601)', example: null }),
    })
    .openapi('BudgetResponse');

export const CreateBudgetBodySchema = z
    .object({
        newData: z.record(z.unknown()).openapi({ description: '予算データ' }),
    })
    .openapi('CreateBudgetBody');

// ─── ユーザー (User) ──────────────────────────────────────────────

export const UserRoleSchema = z
    .enum(['ADMIN', 'USER', 'GUEST'])
    .openapi({ description: 'ユーザーロール', example: 'USER' });

export const UserStatusSchema = z
    .enum(['ACTIVE', 'INACTIVE'])
    .openapi({ description: 'ユーザーステータス', example: 'ACTIVE' });

export const UserResponseSchema = z
    .object({
        userId: z.string().openapi({ description: 'ユーザーID', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }),
        userName: z.string().openapi({ description: 'ユーザー名', example: '山田太郎' }),
        email: z.string().nullable().openapi({ description: 'メールアドレス', example: 'taro@example.com' }),
        role: UserRoleSchema,
        status: UserStatusSchema,
        createdAt: z.string().openapi({ description: '作成日時 (ISO 8601)', example: '2026-04-13T00:00:00.000Z' }),
        updatedAt: z.string().openapi({ description: '更新日時 (ISO 8601)', example: '2026-04-13T00:00:00.000Z' }),
    })
    .openapi('UserResponse');

export const CreateUserBodySchema = z
    .object({
        userName: z
            .string()
            .min(1, 'ユーザー名を入力してください')
            .max(50, 'ユーザー名は50文字以内で入力してください')
            .openapi({ description: 'ユーザー名', example: '山田太郎' }),
        password: z
            .string()
            .min(8, 'パスワードは8文字以上で入力してください')
            .openapi({ description: 'パスワード（平文）' }),
        email: z
            .string()
            .email('メールアドレスの形式が不正です')
            .nullable()
            .optional()
            .openapi({ description: 'メールアドレス', example: 'taro@example.com' }),
        role: UserRoleSchema.optional(),
    })
    .openapi('CreateUserBody');

export const UpdateUserBodySchema = z
    .object({
        userName: z
            .string()
            .min(1, 'ユーザー名を入力してください')
            .max(50, 'ユーザー名は50文字以内で入力してください')
            .optional()
            .openapi({ description: 'ユーザー名', example: '山田太郎' }),
        password: z
            .string()
            .min(8, 'パスワードは8文字以上で入力してください')
            .optional()
            .openapi({ description: '新しいパスワード（平文）。省略時は変更なし' }),
        email: z
            .string()
            .email('メールアドレスの形式が不正です')
            .nullable()
            .optional()
            .openapi({ description: 'メールアドレス', example: 'taro@example.com' }),
        role: UserRoleSchema.optional(),
        status: UserStatusSchema.optional(),
    })
    .openapi('UpdateUserBody');

export const UserIdParamSchema = z.object({
    userId: z.string().openapi({ description: 'ユーザーID', example: '01ARZ3NDEKTSV4RRFFQ69G5FAV' }),
});

// ─── 自己登録 (Register) ──────────────────────────────────────────

export const RegisterBodySchema = z
    .object({
        userId: z
            .string()
            .min(3, 'ユーザー名は3文字以上で入力してください')
            .max(30, 'ユーザー名は30文字以内で入力してください')
            .regex(/^[a-zA-Z0-9_-]+$/, '半角英数字・アンダースコア・ハイフンのみ使用できます')
            .openapi({ description: 'ログインIDを兼ねるユーザー名', example: 'yamada_taro' }),
        displayName: z
            .string()
            .min(1, '表示名を入力してください')
            .max(50, '表示名は50文字以内で入力してください')
            .optional()
            .openapi({ description: '表示名（省略時はuserIdと同値）', example: '山田太郎' }),
        password: z
            .string()
            .min(8, 'パスワードは8文字以上で入力してください')
            .max(128)
            .openapi({ description: 'パスワード（平文）' }),
        securityQuestionId: z.number().int().positive().openapi({ description: '秘密の質問ID', example: 1 }),
        securityAnswer: z
            .string()
            .min(1, '回答を入力してください')
            .max(100)
            .openapi({ description: '秘密の質問の回答（平文）', example: '○○市' }),
    })
    .openapi('RegisterBody');

export const CheckUserNameQuerySchema = z.object({
    userId: z.string().min(1).openapi({ description: '確認するユーザーID', example: 'yamada_taro' }),
});

export const CheckUserNameResponseSchema = z
    .object({
        available: z.boolean().openapi({ description: '使用可能かどうか', example: true }),
    })
    .openapi('CheckUserNameResponse');

// ─── セキュリティ質問 (Security Questions) ──────────────────────────

export const SecurityQuestionSchema = z
    .object({
        id: z.number().int().openapi({ description: '質問ID', example: 1 }),
        text: z.string().openapi({ description: '質問文', example: '幼少期に住んでいた町・村の名前は？' }),
    })
    .openapi('SecurityQuestion');

export const SecurityQuestionListResponseSchema = z
    .object({
        questions: z.array(SecurityQuestionSchema),
    })
    .openapi('SecurityQuestionListResponse');

export const SaveSecurityAnswerBodySchema = z
    .object({
        questionId: z.number().int().positive().openapi({ description: '秘密の質問ID', example: 1 }),
        answer: z.string().min(1).max(100).openapi({ description: '回答（平文）' }),
    })
    .openapi('SaveSecurityAnswerBody');

// ─── パスワードリカバリ (Recovery) ──────────────────────────────────

export const RecoveryQuestionResponseSchema = z
    .object({
        questionId: z.number().int().openapi({ description: '質問ID', example: 1 }),
        questionText: z.string().openapi({ description: '質問文', example: '幼少期に住んでいた町・村の名前は？' }),
    })
    .openapi('RecoveryQuestionResponse');

export const VerifyRecoveryBodySchema = z
    .object({
        userId: z.string().min(1).openapi({ description: 'ユーザーID', example: 'yamada_taro' }),
        answer: z.string().min(1).openapi({ description: '秘密の質問の回答' }),
    })
    .openapi('VerifyRecoveryBody');

export const PasswordResetTokenResponseSchema = z
    .object({
        result: z.literal('success'),
        resetToken: z.string().openapi({ description: 'パスワードリセット用一時トークン（30分有効）' }),
        expiresAt: z.string().openapi({ description: '有効期限 (ISO 8601)' }),
    })
    .openapi('PasswordResetTokenResponse');

export const ResetPasswordBodySchema = z
    .object({
        resetToken: z.string().min(1).openapi({ description: 'パスワードリセット用一時トークン' }),
        newPassword: z.string().min(8).max(128).openapi({ description: '新しいパスワード（平文）' }),
    })
    .openapi('ResetPasswordBody');

// ─── Xデー (XDay) ────────────────────────────────────────────────────

export const XDayQuerySchema = z.object({
    totalAssets: z.coerce.number().int().min(0).openapi({ description: '現在の総資産残高（円）', example: 5000000 }),
    monthlyIncome: z.coerce
        .number()
        .int()
        .min(0)
        .default(0)
        .openapi({ description: '月次固定収入（円）。0は収入なし', example: 0 }),
});

export const XDayResponseSchema = z
    .object({
        xDate: z.string().nullable().openapi({ example: '2031-09-14T00:00:00.000Z' }),
        daysRemaining: z.number().nullable().openapi({ example: 1978 }),
        effectiveDailyExpense: z.number().openapi({ example: 4067 }),
        netDailyExpense: z.number().openapi({ example: 4067 }),
        trustWeight: z.number().openapi({ example: 0.5 }),
        minutesPerYen: z.number().openapi({ example: 0.354 }),
        realtimeAssets: z.number().openapi({ example: 4999812 }),
        recordedDays: z.number().openapi({ example: 45 }),
        avgDailyExpense: z.number().openapi({ example: 3200 }),
        snapshotAt: z.string().openapi({ example: '2026-04-14T10:00:00.000Z' }),
    })
    .openapi('XDayResponse');

export const CategoryAnalysisSchema = z
    .object({
        category: z.string().openapi({ example: 'food' }),
        label: z.string().openapi({ example: '食費' }),
        monthlyAmount: z.number().openapi({ example: 62400 }),
        deviation: z.number().openapi({ example: 78 }),
        level: z.enum(['surplus', 'normal', 'caution', 'danger']).openapi({ example: 'danger' }),
        color: z.string().openapi({ example: '#FF0000' }),
        xDayImpactDays: z.number().openapi({ example: 64 }),
    })
    .openapi('CategoryAnalysis');

export const ExpenditureAnalysisResponseSchema = z
    .object({
        month: z.string().openapi({ example: '2026-04' }),
        categories: z.array(CategoryAnalysisSchema),
        totalDeviation: z.number().openapi({ example: 71 }),
        totalMonthlyAmount: z.number().openapi({ example: 141500 }),
    })
    .openapi('ExpenditureAnalysisResponse');

// ─── データエクスポート (Export) ─────────────────────────────────────

export const ExportQuerySchema = z.object({
    format: z.enum(['json', 'csv']).default('json').openapi({ description: 'エクスポート形式', example: 'json' }),
});
