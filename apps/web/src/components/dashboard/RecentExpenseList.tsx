import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";

type Props = {
  expenses: ExpenseResponse[];
  allCategories: CategoryItem[];
};

const MAX_RECORDS = 5;

/** 最近の記録5件を新しい順に表示するリスト */
export function RecentExpenseList({ expenses, allCategories }: Props) {
  const recent = [...expenses]
    .sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return b.id.localeCompare(a.id);
    })
    .slice(0, MAX_RECORDS);

  return (
    <section
      className="rounded-2xl border-2 border-[#1c1410] bg-white p-4"
      style={{ boxShadow: "var(--shadow-pop)" }}
    >
      <h2 className="mb-3 text-xs font-extrabold text-[#1c1410]/50 tracking-wide uppercase">
        最近の記録
      </h2>
      {recent.length === 0 ? (
        <p className="py-4 text-center text-sm text-[#1c1410]/40">
          まだ記録がありません
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-[#e8c8b0]">
          {recent.map((expense) => {
            const category = allCategories.find(
              (c) => c.balanceType === expense.balanceType && c.id === expense.categoryId,
            );
            const isOutgo = expense.balanceType === 0;
            return (
              <li key={expense.id} className="flex items-center justify-between py-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: category?.color ?? "#333" }}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#1c1410]">
                      {expense.content || category?.name || "未分類"}
                    </p>
                    <p className="text-xs text-[#1c1410]/40">
                      {expense.date} · {category?.name ?? "未分類"}
                    </p>
                  </div>
                </div>
                <p
                  className="ml-3 shrink-0 text-sm font-extrabold tabular-nums"
                  style={{
                    color: isOutgo
                      ? "var(--color-expense)"
                      : "var(--color-income)",
                  }}
                >
                  {isOutgo ? "-" : "+"}¥{expense.amount.toLocaleString("ja-JP")}
                </p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
