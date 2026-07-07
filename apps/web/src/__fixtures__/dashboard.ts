/**
 * ダッシュボード系コンポーネントのモックデータ fixture。
 * Server Component 由来の props を再現し、Storybook ストーリーとテストで共用する。
 * 日付は「今日」基準で動的に生成する（WeeklyStreak 等が new Date() と比較するため）。
 */
import {
    EXPENSE_CATEGORY_TOKENS,
    INCOME_CATEGORY_TOKENS,
} from "@budget/common";
import type { ExpenseResponse, CategoryItem, DashboardResponse } from "@/lib/api/types";

/** ローカル日付を YYYY-MM-DD で返す（daysAgo 日前） */
export function localDateStr(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

const DOW_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;

function dowOf(daysAgo: number): string {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return DOW_LABELS[d.getDay()];
}

// ── カテゴリ ──────────────────────────────────────────────

function toCategoryItem(
    id: number,
    balanceType: 0 | 1,
    tokenKey: string,
): CategoryItem {
    const token =
        balanceType === 0
            ? EXPENSE_CATEGORY_TOKENS[tokenKey]
            : INCOME_CATEGORY_TOKENS[tokenKey];
    return {
        id,
        key: token.key,
        name: token.name,
        color: token.color,
        bg: token.bg,
        balanceType,
        displayOrder: id,
    };
}

/** 支出カテゴリ（実プロダクトのセマンティクトークン準拠） */
export const fixtureExpenseCategories: CategoryItem[] = [
    toCategoryItem(1, 0, "food"),
    toCategoryItem(2, 0, "dining"),
    toCategoryItem(3, 0, "transport"),
    toCategoryItem(4, 0, "daily"),
    toCategoryItem(5, 0, "leisure"),
    toCategoryItem(0, 0, "other"),
];

/** 収入カテゴリ */
export const fixtureIncomeCategories: CategoryItem[] = [
    toCategoryItem(1, 1, "salary"),
    toCategoryItem(3, 1, "sideJob"),
    toCategoryItem(0, 1, "other"),
];

/** 支出 + 収入の全カテゴリ（RecentExpenses / ListView の categoryMap 用） */
export const fixtureAllCategories: CategoryItem[] = [
    ...fixtureExpenseCategories,
    ...fixtureIncomeCategories,
];

/** ListView が受け取る形式の categoryMap を組み立てる */
export function buildCategoryMap(
    categories: CategoryItem[] = fixtureAllCategories,
): Map<string, CategoryItem> {
    const map = new Map<string, CategoryItem>();
    for (const cat of categories) {
        map.set(`${cat.balanceType}-${cat.id}`, cat);
    }
    return map;
}

// ── 収支記録 ──────────────────────────────────────────────

let fixtureSeq = 0;

/** ExpenseResponse のファクトリ。必要なフィールドだけ上書きする */
export function fixtureExpense(
    overrides: Partial<ExpenseResponse> = {},
): ExpenseResponse {
    fixtureSeq += 1;
    const date = overrides.date ?? localDateStr(0);
    return {
        id: `01FIXTURE${String(fixtureSeq).padStart(17, "0")}`,
        amount: 800,
        balanceType: 0,
        userId: "storybook-user",
        categoryId: 1,
        content: "昼食",
        date,
        // タイムゾーンサフィックスを付けずローカル時間としてパースさせる
        // （UTC 指定だと実行環境の TZ で表示時刻が変わり VRT が不安定になる）
        createdDate: `${date}T12:00:00.000`,
        updatedDate: `${date}T12:00:00.000`,
        deletedDate: null,
        ...overrides,
    };
}

/** 直近3日分の記録（支出のみ） */
export const fixtureRecentExpenses: ExpenseResponse[] = [
    fixtureExpense({ date: localDateStr(0), amount: 650, categoryId: 1, content: "スーパーで買い物" }),
    fixtureExpense({ date: localDateStr(0), amount: 480, categoryId: 2, content: "カフェ" }),
    fixtureExpense({ date: localDateStr(1), amount: 1200, categoryId: 2, content: "ランチ" }),
    fixtureExpense({ date: localDateStr(1), amount: 210, categoryId: 3, content: "バス" }),
    fixtureExpense({ date: localDateStr(2), amount: 3400, categoryId: 4, content: "ドラッグストア" }),
];

/** 収入を含む直近の記録 */
export const fixtureRecentExpensesWithIncome: ExpenseResponse[] = [
    fixtureExpense({ date: localDateStr(0), amount: 250000, balanceType: 1, categoryId: 1, content: "7月分給与" }),
    ...fixtureRecentExpenses,
];

// ── 1日予算 ──────────────────────────────────────────────

/** DailyBudgetHero / EmptyState 用の1日予算。tone に応じた残額比率を返す */
const TONE_RATIOS = { safe: 0.85, caution: 0.45, danger: 0.1 } as const;

export function fixtureDailyBudget(
    tone: "safe" | "caution" | "danger",
): NonNullable<DashboardResponse["dailyBudget"]> {
    const amount = 2400;
    const ratio = TONE_RATIOS[tone];
    return {
        amount,
        remaining: Math.round(amount * ratio),
        ratio,
        daysUntilPayday: 18,
    };
}

// ── 今週の記録 ────────────────────────────────────────────

export type WeeklyDayState = "achieved" | "over" | "unrecorded" | "future";

/**
 * WeeklyStreak 用の7日分レコードを生成する。
 * states は「6日前 → 今日」の順。dailyBudget=2400 を前提に
 * achieved は予算内支出、over は予算超過支出を割り当てる。
 */
export function fixtureWeeklyRecord(
    states: readonly [
        WeeklyDayState, WeeklyDayState, WeeklyDayState, WeeklyDayState,
        WeeklyDayState, WeeklyDayState, WeeklyDayState,
    ],
): DashboardResponse["weeklyRecord"] {
    const STATE_EXPENSES: Record<WeeklyDayState, number> = {
        achieved: 1800,
        over: 3600,
        unrecorded: 0,
        future: 0,
    };
    return states.map((state, i) => {
        const daysAgo = 6 - i;
        return {
            date: localDateStr(daysAgo),
            dow: dowOf(daysAgo),
            expense: STATE_EXPENSES[state],
            recorded: state === "achieved" || state === "over",
        };
    });
}

/** 達成・超過・未記録が混在する標準的な1週間 */
export const fixtureWeeklyRecordMixed = fixtureWeeklyRecord([
    "achieved", "achieved", "over", "unrecorded", "achieved", "over", "achieved",
]);
