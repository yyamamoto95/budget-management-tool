import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LivingMarginCard } from "@/components/dashboard/LivingMarginCard";

describe("LivingMarginCard", () => {
  const okInputs = {
    totalAssets: 960_000,
    avgDailyExpense: 8_000,
    monthlyIncome: 250_000,
    recordedDays: 30,
  };

  it("算出可能なとき、生活余力（月数）が表示される", () => {
    render(<LivingMarginCard livingMargin={okInputs} />);
    expect(screen.getByText("生活余力")).toBeInTheDocument();
    // 960000 / (8000 × 30) = 4.0ヶ月分
    expect(screen.getByText("4.0")).toBeInTheDocument();
    expect(screen.getByText("ヶ月分")).toBeInTheDocument();
  });

  it("収入が実効支出以上のとき、「余力は増加中」が表示される", () => {
    render(<LivingMarginCard livingMargin={okInputs} />);
    expect(screen.getByText("余力は増加中")).toBeInTheDocument();
  });

  it("収入が実効支出を下回るとき、月次減少ペースが事実ベースで表示される", () => {
    render(<LivingMarginCard livingMargin={{ ...okInputs, monthlyIncome: 120_000 }} />);
    // net = 120000 - 240000 → -0.5ヶ月分/月
    expect(
      screen.getByText("今のペースでは毎月約0.5ヶ月分ずつ減少")
    ).toBeInTheDocument();
  });

  it("減少幅が丸めて0.0になるとき、「余力はほぼ横ばい」と表示される", () => {
    // net = 239000 - 240000 = -1000 → delta = -0.004ヶ月分/月 → 0.0 に丸まる
    render(<LivingMarginCard livingMargin={{ ...okInputs, monthlyIncome: 239_000 }} />);
    expect(screen.getByText("余力はほぼ横ばい")).toBeInTheDocument();
    expect(screen.queryByText(/ずつ減少/)).not.toBeInTheDocument();
  });

  it("総資産が未設定のとき、設定への導線が表示される", () => {
    render(<LivingMarginCard livingMargin={{ ...okInputs, totalAssets: null }} />);
    expect(screen.getByRole("link", { name: /総資産を設定する/ })).toHaveAttribute(
      "href",
      "/settings"
    );
  });

  it("支出記録がないとき、記録を促す案内が表示される", () => {
    render(<LivingMarginCard livingMargin={{ ...okInputs, avgDailyExpense: 0 }} />);
    expect(screen.getByText(/支出の記録が溜まると表示されます/)).toBeInTheDocument();
  });

  it("記録日数が不足しているとき、7日分溜まると表示される旨の案内が出る", () => {
    render(<LivingMarginCard livingMargin={{ ...okInputs, recordedDays: 3 }} />);
    expect(screen.getByText(/7日分溜まると表示されます/)).toBeInTheDocument();
  });
});
