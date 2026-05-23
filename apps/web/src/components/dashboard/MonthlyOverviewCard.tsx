import type { ExpenseResponse } from "@/lib/api/types";

type Props = {
  expenses: ExpenseResponse[];
};

/** 当月の支出合計・収入合計・残りを3列で表示するコンパクトカード */
export function MonthlyOverviewCard({ expenses }: Props) {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(yearMonth));

  const totalOutgo = monthlyExpenses
    .filter((e) => e.balanceType === 0)
    .reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = monthlyExpenses
    .filter((e) => e.balanceType === 1)
    .reduce((sum, e) => sum + e.amount, 0);
  const remaining = totalIncome - totalOutgo;

  const isPositive = remaining > 0;
  const isNegative = remaining < 0;
  // 残額の符号文字
  let remainingSign: string;
  if (isPositive) remainingSign = "+";
  else if (isNegative) remainingSign = "-";
  else remainingSign = "";

  return (
    <section
      className="rounded-2xl border-2 border-[#1c1410] bg-white p-4"
      style={{ boxShadow: "var(--shadow-pop)" }}
    >
      <h2 className="mb-3 text-xs font-extrabold text-[#1c1410]/50 tracking-wide uppercase">
        {now.getMonth() + 1}月の収支
      </h2>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-[#fff6ee] p-3 text-center">
          <p className="text-xs font-bold text-[#f18840]">支出</p>
          <p className="mt-1 text-sm font-extrabold tabular-nums text-[#1c1410] break-all">
            ¥{totalOutgo.toLocaleString("ja-JP")}
          </p>
        </div>
        <div className="rounded-xl bg-[#ecfaf8] p-3 text-center">
          <p className="text-xs font-bold text-[#35b5a2]">収入</p>
          <p className="mt-1 text-sm font-extrabold tabular-nums text-[#1c1410] break-all">
            ¥{totalIncome.toLocaleString("ja-JP")}
          </p>
        </div>
        <div
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: isNegative ? "#fee2e2" : "#ecfaf8" }}
        >
          <p
            className="text-xs font-bold"
            style={{ color: isNegative ? "#f87171" : "#35b5a2" }}
          >
            残り
          </p>
          <p
            className="mt-1 text-sm font-extrabold tabular-nums break-all"
            style={{
              color: isNegative
                ? "var(--color-expense)"
                : "var(--color-income)",
            }}
          >
            {remainingSign}¥{Math.abs(remaining).toLocaleString("ja-JP")}
          </p>
        </div>
      </div>
    </section>
  );
}
