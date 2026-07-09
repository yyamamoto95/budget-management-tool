import { describe, expect, it } from 'vitest';
import { formatYen, formatYenSigned } from '../../utils/format';
import { toLocalDateString } from '../../utils/date';
import { weeklyStreakStateOf, countWeeklyAchievement } from '../../utils/weeklyStreak';
import { calcSavingsRate, calcMonthPace } from '../../utils/monthlySummary';
import { BALANCE_TYPE, NAV_ITEM_DEFS, PERIOD_LABELS, REPORT_PERIODS } from '../../constants/appDefinitions';

describe('formatYen / formatYenSigned', () => {
    it('¥表示（ja-JP 区切り・四捨五入）', () => {
        expect(formatYen(1234)).toBe('¥1,234');
        expect(formatYen(1234.6)).toBe('¥1,235');
        expect(formatYen(-500)).toBe('−¥500');
        expect(formatYen(0)).toBe('¥0');
    });

    it('符号つき表示', () => {
        expect(formatYenSigned(500)).toBe('+¥500');
        expect(formatYenSigned(-500)).toBe('−¥500');
        expect(formatYenSigned(0)).toBe('+¥0');
    });
});

describe('toLocalDateString', () => {
    it('ローカルの YYYY-MM-DD を返す', () => {
        expect(toLocalDateString(new Date(2026, 6, 9))).toBe('2026-07-09');
        expect(toLocalDateString(new Date(2026, 0, 1))).toBe('2026-01-01');
    });
});

describe('weeklyStreakStateOf', () => {
    const today = '2026-07-09';

    it('未来日は future', () => {
        expect(weeklyStreakStateOf({ date: '2026-07-10', expense: 0, recorded: false }, 1000, today)).toBe('future');
    });

    it('記録あり × 予算内は achieved・超過は over', () => {
        expect(weeklyStreakStateOf({ date: '2026-07-08', expense: 800, recorded: true }, 1000, today)).toBe('achieved');
        expect(weeklyStreakStateOf({ date: '2026-07-08', expense: 1200, recorded: true }, 1000, today)).toBe('over');
    });

    it('記録なしは unrecorded・dailyBudget null は 0 扱い', () => {
        expect(weeklyStreakStateOf({ date: '2026-07-08', expense: 0, recorded: false }, 1000, today)).toBe('unrecorded');
        expect(weeklyStreakStateOf({ date: '2026-07-08', expense: 100, recorded: true }, null, today)).toBe('over');
        expect(weeklyStreakStateOf({ date: '2026-07-08', expense: 0, recorded: true }, null, today)).toBe('achieved');
    });
});

describe('countWeeklyAchievement', () => {
    it('達成日数と記録日数を数える', () => {
        const week = [
            { date: '2026-07-06', expense: 500, recorded: true },
            { date: '2026-07-07', expense: 1500, recorded: true },
            { date: '2026-07-08', expense: 0, recorded: false },
        ];
        expect(countWeeklyAchievement(week, 1000)).toEqual({ achieved: 1, recorded: 2 });
    });
});

describe('calcSavingsRate / calcMonthPace', () => {
    it('貯蓄率: (収入 − 支出) / 収入', () => {
        expect(calcSavingsRate(300000, 210000)).toBe(30);
        expect(calcSavingsRate(0, 100)).toBe(0);
    });

    it('先月比ペース: 日割り平均で算出（先月 30 日固定近似）', () => {
        // 先月 30,000 → 日割り 1,000。今月 10 日で 8,000 → 日割り 800 = -20%
        expect(calcMonthPace(8000, 10, 30000)).toEqual({ momPct: -20, monthlySavedAmount: 6000 });
    });

    it('先月データがない・0 は null', () => {
        expect(calcMonthPace(8000, 10, null)).toBeNull();
        expect(calcMonthPace(8000, 10, 0)).toBeNull();
    });
});

describe('appDefinitions', () => {
    it('BALANCE_TYPE は API スキーマ準拠（0=支出, 1=収入）', () => {
        expect(BALANCE_TYPE).toEqual({ expense: 0, income: 1 });
    });

    it('ナビ定義は 4 項目（ホーム/明細/レポート/設定）', () => {
        expect(NAV_ITEM_DEFS.map((n) => n.label)).toEqual(['ホーム', '明細', 'レポート', '設定']);
    });

    it('レポート期間はラベル定義に含まれる', () => {
        for (const p of REPORT_PERIODS) {
            expect(PERIOD_LABELS[p]).toBeDefined();
        }
    });
});
