import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { QuickEntryDrawer } from "@/components/expense/QuickEntryDrawer";
import type { CategoryItem } from "@/lib/api/types";

// vi.mock はホイストされるため、参照する変数は vi.hoisted で先に初期化する
const { routerRefresh } = vi.hoisted(() => ({ routerRefresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: routerRefresh }),
}));


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

  it("支出登録に成功し実効日次支出があるとき、生活余力の変化がフィードバックされる", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: true, registeredAmount: 4000, registeredBalanceType: 0 },
      vi.fn(),
      false,
    ]);
    render(<QuickEntryDrawer {...defaultProps} effectiveDailyExpense={8000} />);
    // 4000円 / 8000円/日 = 0.5日分
    expect(screen.getByText("生活余力 −0.5日分")).toBeInTheDocument();
  });

  it("支出の影響がごく小さいとき、「ほぼ変わりません」が表示される", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: true, registeredAmount: 500, registeredBalanceType: 0 },
      vi.fn(),
      false,
    ]);
    render(<QuickEntryDrawer {...defaultProps} effectiveDailyExpense={8000} />);
    expect(screen.getByText("生活余力はほぼ変わりません")).toBeInTheDocument();
  });

  it("収入登録のとき、生活余力フィードバックは表示されない", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: true, registeredAmount: 200000, registeredBalanceType: 1 },
      vi.fn(),
      false,
    ]);
    render(<QuickEntryDrawer {...defaultProps} effectiveDailyExpense={8000} />);
    expect(screen.getByText("登録しました")).toBeInTheDocument();
    expect(screen.queryByText(/生活余力/)).not.toBeInTheDocument();
  });

  it("実効日次支出が不明（未指定）のとき、成功メッセージのみ表示される", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: true, registeredAmount: 4000, registeredBalanceType: 0 },
      vi.fn(),
      false,
    ]);
    render(<QuickEntryDrawer {...defaultProps} />);
    expect(screen.getByText("登録しました")).toBeInTheDocument();
    expect(screen.queryByText(/生活余力/)).not.toBeInTheDocument();
  });

  it("登録成功後、金額・メモがリセットされ二重登録できない（#461）", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: false },
      vi.fn(),
      false,
    ]);
    const { rerender } = render(<QuickEntryDrawer {...defaultProps} />);

    // テンキーで 800 円を入力し、メモも入れる
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.change(screen.getByLabelText("メモ"), { target: { value: "コーヒー" } });
    expect(screen.getByText("800")).toBeInTheDocument();

    // 登録成功状態へ遷移させる
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: true, registeredAmount: 800, registeredBalanceType: 0 },
      vi.fn(),
      false,
    ]);
    rerender(<QuickEntryDrawer {...defaultProps} />);

    // 金額・メモがリセットされている
    expect(screen.queryByText("800")).not.toBeInTheDocument();
    expect(screen.getByLabelText("メモ")).toHaveValue("");
    // 記録ボタンは成功フィードバックに置き換わり、そのままの再送信ができない
    expect(screen.getByText("記録しました！")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /記録する/ })).not.toBeInTheDocument();
  });

  it("成功フィードバックは一定時間後に記録ボタンへ戻る（#461）", async () => {
    vi.useFakeTimers();
    try {
      const { useActionState } = await import("react");
      vi.mocked(useActionState).mockReturnValue([
        { error: null, success: true, registeredAmount: 800, registeredBalanceType: 0 },
        vi.fn(),
        false,
      ]);
      render(<QuickEntryDrawer {...defaultProps} />);
      expect(screen.getByText("記録しました！")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.queryByText("記録しました！")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /記録する/ })).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("金額入力中、「記録後の残り」プレビューが表示される（#461）", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: false },
      vi.fn(),
      false,
    ]);
    render(
      <QuickEntryDrawer
        {...defaultProps}
        dailyBudget={{ amount: 2400, remaining: 2000 }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    expect(screen.getByText("記録後の残り：")).toBeInTheDocument();
    expect(screen.getByText("¥1,500")).toBeInTheDocument();
  });

  it("記録後の残りが1日予算の20%未満のとき、警告色で表示される（#461）", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: false },
      vi.fn(),
      false,
    ]);
    render(
      <QuickEntryDrawer
        {...defaultProps}
        dailyBudget={{ amount: 2400, remaining: 2000 }}
      />,
    );
    // 1,800円入力 → 残り200円（2400×20%=480円 未満）
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    fireEvent.click(screen.getByRole("button", { name: "0" }));
    const value = screen.getByText("¥200");
    expect(value).toHaveStyle({ color: "#f43f5e" });
  });

  it("ドロワーを閉じて再オープンすると、前回の成功メッセージ・フィードバックがクリアされる（#461）", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: true, registeredAmount: 4000, registeredBalanceType: 0 },
      vi.fn(),
      false,
    ]);
    const { rerender } = render(
      <QuickEntryDrawer {...defaultProps} effectiveDailyExpense={8000} />,
    );
    expect(screen.getByText("登録しました")).toBeInTheDocument();
    expect(screen.getByText(/生活余力/)).toBeInTheDocument();

    // 閉じて再オープン
    rerender(
      <QuickEntryDrawer {...defaultProps} open={false} effectiveDailyExpense={8000} />,
    );
    rerender(
      <QuickEntryDrawer {...defaultProps} open={true} effectiveDailyExpense={8000} />,
    );
    expect(screen.queryByText("登録しました")).not.toBeInTheDocument();
    expect(screen.queryByText(/生活余力/)).not.toBeInTheDocument();
  });

  it("収入タブでは「記録後の残り」プレビューを表示しない（#461）", async () => {
    const { useActionState } = await import("react");
    vi.mocked(useActionState).mockReturnValue([
      { error: null, success: false },
      vi.fn(),
      false,
    ]);
    render(
      <QuickEntryDrawer
        {...defaultProps}
        dailyBudget={{ amount: 2400, remaining: 2000 }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "収入" }));
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(screen.queryByText("記録後の残り：")).not.toBeInTheDocument();
  });
});
