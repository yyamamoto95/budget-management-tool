import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecordsPage } from "@/components/records/RecordsPage";
import { fixtureAllCategories, fixtureExpense } from "@/__fixtures__/dashboard";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

describe("RecordsPage — 日付絞り込み（#463）", () => {
  beforeEach(() => {
    push.mockClear();
  });

  it("initialDate 指定時、日付絞り込みチップが表示される", () => {
    render(
      <RecordsPage
        initialExpenses={[fixtureExpense({ date: "2026-07-08", amount: 800 })]}
        allCategories={fixtureAllCategories}
        initialPeriod="all"
        initialSearch=""
        initialDate="2026-07-08"
      />,
    );
    expect(screen.getByText("7月8日の記録")).toBeInTheDocument();
  });

  it("チップの解除ボタンで date を含まない URL へ遷移する", () => {
    render(
      <RecordsPage
        initialExpenses={[]}
        allCategories={fixtureAllCategories}
        initialPeriod="all"
        initialSearch=""
        initialDate="2026-07-08"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "日付の絞り込みを解除" }));
    expect(push).toHaveBeenCalledWith("/records?period=all", { scroll: false });
  });

  it("initialDate 未指定のとき、チップは表示されない", () => {
    render(
      <RecordsPage
        initialExpenses={[]}
        allCategories={fixtureAllCategories}
        initialPeriod="month"
        initialSearch=""
      />,
    );
    expect(screen.queryByText(/の記録$/)).not.toBeInTheDocument();
  });
});
