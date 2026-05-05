import { z } from 'zod'

export const createExpenseSchema = z.object({
  amount: z
    .number({ invalid_type_error: '金額は数値で入力してください' })
    .int('金額は整数で入力してください')
    .min(1, '金額は1以上の値を入力してください'),
  balanceType: z.union([z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: '種別を選択してください' }),
  }),
  userId: z.string().min(1, 'ユーザーIDが必要です'),
  date: z.string().min(1, '日付を入力してください'),
  content: z.string().nullable().optional(),
})

export type CreateExpenseSchema = z.infer<typeof createExpenseSchema>

export const updateExpenseSchema = z.object({
  amount: z
    .number({ invalid_type_error: '金額は数値で入力してください' })
    .int('金額は整数で入力してください')
    .min(1, '金額は1以上の値を入力してください'),
  balanceType: z.union([z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: '種別を選択してください' }),
  }),
  date: z.string().min(1, '日付を入力してください'),
  content: z.string().nullable().optional(),
})

export type UpdateExpenseSchema = z.infer<typeof updateExpenseSchema>
