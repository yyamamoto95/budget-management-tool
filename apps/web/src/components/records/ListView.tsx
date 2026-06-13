"use client";

import { useMemo, createElement } from "react";
import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import { getCategoryIcon } from "@/lib/categoryTokens";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";

type DateGroup = {
  date: string;
  label: string;
  dailyTotal: number;
  items: ExpenseResponse[];
};

function formatDateLabel(dateStr: string): string {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const [, m, d] = dateStr.split("-");
  const base = `${Number(m)}月${Number(d)}日`;
  if (dateStr === todayStr) return `${base}（今日）`;
  if (dateStr === yesterdayStr) return `${base}（昨日）`;
  return base;
}

function groupByDate(expenses: ExpenseResponse[]): DateGroup[] {
  const map = new Map<string, ExpenseResponse[]>();
  for (const e of expenses) {
    const arr = map.get(e.date) ?? [];
    arr.push(e);
    map.set(e.date, arr);
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      label: formatDateLabel(date),
      dailyTotal: items.reduce((sum, it) => {
        return it.balanceType === 0 ? sum - it.amount : sum + it.amount;
      }, 0),
      items,
    }));
}

function RecordItem({
  item,
  category,
  hasBorderBottom,
}: {
  item: ExpenseResponse;
  category: CategoryItem | undefined;
  hasBorderBottom: boolean;
}) {
  const isIncome = item.balanceType === 1;
  const catKey = category?.key ?? "other";
  const catName = category?.name ?? "未分類";
  const catColor = category?.color ?? "#999";
  const catBg = category?.bg ?? "rgba(28,20,16,0.06)";
  const IconComp = getCategoryIcon(catKey);

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5"
      style={{
        borderBottom: hasBorderBottom
          ? "1px solid var(--border-default)"
          : "none",
      }}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center"
        style={{ background: catBg, borderRadius: "9px" }}
        aria-hidden
      >
        {createElement(IconComp, { size: 14, style: { color: catColor } })}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[13px] font-semibold"
          style={{ color: "var(--foreground)" }}
        >
          {item.content?.trim() || catName}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className="inline-flex items-center px-1.5 text-[10px] font-semibold leading-[16px]"
            style={{ background: catBg, color: catColor, borderRadius: "4px" }}
          >
            {catName}
          </span>
        </div>
      </div>
      <div
        className="shrink-0 text-[14px] font-bold tabular-nums"
        style={{
          color: isIncome ? "var(--color-income)" : "var(--foreground)",
          letterSpacing: "-0.01em",
        }}
      >
        {isIncome ? "+" : "−"}¥{item.amount.toLocaleString("ja-JP")}
      </div>
    </div>
  );
}

type Props = {
  expenses: ExpenseResponse[];
  categoryMap: Map<string, CategoryItem>;
};

export function ListView({ expenses, categoryMap }: Props) {
  const groups = useMemo(() => groupByDate(expenses), [expenses]);

  if (groups.length === 0) {
    return (
      <div
        className="py-16 text-center text-[13px]"
        style={{ color: "var(--foreground)", opacity: 0.4 }}
      >
        記録が見つかりません
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => (
        <motion.div
          key={group.date}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.base, delay: gi * 0.03 }}
          className="overflow-hidden rounded-xl border"
          style={{
            background: "var(--color-surface-default)",
            borderColor: "var(--border-default)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          {/* グループヘッダー */}
          <div
            className="flex items-center justify-between border-b px-4 py-2.5"
            style={{
              borderColor: "var(--border-default)",
              background: "rgba(28,20,16,0.03)",
            }}
          >
            <span
              className="text-[12px] font-extrabold"
              style={{ color: "var(--foreground)" }}
            >
              {group.label}
            </span>
            <span
              className="text-[11px] font-bold tabular-nums"
              style={{
                color:
                  group.dailyTotal >= 0
                    ? "var(--color-income)"
                    : "var(--foreground)",
                opacity: group.dailyTotal >= 0 ? 1 : 0.42,
              }}
            >
              {group.dailyTotal >= 0
                ? `+¥${group.dailyTotal.toLocaleString("ja-JP")}`
                : `−¥${Math.abs(group.dailyTotal).toLocaleString("ja-JP")}`}
            </span>
          </div>
          {/* アイテムリスト */}
          {group.items.map((item, i) => (
            <RecordItem
              key={item.id}
              item={item}
              category={categoryMap.get(
                `${item.balanceType}-${item.categoryId}`,
              )}
              hasBorderBottom={i < group.items.length - 1}
            />
          ))}
        </motion.div>
      ))}
    </div>
  );
}
