import { describe, expect, it } from 'vitest';
import {
    budgetTone,
    buildSavingsInsight,
    SPEND_STATUS_LABEL,
    spendStatusOf,
} from '../../utils/todayStatus';

describe('budgetTone', () => {
    it('残予算比率 0.8 以上は safe', () => {
        expect(budgetTone(1.0)).toBe('safe');
        expect(budgetTone(0.8)).toBe('safe');
    });

    it('0.2 以上 0.8 未満は caution', () => {
        expect(budgetTone(0.79)).toBe('caution');
        expect(budgetTone(0.2)).toBe('caution');
    });

    it('0.2 未満は danger', () => {
        expect(budgetTone(0.19)).toBe('danger');
        expect(budgetTone(-0.5)).toBe('danger');
    });
});

describe('spendStatusOf', () => {
    it('消化率 50% 以下は great', () => {
        expect(spendStatusOf(0)).toBe('great');
        expect(spendStatusOf(0.5)).toBe('great');
    });

    it('80% 以下は steady、100% 以下は caution、超過は over', () => {
        expect(spendStatusOf(0.8)).toBe('steady');
        expect(spendStatusOf(1.0)).toBe('caution');
        expect(spendStatusOf(1.01)).toBe('over');
    });

    it('4状態すべてにラベルが定義されている', () => {
        expect(SPEND_STATUS_LABEL).toEqual({
            great: '好調',
            steady: '順調',
            caution: '注意',
            over: '超過',
        });
    });
});

describe('buildSavingsInsight', () => {
    it('目標未設定時は消化率ベースに縮退する', () => {
        expect(
            buildSavingsInsight({
                spendStatus: 'over',
                savingsGoal: 0,
                achievementRate: null,
                projectedSavings: 0,
            }),
        ).toEqual({ kind: 'over-no-goal', message: '今日は日予算を超えています' });
        expect(
            buildSavingsInsight({
                spendStatus: 'great',
                savingsGoal: 0,
                achievementRate: null,
                projectedSavings: 0,
            }),
        ).toEqual({ kind: 'within-no-goal', message: '今日は予算内に収まっています' });
    });

    it('達成率に応じて excellent / on-track / almost を返す', () => {
        expect(
            buildSavingsInsight({
                spendStatus: 'great',
                savingsGoal: 10000,
                achievementRate: 1.5,
                projectedSavings: 15000,
            }),
        ).toEqual({ kind: 'excellent', message: '今日この調子なら目標 +50% 達成見込み！' });
        expect(
            buildSavingsInsight({
                spendStatus: 'great',
                savingsGoal: 10000,
                achievementRate: 1.2,
                projectedSavings: 12000,
            }).kind,
        ).toBe('on-track');
        expect(
            buildSavingsInsight({
                spendStatus: 'steady',
                savingsGoal: 10000,
                achievementRate: 0.6,
                projectedSavings: 6000,
            }).kind,
        ).toBe('almost');
    });

    it('赤字見込みは deficit、それ以外の未達は behind', () => {
        expect(
            buildSavingsInsight({
                spendStatus: 'over',
                savingsGoal: 10000,
                achievementRate: 0.1,
                projectedSavings: -5000,
            }).kind,
        ).toBe('deficit');
        expect(
            buildSavingsInsight({
                spendStatus: 'caution',
                savingsGoal: 10000,
                achievementRate: 0.3,
                projectedSavings: 3000,
            }).kind,
        ).toBe('behind');
    });
});
