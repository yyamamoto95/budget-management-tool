import { describe, expect, it } from 'vitest';
import {
    aggregateExpensesByCategory,
    calcVsLastMonthPct,
    summarizeReportTotals,
    vsLastMonthDisplay,
} from '../../utils/reportSummary';

const EXPENSES = [
    { amount: 1000, balanceType: 0, categoryId: 1 },
    { amount: 500, balanceType: 0, categoryId: 2 },
    { amount: 2000, balanceType: 0, categoryId: 1 },
    { amount: 300000, balanceType: 1, categoryId: 100 },
];

const CATEGORIES = [
    { id: 1, name: '食費', color: '#f18840', balanceType: 0 },
    { id: 2, name: '交通費', color: '#60a5fa', balanceType: 0 },
    { id: 100, name: '給料', color: '#35b5a2', balanceType: 1 },
];

describe('summarizeReportTotals', () => {
    it('支出・収入の合計と収支を集計する', () => {
        expect(summarizeReportTotals(EXPENSES)).toEqual({
            totalExpense: 3500,
            totalIncome: 300000,
            balance: 296500,
        });
    });

    it('空配列はすべて 0', () => {
        expect(summarizeReportTotals([])).toEqual({ totalExpense: 0, totalIncome: 0, balance: 0 });
    });
});

describe('calcVsLastMonthPct', () => {
    it('先月比を % で返す', () => {
        expect(calcVsLastMonthPct(5000, 10000)).toBe(50);
    });

    it('先月データがない・0 の場合は null', () => {
        expect(calcVsLastMonthPct(5000, null)).toBeNull();
        expect(calcVsLastMonthPct(5000, 0)).toBeNull();
    });
});

describe('aggregateExpensesByCategory', () => {
    it('支出のみをカテゴリ別に集計し金額降順で返す', () => {
        expect(aggregateExpensesByCategory(EXPENSES, CATEGORIES)).toEqual([
            { label: '食費', amount: 3000, color: '#f18840' },
            { label: '交通費', amount: 500, color: '#60a5fa' },
        ]);
    });

    it('未知のカテゴリは「未分類」', () => {
        expect(aggregateExpensesByCategory([{ amount: 100, balanceType: 0, categoryId: 999 }], CATEGORIES)).toEqual([
            { label: '未分類', amount: 100, color: '#999' },
        ]);
    });

    it('支出がなければ空配列', () => {
        expect(aggregateExpensesByCategory([{ amount: 100, balanceType: 1, categoryId: 100 }], CATEGORIES)).toEqual([]);
    });
});

describe('vsLastMonthDisplay', () => {
    it('100% は中立（先月と同額です）', () => {
        expect(vsLastMonthDisplay(100)).toEqual({ tone: 'even', label: '先月と同額です' });
    });

    it('100% 未満は節約トーン', () => {
        expect(vsLastMonthDisplay(80)).toEqual({ tone: 'saving', label: '先月比 ▼20% 節約しています' });
    });

    it('100% 超は増加トーン', () => {
        expect(vsLastMonthDisplay(130)).toEqual({ tone: 'increase', label: '▲ 先月より30% 増加' });
    });
});
