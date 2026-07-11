import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ImportClient } from "@/components/imports/ImportClient";
import { analyzeImportAction, commitImportAction } from "@/lib/actions/imports";
import type { CategoryItem } from "@/lib/api/types";

vi.mock("@/lib/actions/imports", () => ({
  analyzeImportAction: vi.fn(),
  commitImportAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { warning: vi.fn(), success: vi.fn(), error: vi.fn() }),
}));

const expenseCategories: CategoryItem[] = [
  { id: 6, key: "education", name: "教育・こども", color: "#17B10A", bg: "#f0fdf6", balanceType: 0, displayOrder: 6 },
  { id: 0, key: "other", name: "その他・不明", color: "#333333", bg: "#f5f5f5", balanceType: 0, displayOrder: 10 },
];
const incomeCategories: CategoryItem[] = [
  { id: 1, key: "salary", name: "給料", color: "#10B702", bg: "#f0fdf6", balanceType: 1, displayOrder: 1 },
];

const candidates = [
  {
    date: "2026-06-29",
    amount: 17504,
    balanceType: 0 as const,
    content: "ニホンガクセイシエンキ",
    categoryId: 6,
    confidence: "high" as const,
    raw: "29日 ニホンガクセイシエンキ -¥17,504",
    duplicateSuspect: false,
  },
  {
    date: "2026-06-25",
    amount: 300000,
    balanceType: 1 as const,
    content: "ヤマモト ユウダイ",
    categoryId: 1,
    confidence: "low" as const,
    raw: "25日 ヤマモト ユウダイ ¥300,000",
    duplicateSuspect: true,
  },
];

async function analyzeToReview() {
  vi.mocked(analyzeImportAction).mockResolvedValue({
    status: "success",
    candidates,
    skippedRows: 1,
    source: "claude-api",
  });
  render(<ImportClient expenseCategories={expenseCategories} incomeCategories={incomeCategories} />);
  const input = screen.getByTestId("import-file-input");
  const file = new File(["img"], "statement.png", { type: "image/png" });
  fireEvent.change(input, { target: { files: [file] } });
  await waitFor(() => expect(screen.getByText("読み取り結果 2 件")).toBeInTheDocument());
}

describe("ImportClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("初期表示: 画像選択ボタンと注意書きが表示される", () => {
    render(<ImportClient expenseCategories={expenseCategories} incomeCategories={incomeCategories} />);
    expect(screen.getByText("スクリーンショットを選ぶ")).toBeInTheDocument();
    expect(screen.getByText(/画像は保存されません/)).toBeInTheDocument();
  });

  it("解析成功で候補一覧が表示され、要確認・重複バッジと部分失敗が明示される", async () => {
    await analyzeToReview();
    expect(screen.getByText("ニホンガクセイシエンキ")).toBeInTheDocument();
    expect(screen.getByText("教育・こども")).toBeInTheDocument();
    expect(screen.getByText("要確認")).toBeInTheDocument();
    expect(screen.getByText("登録済みの可能性")).toBeInTheDocument();
    expect(screen.getByText(/読み取れなかった行が 1 行/)).toBeInTheDocument();
  });

  it("重複疑い行は初期選択オフで、登録件数・合計に含まれない", async () => {
    await analyzeToReview();
    // 選択は 1 件（重複疑いの収入 300,000 は外れている）
    expect(screen.getByRole("button", { name: /1 件を登録する（支出 −¥17,504）/ })).toBeInTheDocument();
  });

  it("重複疑い行を含め直すと合計に収入が加算される", async () => {
    await analyzeToReview();
    fireEvent.click(screen.getByRole("button", { name: "ヤマモト ユウダイ を含める" }));
    expect(
      screen.getByRole("button", { name: /2 件を登録する（支出 −¥17,504 \/ 収入 \+¥300,000）/ }),
    ).toBeInTheDocument();
  });

  it("行タップで編集シートが開き、カテゴリ変更が一覧へ反映される", async () => {
    await analyzeToReview();
    fireEvent.click(screen.getByRole("button", { name: "ニホンガクセイシエンキ を編集" }));
    expect(screen.getByText("候補を修正")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "その他・不明" }));
    fireEvent.click(screen.getByRole("button", { name: /閉じる/ }));
    await waitFor(() => expect(screen.queryByText("候補を修正")).not.toBeInTheDocument());
    expect(screen.getAllByText("その他・不明").length).toBeGreaterThan(0);
  });

  it("登録すると選択行のみが commit され、完了表示になる", async () => {
    vi.mocked(commitImportAction).mockResolvedValue({ status: "success", registered: 1 });
    await analyzeToReview();
    fireEvent.click(screen.getByRole("button", { name: /1 件を登録する/ }));
    await waitFor(() => expect(screen.getByText("1 件を登録しました")).toBeInTheDocument());
    expect(commitImportAction).toHaveBeenCalledWith([
      {
        date: "2026-06-29",
        amount: 17504,
        balanceType: 0,
        categoryId: 6,
        content: "ニホンガクセイシエンキ",
      },
    ]);
  });

  it("解析エラー時は初期表示に戻る", async () => {
    vi.mocked(analyzeImportAction).mockResolvedValue({ status: "error", message: "解析失敗" });
    render(<ImportClient expenseCategories={expenseCategories} incomeCategories={incomeCategories} />);
    const file = new File(["img"], "statement.png", { type: "image/png" });
    fireEvent.change(screen.getByTestId("import-file-input"), { target: { files: [file] } });
    await waitFor(() => expect(screen.getByText("スクリーンショットを選ぶ")).toBeInTheDocument());
  });
});
