/** 収支区分: 0=支出, 1=収入 */
export type BalanceType = 0 | 1

export interface ExpenseProps {
    id: string
    amount: number
    balanceType: BalanceType
    userId: string
    categoryId: number
    content: string | null
    date: string
    createdDate: Date
    updatedDate: Date
    deletedDate: Date | null
}

export interface CreateExpenseProps {
    amount: number
    balanceType: BalanceType
    userId: string
    categoryId?: number
    content?: string | null
    date: string
}

/** CreateExpenseUseCase への入力 DTO */
export interface CreateExpenseInput {
    amount: number
    balanceType: BalanceType
    userId: string
    categoryId?: number
    content?: string | null
    date: string
}

/** UpdateExpenseUseCase への入力 DTO */
export interface UpdateExpenseInput {
    amount: number
    balanceType: BalanceType
    categoryId?: number
    content?: string | null
    date: string
}
