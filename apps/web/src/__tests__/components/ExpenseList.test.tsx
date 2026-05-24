/**
 * ExpenseList コンポーネントテスト
 *
 * 【検証範囲】
 * - 空配列のとき「まだ支出が登録されていません」が表示される
 * - 支出データがあるとき、各エントリの金額・日付・収支区分が正しく表示される
 * - 削除ボタン（aria-label="削除"）が各エントリに存在する
 * - content が null のエントリは備考を表示しない
 */

import { render, screen } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ExpenseList } from '../../components/expense/ExpenseList';
import type { ExpenseResponse } from '../../lib/api/types';

// deleteExpenseAction は Server Action のため、テスト環境ではモックする
vi.mock('@/lib/actions/expense', () => ({
    deleteExpenseAction: vi.fn(),
    createExpenseAction: vi.fn(),
}));

// useActionState をモック（ExpenseEditModal が使用）
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('react')>()
    return {
        ...actual,
        useActionState: vi.fn().mockReturnValue([
            { error: null, success: false },
            vi.fn(),
            false,
        ]),
    }
})

const emptyCategoryProps = {
    expenseCategories: [],
    incomeCategories: [],
}

/** テストデータファクトリ — 固定 ID を避けユニークな値を生成する */
function buildExpense(overrides: Partial<ExpenseResponse> = {}): ExpenseResponse {
    const id = `test-${Math.random().toString(36).slice(2)}`;
    return {
        id,
        amount: 1000,
        balanceType: 0,
        userId: 'user-1',
        categoryId: 1,
        content: 'テスト支出',
        date: '2024-01-15',
        createdDate: '2024-01-15T00:00:00.000Z',
        updatedDate: '2024-01-15T00:00:00.000Z',
        deletedDate: null,
        ...overrides,
    };
}

describe('ExpenseList', () => {
    describe('空リスト', () => {
        it('expenses が空配列のとき「まだ支出が登録されていません」を表示する', () => {
            render(<ExpenseList expenses={[]} {...emptyCategoryProps} />);
            expect(screen.getByText('まだ支出が登録されていません')).toBeInTheDocument();
        });

        it('空配列のとき <ul> は描画されない', () => {
            render(<ExpenseList expenses={[]} {...emptyCategoryProps} />);
            expect(screen.queryByRole('list')).not.toBeInTheDocument();
        });
    });

    describe('支出リストの表示', () => {
        it('金額が「¥1,000」形式でフォーマットされて表示される', () => {
            render(<ExpenseList expenses={[buildExpense({ amount: 1000 })]} {...emptyCategoryProps} />);
            // 支出（balanceType=0）は「-¥」プレフィックス付きで表示される
            expect(screen.getByText('-¥1,000')).toBeInTheDocument();
        });

        it('日付が表示される', () => {
            render(<ExpenseList expenses={[buildExpense({ date: '2024-03-15' })]} {...emptyCategoryProps} />);
            expect(screen.getByText('2024-03-15')).toBeInTheDocument();
        });

        it('balanceType=0 のとき「支出」ラベルが表示される', () => {
            render(<ExpenseList expenses={[buildExpense({ balanceType: 0 })]} {...emptyCategoryProps} />);
            expect(screen.getByText('支出')).toBeInTheDocument();
        });

        it('balanceType=1 のとき「収入」ラベルが表示される', () => {
            render(<ExpenseList expenses={[buildExpense({ balanceType: 1 })]} {...emptyCategoryProps} />);
            expect(screen.getByText('収入')).toBeInTheDocument();
        });

        it('content が文字列のとき備考が表示される', () => {
            render(<ExpenseList expenses={[buildExpense({ content: '昼食代' })]} {...emptyCategoryProps} />);
            expect(screen.getByText('昼食代')).toBeInTheDocument();
        });

        it('content が null のとき備考テキストは表示されない', () => {
            render(<ExpenseList expenses={[buildExpense({ content: null })]} {...emptyCategoryProps} />);
            // 備考テキストの代わりとなる要素が存在しないことを確認
            expect(screen.queryByText('null')).not.toBeInTheDocument();
        });

        it('複数の支出が複数の <li> として描画される', () => {
            const expenses = [
                buildExpense({ amount: 500, date: '2024-01-01' }),
                buildExpense({ amount: 2000, date: '2024-01-02' }),
                buildExpense({ amount: 3000, date: '2024-01-03' }),
            ];
            render(<ExpenseList expenses={expenses} {...emptyCategoryProps} />);

            // 支出（balanceType=0）は「-¥」プレフィックス付きで表示される
            expect(screen.getByText('-¥500')).toBeInTheDocument();
            expect(screen.getByText('-¥2,000')).toBeInTheDocument();
            expect(screen.getByText('-¥3,000')).toBeInTheDocument();
        });
    });

    describe('削除ボタン', () => {
        it('各エントリに削除ボタン（aria-label="削除"）が存在する', () => {
            const expenses = [buildExpense(), buildExpense()];
            render(<ExpenseList expenses={expenses} {...emptyCategoryProps} />);

            const deleteButtons = screen.getAllByRole('button', { name: '削除' });
            expect(deleteButtons).toHaveLength(2);
        });

        it('削除ボタンは form の submit ボタンである', () => {
            render(<ExpenseList expenses={[buildExpense()]} {...emptyCategoryProps} />);
            const btn = screen.getByRole('button', { name: '削除' });
            expect(btn).toHaveAttribute('type', 'submit');
        });
    });

    describe('エッジケース', () => {
        it('金額が 1 円（最小値）でも正しく表示される', () => {
            render(<ExpenseList expenses={[buildExpense({ amount: 1 })]} {...emptyCategoryProps} />);
            expect(screen.getByText('-¥1')).toBeInTheDocument();
        });

        it('金額が大きい数値でも桁区切りでフォーマットされる', () => {
            render(<ExpenseList expenses={[buildExpense({ amount: 1000000 })]} {...emptyCategoryProps} />);
            expect(screen.getByText('-¥1,000,000')).toBeInTheDocument();
        });

        it('未来日付のエントリも正常に表示される', () => {
            render(<ExpenseList expenses={[buildExpense({ date: '2099-12-31' })]} {...emptyCategoryProps} />);
            expect(screen.getByText('2099-12-31')).toBeInTheDocument();
        });
    });
});
