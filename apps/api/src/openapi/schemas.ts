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
        id: z.string().openapi({
            description: 'Expense ID (ULID)',
            example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        }),
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
                categoryId: z.number().int().min(0).optional().openapi({
                    description: 'カテゴリID（省略時はデフォルト: 1=食費）',
                    example: 3,
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
                categoryId: z.number().int().min(0).optional().openapi({
                    description: 'カテゴリID',
                    example: 3,
                }),
                content: z.string().nullable().optional().openapi({ description: '備考', example: '昼食代' }),
            })
            .openapi({ description: '更新データ' }),
    })
    .openapi('UpdateExpenseBody');

export const IdParamSchema = z.object({
    id: z.string().openapi({
        description: 'リソース ID (ULID)',
        example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    }),
});

export const ExpenseParseRequestSchema = z
    .object({
        text: z.string().min(1, 'テキストを入力してください').openapi({
            description: 'パース対象テキスト（例: 「ランチ代¥900」「スーパーで1200円」）',
            example: 'ランチ代¥900',
        }),
        imageBase64: z.string().optional().openapi({
            description: 'レシート画像（Base64）。現時点では未対応（将来的に AI モデルで処理）',
        }),
    })
    .openapi('ExpenseParseRequest');

export const ExpenseParseResponseSchema = z
    .object({
        amount: z.number().int().nullable().openapi({
            description: '抽出された金額（円）。見つからない場合は null',
            example: 900,
        }),
        categoryId: z.number().int().openapi({
            description: '推定カテゴリ ID（0: 未分類）',
            example: 1,
        }),
        content: z.string().openapi({
            description: '入力テキスト（備考欄の初期値として利用）',
            example: 'ランチ代¥900',
        }),
        date: z.string().openapi({
            description: 'パース実行日（YYYY-MM-DD）',
            example: '2026-05-09',
        }),
    })
    .openapi('ExpenseParseResponse');

// ─── 予算 (Budget) ───────────────────────────────────────────────

export const BudgetResponseSchema = z
    .object({
        id: z.string().openapi({
            description: 'Budget ID (ULID)',
            example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        }),
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
        userId: z.string().openapi({
            description: 'ユーザーID',
            example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
        }),
        userName: z.string().openapi({ description: 'ユーザー名', example: '山田太郎' }),
        email: z.string().nullable().openapi({ description: 'メールアドレス', example: 'taro@example.com' }),
        role: UserRoleSchema,
        status: UserStatusSchema,
        createdAt: z.string().openapi({
            description: '作成日時 (ISO 8601)',
            example: '2026-04-13T00:00:00.000Z',
        }),
        updatedAt: z.string().openapi({
            description: '更新日時 (ISO 8601)',
            example: '2026-04-13T00:00:00.000Z',
        }),
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
    userId: z.string().openapi({
        description: 'ユーザーID',
        example: '01ARZ3NDEKTSV4RRFFQ69G5FAV',
    }),
});

// ─── 自己登録 (Register) ──────────────────────────────────────────

