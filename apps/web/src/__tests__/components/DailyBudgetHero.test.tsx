import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DailyBudgetHero } from "@/components/dashboard/DailyBudgetHero";

// 基準日を固定して決定論的に検証する（7月15日 / 31日月）
const TODAY = new Date("2026-07-15T00:00:00");

const baseProps = {
  // amount 2400 / remaining はテストごとに消化率から導出
  monthSummary: { expense: 120_000, income: 300_000 },
  savingsGoal: 30_000,
  today: TODAY,
};

function budget(remaining: number) {
  return { amount: 2400, remaining, ratio: remaining / 2400, daysUntilPayday: 10 };
}

describe("DailyBudgetHero — 4状態バッジと進捗バー（#459）", () => {
  it("消化率 ≤ 50% のとき「好調」バッジ", () => {
    render(<DailyBudgetHero {...baseProps} dailyBudget={budget(1400)} todayExpense={1000} />);
    expect(screen.getByText("好調")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "日予算の消化率 42%" })).toBeInTheDocument();
  });

  it("消化率 51〜80% のとき「順調」バッジ", () => {
    render(<DailyBudgetHero {...baseProps} dailyBudget={budget(720)} todayExpense={1680} />);
    expect(screen.getByText("順調")).toBeInTheDocument();
  });

  it("消化率 81〜100% のとき「注意」バッジ", () => {
    render(<DailyBudgetHero {...baseProps} dailyBudget={budget(240)} todayExpense={2160} />);
    expect(screen.getByText("注意")).toBeInTheDocument();
  });

  it("消化率 > 100% のとき「超過」バッジ（バーは100%でキャップ）", () => {
    render(<DailyBudgetHero {...baseProps} dailyBudget={budget(-600)} todayExpense={3000} />);
    expect(screen.getByText("超過")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "日予算の消化率 125%" })).toBeInTheDocument();
  });

  it("今日の支出 / 日予算 が表示される", () => {
    render(<DailyBudgetHero {...baseProps} dailyBudget={budget(1400)} todayExpense={1000} />);
    expect(screen.getByText("¥1,000 / ¥2,400")).toBeInTheDocument();
  });
});

describe("DailyBudgetHero — 貯蓄インサイト（#459）", () => {
  it("達成率 ≥ 150% のとき、+X% 達成見込みメッセージ", () => {
    // projected = 120000（today 0 扱いにするため todayExpense を月支出に含めない値で）
    render(
      <DailyBudgetHero
        {...baseProps}
        dailyBudget={budget(2400)}
        todayExpense={0}
        monthSummary={{ expense: 120_000, income: 300_000 }}
      />,
    );
    // projectedSavings = 180000 / 30000 = 600% → +500%
    expect(screen.getByText("今日この調子なら目標 +500% 達成見込み！")).toBeInTheDocument();
  });

  it("赤字見込みのとき、赤字メッセージ", () => {
    render(
      <DailyBudgetHero
        {...baseProps}
        dailyBudget={budget(-600)}
        todayExpense={0}
        monthSummary={{ expense: 350_000, income: 300_000 }}
      />,
    );
    expect(screen.getByText("このペースだと今月赤字になりそう")).toBeInTheDocument();
  });

  it("目標未設定（0）のとき、消化率ベースの文言に縮退する", () => {
    render(
      <DailyBudgetHero
        {...baseProps}
        savingsGoal={0}
        dailyBudget={budget(1400)}
        todayExpense={1000}
      />,
    );
    expect(screen.getByText("今日は予算内に収まっています")).toBeInTheDocument();
  });

  it("目標未設定かつ超過のとき、超過文言に縮退する", () => {
    render(
      <DailyBudgetHero
        {...baseProps}
        savingsGoal={0}
        dailyBudget={budget(-600)}
        todayExpense={3000}
      />,
    );
    expect(screen.getByText("今日は日予算を超えています")).toBeInTheDocument();
  });
});

describe("DailyBudgetHero — 設定未完了", () => {
  it("dailyBudget が null のとき、設定への案内を表示する", () => {
    render(<DailyBudgetHero {...baseProps} dailyBudget={null} todayExpense={0} />);
    expect(screen.getByText("設定を完了すると1日予算が表示されます")).toBeInTheDocument();
  });
});
