import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SavingsForecastCard } from "@/components/dashboard/SavingsForecastCard";

// 基準日を固定して決定論的に検証する（7月15日 / 31日月 → 残り16日）
const TODAY = new Date("2026-07-15T00:00:00");

describe("SavingsForecastCard", () => {
  it("目標を大幅に上回る見込みのとき、超好調バッジと予測残高（+表示）が出る", () => {
    render(
      <SavingsForecastCard
        monthSummary={{ expense: 50_000, income: 300_000 }}
        todayExpense={0}
        savingsGoal={30_000}
        today={TODAY}
      />,
    );
    // projectedSavings = 300000 - 50000 = 250000 → rate 8.3 → excellent
    expect(screen.getByText(/目標 \+\d+% 達成見込み！/)).toBeInTheDocument();
    expect(screen.getByText("+¥250,000")).toBeInTheDocument();
    expect(screen.getByText("貯まる見込み")).toBeInTheDocument();
    expect(screen.getByText("目標貯蓄 ¥30,000")).toBeInTheDocument();
  });

  it("赤字見込みのとき、赤字バッジと不足見込み（−表示）が出る", () => {
    render(
      <SavingsForecastCard
        monthSummary={{ expense: 350_000, income: 300_000 }}
        todayExpense={0}
        savingsGoal={30_000}
        today={TODAY}
      />,
    );
    expect(screen.getByText("赤字見込み")).toBeInTheDocument();
    // ヒーロー（月末予測残高）とフッター（残り予算）の両方が符号付きで表示される
    expect(screen.getAllByText("−¥50,000")).toHaveLength(2);
    expect(screen.getByText("不足見込み")).toBeInTheDocument();
  });

  it("目標未設定（0）のとき、目標未設定バッジが出て目標ラベルも未設定表示になる", () => {
    render(
      <SavingsForecastCard
        monthSummary={{ expense: 50_000, income: 300_000 }}
        todayExpense={0}
        savingsGoal={0}
        today={TODAY}
      />,
    );
    expect(screen.getByText("目標未設定")).toBeInTheDocument();
    expect(screen.getByText("目標貯蓄 未設定")).toBeInTheDocument();
  });

  it("3指標フッター（残り予算・残り日数・1日の目安）が表示される", () => {
    render(
      <SavingsForecastCard
        monthSummary={{ expense: 50_000, income: 300_000 }}
        todayExpense={0}
        savingsGoal={30_000}
        today={TODAY}
      />,
    );
    expect(screen.getByText("残り予算")).toBeInTheDocument();
    expect(screen.getByText("¥250,000")).toBeInTheDocument();
    expect(screen.getByText("残り日数")).toBeInTheDocument();
    // 7/15 基準・31日月 → 残り16日、1日の目安 = 250,000 / 16 = ¥15,625
    expect(screen.getByText("あと16日")).toBeInTheDocument();
    expect(screen.getByText("1日の目安")).toBeInTheDocument();
    expect(screen.getByText("¥15,625")).toBeInTheDocument();
    expect(screen.getByText("15日経過 / 31日")).toBeInTheDocument();
  });
});