export const RegisterBodySchema = z
    .object({
        userId: z
            .string()
            .min(3, 'ユーザー名は3文字以上で入力してください')
            .max(30, 'ユーザー名は30文字以内で入力してください')
            .regex(/^[a-zA-Z0-9_-]+$/, '半角英数字・アンダースコア・ハイフンのみ使用できます')
            .openapi({
                description: 'ログインIDを兼ねるユーザー名',
                example: 'yamada_taro',
            }),
        displayName: z
            .string()
            .min(1, '表示名を入力してください')
            .max(50, '表示名は50文字以内で入力してください')
            .optional()
            .openapi({
                description: '表示名（省略時はuserIdと同値）',
                example: '山田太郎',
            }),
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
        text: z.string().openapi({
            description: '質問文',
            example: '幼少期に住んでいた町・村の名前は？',
        }),
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
        questionText: z.string().openapi({
            description: '質問文',
            example: '幼少期に住んでいた町・村の名前は？',
        }),
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

// ─── データエクスポート (Export) ─────────────────────────────────────

export const ExportQuerySchema = z.object({
    format: z.enum(['json', 'csv']).default('json').openapi({ description: 'エクスポート形式', example: 'json' }),
});

// ─── ユーザー設定 (Settings) ──────────────────────────────────────

const FixedExpensesDetailSchema = z
    .object({
        rent: z.number().int().min(0).openapi({ description: '家賃（円）', example: 80000 }),
        utilities: z.number().int().min(0).openapi({ description: '光熱費（円）', example: 15000 }),
        insurance: z.number().int().min(0).openapi({ description: '保険（円）', example: 10000 }),
        subscriptions: z.number().int().min(0).openapi({ description: 'サブスク（円）', example: 5000 }),
        transportation: z.number().int().min(0).openapi({ description: '交通費（円）', example: 10000 }),
        other: z.number().int().min(0).openapi({ description: 'その他（円）', example: 5000 }),
    })
    .openapi('FixedExpensesDetail');

export const UserSettingsResponseSchema = z
    .object({
        totalAssets: z.number().int().min(0).openapi({ description: '総資産（円）', example: 5000000 }),
        monthlyIncome: z.number().int().min(0).openapi({ description: '月次固定収入（円）', example: 200000 }),
        paydayDay: z.number().int().min(1).max(31).openapi({ description: '給料日（月の何日か: 1〜31）', example: 25 }),
        fixedExpenses: z.number().int().min(0).openapi({ description: '月次固定費合計（円）', example: 80000 }),
        fixedExpensesDetail: FixedExpensesDetailSchema.nullable().openapi({
            description: '固定費内訳（null = 未設定）',
        }),
        savingsGoal: z
            .number()
            .int()
            .min(0)
            .openapi({ description: '月間貯蓄目標（円）。1日予算の算出時に控除する', example: 30000 }),
        initialSetupCompleted: z.boolean().openapi({ description: '初回設定完了フラグ', example: false }),
        autoFixedEnabled: z
            .boolean()
            .openapi({ description: '固定費の毎月自動登録を有効にするか（#552）', example: false }),
        autoFixedDay: z
            .number()
            .int()
            .min(1)
            .max(28)
            .openapi({ description: '固定費の自動登録日（1〜28）', example: 27 }),
    })
    .openapi('UserSettingsResponse');

export const UpsertUserSettingsBodySchema = z
    .object({
        totalAssets: z
            .number({ invalid_type_error: '総資産は数値で入力してください' })
            .int()
            .min(0, '総資産は0以上の値を入力してください')
            .openapi({ description: '総資産（円）', example: 5000000 }),
        monthlyIncome: z
            .number({ invalid_type_error: '月次収入は数値で入力してください' })
            .int()
            .min(0, '月次収入は0以上の値を入力してください')
            .openapi({ description: '月次固定収入（円）', example: 200000 }),
        paydayDay: z
            .number({ invalid_type_error: '給料日は数値で入力してください' })
            .int()
            .min(1, '給料日は1以上の値を入力してください')
            .max(31, '給料日は31以下の値を入力してください')
            .openapi({ description: '給料日（月の何日か: 1〜31）', example: 25 }),
        fixedExpenses: z
            .number({ invalid_type_error: '固定費は数値で入力してください' })
            .int()
            .min(0, '固定費は0以上の値を入力してください')
            .openapi({ description: '月次固定費合計（円）— fixedExpensesDetail がある場合は無視', example: 80000 }),
        fixedExpensesDetail: FixedExpensesDetailSchema.nullable()
            .optional()
            .openapi({ description: '固定費内訳（省略時は既存値を維持）' }),
        savingsGoal: z
            .number({ invalid_type_error: '貯蓄目標は数値で入力してください' })
            .int()
            .min(0, '貯蓄目標は0以上の値を入力してください')
            .optional()
            .openapi({ description: '月間貯蓄目標（円）。省略時は既存値を維持', example: 30000 }),
        initialSetupCompleted: z
            .boolean({
                invalid_type_error: '初回設定完了フラグは真偽値で入力してください',
            })
            .optional()
            .openapi({ description: '初回設定完了フラグ', example: true }),
        autoFixedEnabled: z
            .boolean({ invalid_type_error: '自動登録フラグは真偽値で入力してください' })
            .optional()
            .openapi({ description: '固定費の毎月自動登録を有効にするか。省略時は既存値を維持', example: true }),
        autoFixedDay: z
            .number({ invalid_type_error: '自動登録日は数値で入力してください' })
            .int()
            .min(1, '自動登録日は1以上の値を入力してください')
            .max(28, '自動登録日は28以下の値を入力してください')
            .optional()
            .openapi({ description: '固定費の自動登録日（1〜28）。省略時は既存値を維持', example: 27 }),
    })
    .openapi('UpsertUserSettingsBody');

// ─── カテゴリ ─────────────────────────────────────────────────────

export const CategoryItemSchema = z
    .object({
        id: z.number().int().openapi({ description: 'カテゴリID', example: 1 }),
        key: z.string().openapi({ description: 'セマンティクキー', example: 'food' }),
        name: z.string().openapi({ description: '表示名', example: '食費' }),
        color: z.string().openapi({ description: 'アイコン/テキスト前景色', example: '#f18840' }),
        bg: z.string().openapi({ description: 'バッジ/ボタン背景色', example: '#fef5ee' }),
        balanceType: z
            .union([z.literal(0), z.literal(1)])
            .openapi({ description: '収支タイプ（0=支出, 1=収入）', example: 0 }),
        displayOrder: z.number().int().openapi({ description: '表示順', example: 1 }),
    })
    .openapi('CategoryItem');

export const CategoriesResponseSchema = z.array(CategoryItemSchema).openapi('CategoriesResponse');

// ─── ダッシュボード ───────────────────────────────────────────────

const WeeklyRecordItemSchema = z.object({
    date: z.string().openapi({ description: '日付 (YYYY-MM-DD)', example: '2026-06-13' }),
    dow: z.string().openapi({ description: '曜日', example: '金' }),
    expense: z.number().int().openapi({ description: '支出合計（円）', example: 1500 }),
    recorded: z.boolean().openapi({ description: '記録があるか', example: true }),
});

const DailyBudgetSchema = z.object({
    amount: z.number().int().openapi({ description: '1日予算（円）', example: 3000 }),
    remaining: z.number().int().openapi({ description: '本日の残予算（円）', example: 1500 }),
    ratio: z.number().openapi({ description: '残予算比率（0〜1+）', example: 0.5 }),
    daysUntilPayday: z.number().int().openapi({ description: '給料日まで何日', example: 12 }),
});

export const DashboardResponseSchema = z
    .object({
        todayExpense: z.number().int().openapi({ description: '本日の支出合計（円）', example: 1500 }),
        dailyBudget: DailyBudgetSchema.nullable().openapi({ description: '1日予算（設定未完了の場合 null）' }),
        monthSummary: z.object({
            expense: z.number().int().openapi({ description: '今月の支出合計', example: 45000 }),
            income: z.number().int().openapi({ description: '今月の収入合計', example: 200000 }),
        }),
        lastMonthExpense: z.number().int().openapi({ description: '先月の支出合計', example: 50000 }),
        weeklyRecord: z.array(WeeklyRecordItemSchema),
        recentExpenses: z.array(ExpenseResponseSchema),
        streak: z.number().int().openapi({ description: '連続記録日数', example: 5 }),
        savingsGoal: z.number().int().openapi({ description: '月間貯蓄目標（円）。未設定は 0', example: 30000 }),
        livingMargin: z
            .object({
                totalAssets: z
                    .number()
                    .int()
                    .nullable()
                    .openapi({ description: '総資産（円）。初回設定未完了の場合 null', example: 960000 }),
                avgDailyExpense: z
                    .number()
                    .openapi({ description: '直近30日の実績日次平均支出（円/日）', example: 8000 }),
                monthlyIncome: z.number().int().openapi({ description: '月収（円/月）', example: 250000 }),
                recordedDays: z.number().int().openapi({ description: '記録済み日数（ユニーク日付数）', example: 30 }),
            })
            .openapi({ description: '生活余力の算出入力（計算は @budget/common calculateLivingMargin）' }),
    })
    .openapi('DashboardResponse');

// ── レシート読取（#514） ─────────────────────────────────────────

// ─── スクショ一括取り込み（#564）─────────────────────────────────

export const ImportAnalyzeBodySchema = z
    .object({
        image: z
            .string()
            .min(1)
            .max(10_000_000)
            .openapi({ description: 'base64 エンコード済み画像（data: プレフィックスなし・最大約7MB）' }),
        mimeType: z.enum(['image/jpeg', 'image/png']).openapi({ description: '画像の MIME タイプ' }),
    })
    .openapi('ImportAnalyzeBody');

export const ImportCandidateSchema = z
    .object({
        date: z.string().openapi({ description: 'YYYY-MM-DD', example: '2026-06-29' }),
        amount: z.number().int().min(1).openapi({ description: '金額（正の整数・円）', example: 17504 }),
        balanceType: z
            .union([z.literal(0), z.literal(1)])
            .openapi({ description: '0=支出, 1=収入', example: 0 }),
        content: z.string().openapi({ description: '摘要（店名・振込元など）' }),
        categoryId: z.number().int().min(0).openapi({ description: '推定カテゴリ ID（0=その他）' }),
        confidence: z.enum(['high', 'low']).openapi({ description: '解析の確からしさ。low は要確認' }),
        raw: z.string().openapi({ description: '読み取った元の行テキスト（監査用）' }),
        duplicateSuspect: z
            .boolean()
            .openapi({ description: '既存明細と同日・同額・同収支のとき true（登録済みの可能性）' }),
    })
    .openapi('ImportCandidate');

export const ImportAnalyzeResponseSchema = z
    .object({
        candidates: z.array(ImportCandidateSchema),
        skippedRows: z
            .number()
            .int()
            .min(0)
            .openapi({ description: '解析器が出力したが検証で弾かれた行数（部分成功の明示）' }),
        source: z.enum(['claude-cli', 'claude-api']).openapi({ description: '使用された解析手段' }),
    })
    .openapi('ImportAnalyzeResponse');

export const ImportCommitBodySchema = z
    .object({
        rows: z
            .array(
                z.object({
                    date: z
                        .string()
                        .regex(/^\d{4}-\d{2}-\d{2}$/, '日付は YYYY-MM-DD 形式で入力してください')
                        .openapi({ description: 'YYYY-MM-DD' }),
                    amount: z
                        .number({ invalid_type_error: '金額は数値で入力してください' })
                        .int()
                        .min(1, '金額は1以上の値を入力してください')
                        .openapi({ description: '金額（円）' }),
                    balanceType: z
                        .union([z.literal(0), z.literal(1)])
                        .openapi({ description: '0=支出, 1=収入' }),
                    categoryId: z.number().int().min(0).openapi({ description: 'カテゴリ ID' }),
                    content: z.string().max(255).openapi({ description: '摘要' }),
                })
            )
            .min(1, '登録対象の明細が選択されていません')
            .max(100, '一度に登録できるのは 100 件までです')
            .openapi({ description: '確認画面で選択・編集済みの登録対象行' }),
    })
    .openapi('ImportCommitBody');

export const ImportCommitResponseSchema = z
    .object({
        registered: z.number().int().min(0).openapi({ description: '登録した明細数', example: 6 }),
    })
    .openapi('ImportCommitResponse');

export const ReceiptScanBodySchema = z
    .object({
        image: z
            .string()
            .min(1)
            .max(10_000_000)
            .openapi({ description: 'base64 エンコード済み画像（data: プレフィックスなし・最大約7MB）' }),
        mimeType: z.enum(['image/jpeg', 'image/png']).openapi({ description: '画像の MIME タイプ' }),
    })
    .openapi('ReceiptScanBody');

export const ReceiptScanResponseSchema = z
    .object({
        amount: z
            .number()
            .int()
            .nullable()
            .openapi({ description: '合計金額（円）。読み取れなければ null', example: 702 }),
        date: z
            .string()
            .nullable()
            .openapi({ description: '日付 (YYYY-MM-DD)。読み取れなければ null', example: '2026-07-09' }),
        content: z
            .string()
            .nullable()
            .openapi({ description: '店名など。読み取れなければ null', example: 'ローソン 品川店' }),
        source: z.enum(['claude-cli', 'claude-api', 'ocr']).openapi({ description: '使用された解析手段' }),
    })
    .openapi('ReceiptScanResponse');
