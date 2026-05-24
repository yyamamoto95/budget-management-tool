import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";

type Props = {
  expenses: ExpenseResponse[];
  allCategories: CategoryItem[];
};

/** 過去7日分のデータを集計する */
function buildGraphData(expenses: ExpenseResponse[]) {
  const today = new Date();
  const days: { date: string; label: string; outgo: number; income: number }[] =
    [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = `${d.getMonth() + 1}/${d.getDate()}`;

    const dayExpenses = expenses.filter((e) => e.date === dateStr);
    const outgo = dayExpenses
      .filter((e) => e.balanceType === 0)
      .reduce((s, e) => s + e.amount, 0);
    const income = dayExpenses
      .filter((e) => e.balanceType === 1)
      .reduce((s, e) => s + e.amount, 0);

    days.push({ date: dateStr, label, outgo, income });
  }

  return days;
}

/** SVG ラインチャートを描画する */
function LineChart({
  data,
}: {
  data: ReturnType<typeof buildGraphData>;
}) {
  const W = 560;
  const H = 280;
  const PAD = { top: 24, right: 20, bottom: 32, left: 56 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(
    ...data.flatMap((d) => [d.outgo, d.income]),
    100,
  );

  const yTicks = Array.from({ length: 6 }, (_, i) =>
    Math.round((maxVal / 5) * i),
  );

  const xStep = innerW / (data.length - 1);

  const toX = (i: number) => PAD.left + i * xStep;
  const toY = (val: number) =>
    PAD.top + innerH - (val / maxVal) * innerH;

  const pathD = (key: "outgo" | "income") =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(d[key])}`)
      .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="直近7日間の収支グラフ"
    >
      {/* グリッドライン */}
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={PAD.left}
            y1={toY(tick)}
            x2={W - PAD.right}
            y2={toY(tick)}
            stroke="#e8c8b0"
            strokeWidth="1"
            strokeDasharray="4 2"
          />
          <text
            x={PAD.left - 6}
            y={toY(tick) + 4}
            textAnchor="end"
            fontSize="10"
            fill="#1c1410"
            opacity="0.4"
          >
            {tick >= 1000 ? `${Math.round(tick / 100) * 100}円` : `${tick}円`}
          </text>
        </g>
      ))}

      {/* X軸ラベル */}
      {data.map((d, i) => (
        <text
          key={d.date}
          x={toX(i)}
          y={H - 4}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#1c1410"
          opacity="0.4"
        >
          {d.label}
        </text>
      ))}

      {/* 支出ライン */}
      <path
        d={pathD("outgo")}
        fill="none"
        stroke="var(--color-expense)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 収入ライン */}
      <path
        d={pathD("income")}
        fill="none"
        stroke="var(--color-income)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* 支出ドット */}
      {data.map((d, i) => (
        <circle
          key={`outgo-${d.date}`}
          cx={toX(i)}
          cy={toY(d.outgo)}
          r="5"
          fill="white"
          stroke="var(--color-expense)"
          strokeWidth="2.5"
        />
      ))}

      {/* 収入ドット */}
      {data.map((d, i) => (
        <circle
          key={`income-${d.date}`}
          cx={toX(i)}
          cy={toY(d.income)}
          r="5"
          fill="white"
          stroke="var(--color-income)"
          strokeWidth="2.5"
        />
      ))}
    </svg>
  );
}

/** 直近の支出リスト（グラフ下部） */
function RecentList({ expenses, allCategories }: { expenses: ExpenseResponse[]; allCategories: CategoryItem[] }) {
  const recent = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  if (recent.length === 0) return null;

  return (
    <ul className="mt-2 divide-y divide-[#e8c8b0]">
      {recent.map((expense) => {
        const category = allCategories.find(
          (c) => c.balanceType === expense.balanceType && c.id === expense.categoryId,
        );
        const isOutgo = expense.balanceType === 0;

        return (
          <li key={expense.id} className="flex items-center justify-between py-2.5">
            <div className="flex items-center gap-2">
              {category && (
                <span
                  className="rounded-full border border-[#1c1410]/10 px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.name}
                </span>
              )}
              {expense.content && (
                <span className="text-xs font-medium text-[#1c1410]/50">{expense.content}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-extrabold tabular-nums"
                style={{
                  color: isOutgo ? "var(--color-expense)" : "var(--color-income)",
                }}
              >
                {isOutgo ? "-" : "+"}¥{expense.amount.toLocaleString()}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/** 直近のレポートカード（グラフ + リスト） */
export function RecentGraph({ expenses, allCategories }: Props) {
  const data = buildGraphData(expenses);

  return (
    <section
      className="flex h-full flex-col rounded-2xl border-2 border-[#1c1410] bg-white p-5"
      style={{ boxShadow: "var(--shadow-pop)" }}
    >
      <h2 className="mb-4 text-center text-sm font-extrabold text-[#1c1410] tracking-wide uppercase">
        直近のレポート
      </h2>

      {/* 凡例 */}
      <div className="mb-3 flex items-center justify-center gap-4 text-xs font-bold text-[#1c1410]/50">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-5 rounded-full"
            style={{ backgroundColor: "var(--color-expense)" }}
          />
          支出
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block h-2.5 w-5 rounded-full"
            style={{ backgroundColor: "var(--color-income)" }}
          />
          収入
        </span>
      </div>

      {/* グラフ */}
      <LineChart data={data} />

      {/* 直近リスト */}
      <RecentList expenses={expenses} allCategories={allCategories} />
    </section>
  );
}
