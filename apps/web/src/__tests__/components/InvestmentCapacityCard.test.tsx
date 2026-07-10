import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { InvestmentCapacityCard } from "@/components/dashboard/InvestmentCapacityCard";

describe("InvestmentCapacityCard", () => {
  // E_m = 240,000 円/月・防衛資金目標 1,440,000 円
  const okInputs = {
    totalAssets: 2_880_000, // 充足率 200%
    avgDailyExpense: 8_000,
    monthlyIncome: 300_000, // 黒字 60,000 円/月 → 上限 30,000 円
    recordedDays: 30,
  };

  it("投資可能なとき、今月の上限とリスク許容度が表示される", () => {
    render(<InvestmentCapacityCard livingMargin={okInputs} />);
    expect(screen.getByText("投資余力")).toBeInTheDocument();
    expect(screen.getByText("¥30,000")).toBeInTheDocument();
    expect(screen.getByText("リスク許容度: 中（バランス）")).toBeInTheDocument();
    expect(screen.getByText("200%")).toBeInTheDocument();
  });

  it("防衛資金が未充足のとき、「今月は投資を控える月」と理由が表示される", () => {
    render(<InvestmentCapacityCard livingMargin={{ ...okInputs, totalAssets: 1_200_000 }} />);
    expect(screen.getByText("今月は投資を控える月")).toBeInTheDocument();
    expect(
      screen.getByText("生活の備え（目標 ¥1,440,000）が 83% です。まずは備えを整える段階です。")
    ).toBeInTheDocument();
  });

  it("月次赤字のとき、家計の立て直しを優先する理由が表示される", () => {
    render(<InvestmentCapacityCard livingMargin={{ ...okInputs, monthlyIncome: 200_000 }} />);
    expect(screen.getByText("今月は投資を控える月")).toBeInTheDocument();
    expect(
      screen.getByText("今月は支出が収入を上回るペースです。投資より家計の立て直しが先の段階です。")
    ).toBeInTheDocument();
  });

  it("投資を控える月は検証ツールへのリンクを表示しない", () => {
    render(<InvestmentCapacityCard livingMargin={{ ...okInputs, totalAssets: 1_200_000 }} />);
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("算出不能（総資産未設定）のとき、何も描画しない", () => {
    render(<InvestmentCapacityCard livingMargin={{ ...okInputs, totalAssets: null }} />);
    expect(screen.queryByTestId("investment-capacity-card")).not.toBeInTheDocument();
  });

  it("免責文言が常に表示される", () => {
    render(<InvestmentCapacityCard livingMargin={okInputs} />);
    expect(screen.getByText(/投資成果を保証するものではありません/)).toBeInTheDocument();
  });
});
