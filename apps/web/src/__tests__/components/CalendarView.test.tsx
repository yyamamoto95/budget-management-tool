import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CalendarView } from "@/components/calendar/CalendarView";
import type { ExpenseResponse } from "@/lib/api/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/calendar",
}));

const todayStr = new Date().toISOString().split("T")[0];

const mockExpenses: ExpenseResponse[] = [
  {
    id: "1",
    date: todayStr,
    balanceType: 0,
    amount: 1500,
    categoryId: 1,
    content: "スーパー",
    userId: "user-1",
    createdDate: todayStr,
    updatedDate: todayStr,
    deletedDate: null,
  },
  {
    id: "2",
    date: todayStr,
    balanceType: 1,
    amount: 250000,
    categoryId: 17,
    content: "給料",
    userId: "user-1",
    createdDate: todayStr,
    updatedDate: todayStr,
    deletedDate: null,
  },
];

describe("CalendarView", () => {
  it("カレンダーと選択日のサマリーが表示される", () => {
    render(<CalendarView expenses={mockExpenses} userId="user-1" allCategories={[]} />);
    // カレンダーヘッダー（月表示）
    const now = new Date();
    expect(
      screen.getByText(`${now.getFullYear()}年${now.getMonth() + 1}月`),
    ).toBeInTheDocument();
  });

  it("今日の支出・収入サマリーが表示される", () => {
    render(<CalendarView expenses={mockExpenses} userId="user-1" allCategories={[]} />);
    expect(screen.getByText("¥1,500")).toBeInTheDocument();
    expect(screen.getByText("¥250,000")).toBeInTheDocument();
  });

  it("今日の明細が表示される", () => {
    render(<CalendarView expenses={mockExpenses} userId="user-1" allCategories={[]} />);
    expect(screen.getByText("スーパー")).toBeInTheDocument();
    // 「給料」は content として表示される
    expect(screen.getAllByText("給料").length).toBeGreaterThanOrEqual(1);
  });

  it("記録がない日をタップすると「記録はありません」が表示される", () => {
    render(<CalendarView expenses={[]} userId="user-1" allCategories={[]} />);
    expect(screen.getByText("この日の記録はありません")).toBeInTheDocument();
  });

  it("「詳細記録」リンクが今日の日付を含む href を持つ", () => {
    render(<CalendarView expenses={mockExpenses} userId="user-1" allCategories={[]} />);
    const link = screen.getByRole("link", { name: /詳細記録/ });
    expect(link).toHaveAttribute("href", `/expenses/new?date=${todayStr}`);
  });

  it("初期表示で今日が選択されており明細が表示される", () => {
    render(<CalendarView expenses={mockExpenses} userId="user-1" allCategories={[]} />);
    // 今日が選択状態のため今日の明細が初期表示される
    expect(screen.getByText("スーパー")).toBeInTheDocument();
  });
});
