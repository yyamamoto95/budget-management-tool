import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RecentExpenses } from "@/components/dashboard/RecentExpenses";
import {
  fixtureAllCategories,
  fixtureExpense,
  localDateStr,
} from "@/__fixtures__/dashboard";

describe("RecentExpenses", () => {
  it("各行が明細ページの該当日へのリンクになっている（#463）", () => {
    const date = localDateStr(0);
    render(
      <RecentExpenses
        recentExpenses={[
          fixtureExpense({ date, amount: 800, categoryId: 1, content: "昼食" }),
        ]}
        allCategories={fixtureAllCategories}
      />,
    );
    const link = screen.getByRole("link", { name: /昼食 の記録を明細で見る/ });
    expect(link).toHaveAttribute("href", `/records?date=${date}`);
  });

  it("記録がないとき、空状態メッセージを表示する", () => {
    render(<RecentExpenses recentExpenses={[]} allCategories={fixtureAllCategories} />);
    expect(screen.getByText("まだ記録がありません")).toBeInTheDocument();
  });
});
