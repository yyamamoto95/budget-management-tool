import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickEntryDrawer } from "@/components/expense/QuickEntryDrawer";
import type { CategoryItem } from "@/lib/api/types";

// vaul の Drawer はポータルを使うため、テスト環境では DOM への描画を確認する
vi.mock("@/lib/actions/expense", () => ({
  createExpenseAction: vi.fn().mockResolvedValue({ error: null, success: false }),
}));

// AnimatePresence mode="wait" はジョムで exit アニメーションが完了しないためモックする
vi.mock("framer-motion", async (importOriginal) => {
  const actual = await importOriginal<typeof import("framer-motion")>();
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  };
});

// useActionState のモック
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: vi.fn().mockReturnValue([
      { error: null, success: false },
      vi.fn(),
      false,
    ]),
  };
});

const mockExpenseCategories: CategoryItem[] = [
  { id: 1, key: 'food', name: '食費', color: '#f18840', bg: '#fef5ee', balanceType: 0, displayOrder: 1 },
];

const mockIncomeCategories: CategoryItem[] = [
  { id: 17, key: 'salary', name: '給料', color: '#2dd4bf', bg: '#f0fdfa', balanceType: 1, displayOrder: 1 },
];

describe("QuickEntryDrawer", () => {
  const defaultProps = {
    userId: "user-1",
    open: true,
    onOpenChange: vi.fn(),
    expenseCategories: mockExpenseCategories,
    incomeCategories: mockIncomeCategories,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("openがtrueのとき、ドロワーが表示される", () => {
    render(<QuickEntryDrawer {...defaultProps} />);
    expect(screen.getByText("クイック記録")).toBeInTheDocument();
  });

  it("openがfalseのとき、ドロワーが表示されない", () => {
    render(<QuickEntryDrawer {...defaultProps} open={false} />);
    expect(screen.queryByText("クイック記録")).not.toBeInTheDocument();
  });

  it("支出タブが初期選択されている", () => {
    render(<QuickEntryDrawer {...defaultProps} />);
    const expenseBtn = screen.getByRole("button", { name: "支出" });
    expect(expenseBtn).toBeInTheDocument();
  });

  it("収入タブをクリックすると収入カテゴリが表示される", () => {
    render(<QuickEntryDrawer {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "収入" }));
    expect(screen.getByRole("button", { name: "給料" })).toBeInTheDocument();
  });

  it("記録するボタンが存在する", () => {
    render(<QuickEntryDrawer {...defaultProps} />);
    expect(screen.getByRole("button", { name: "記録する" })).toBeInTheDocument();
  });

  it("エラーが返ったとき、エラーメッセージが表示される", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: "登録に失敗しました", success: false },
      vi.fn(),
      false,
    ]);
    render(<QuickEntryDrawer {...defaultProps} />);
    expect(screen.getByText("登録に失敗しました")).toBeInTheDocument();
  });

  it("成功したとき、成功メッセージが表示される", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: true },
      vi.fn(),
      false,
    ]);
    render(<QuickEntryDrawer {...defaultProps} />);
    expect(screen.getByText("登録しました")).toBeInTheDocument();
  });
});
