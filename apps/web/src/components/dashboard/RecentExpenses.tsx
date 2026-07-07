"use client";

import { useMemo, createElement } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight } from "lucide-react";

// 行全体を明細（該当日）へのリンクにする（#463）。編集・削除は明細側で行う導線設計
const MotionLink = motion.create(Link);
import { SPRING } from "@/lib/motion";
import { getCategoryIcon } from "@/lib/categoryTokens";
import type { ExpenseResponse, CategoryItem } from "@/lib/api/types";

type Props = {
  recentExpenses: ExpenseResponse[];
  allCategories: CategoryItem[];
};

type GroupedDay = {
  date: string;
  label: string;
  dayTotal: number;
  items: ExpenseResponse[];
};

function groupByDate(list: ExpenseResponse[]): GroupedDay[] {
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const map = new Map<string, ExpenseResponse[]>();
  for (const it of list) {
    const arr = map.get(it.date) ?? [];
    arr.push(it);
    map.set(it.date, arr);
  }

  const entries = Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  return entries.slice(0, 3).map(([date, items]) => {
    let label: string;
    if (date === todayStr) label = "今日";
    else if (date === yesterdayStr) label = "昨日";
    else label = date.replace(/-/g, "/");

    const dayTotal = items
      .filter((it) => it.balanceType === 0)
      .reduce((s, it) => s + it.amount, 0);

    return { date, items, label, dayTotal };
  });
}

function RecordItem({
  item,
  category,
  hasBorderBottom,
  index,
}: {
  item: ExpenseResponse;
  category: CategoryItem | undefined;
  hasBorderBottom: boolean;
  index: number;
}) {
  const isIncome = item.balanceType === 1;
  const catKey = category?.key ?? "other";
  const catName = category?.name ?? "未分類";
  const catColor = category?.color ?? "#999";
  const catBg = category?.bg ?? "rgba(28,20,16,0.06)";
  const IconComp = getCategoryIcon(catKey);
  const time = item.createdDate
    ? new Date(item.createdDate).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <MotionLink
      href={`/records?date=${item.date}`}
      aria-label={`${item.content?.trim() || catName} の記録を明細で見る`}
      className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[rgba(28,20,16,0.03)] active:bg-[rgba(28,20,16,0.05)]"
      style={{
        textDecoration: "none",
        borderBottom: hasBorderBottom ? "1px solid var(--border-default)" : "none",
      }}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.15, ease: "easeOut" }}
      whileTap={{ scale: 0.99 }}
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
          {time && (
            <span className="text-[10px]" style={{ color: "var(--foreground)", opacity: 0.22 }}>
              {time}
            </span>
          )}
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
    </MotionLink>
  );
}

export function RecentExpenses({ recentExpenses, allCategories }: Props) {
  const grouped = useMemo(() => groupByDate(recentExpenses), [recentExpenses]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, CategoryItem>();
    for (const cat of allCategories) {
      map.set(`${cat.balanceType}-${cat.id}`, cat);
    }
    return map;
  }, [allCategories]);

  return (
    <motion.div
      className="mt-3 overflow-hidden rounded-2xl border"
      style={{
        background: "var(--color-surface-default)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
    >
      {/* ヘッダー */}
      <div
        className="flex items-center justify-between border-b px-4 py-3"
        style={{ borderColor: "var(--border-default)" }}
      >
        <span className="text-sm font-bold" style={{ color: "var(--foreground)" }}>
          最近の記録
        </span>
        <Link
          href="/records?period=all"
          className="flex items-center gap-0.5 text-[12px] font-semibold"
          style={{ color: "var(--color-brand-primary)", textDecoration: "none" }}
        >
          すべて見る <ChevronRight size={12} />
        </Link>
      </div>

      {/* 空状態 */}
      {grouped.length === 0 && (
        <div
          className="px-4 py-8 text-center text-sm"
          style={{ color: "var(--foreground)", opacity: 0.4 }}
        >
          まだ記録がありません
        </div>
      )}

      {/* 日付グループ */}
      {grouped.map((group) => (
        <div key={group.date}>
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              background: "rgba(28,20,16,0.03)",
              borderBottom: "1px solid var(--border-default)",
            }}
          >
            <span className="text-[12px] font-extrabold" style={{ color: "var(--foreground)" }}>
              {group.label}
            </span>
            {group.dayTotal > 0 && (
              <span
                className="text-[11px] font-semibold tabular-nums"
                style={{ color: "var(--foreground)", opacity: 0.42 }}
              >
                −¥{group.dayTotal.toLocaleString("ja-JP")}
              </span>
            )}
          </div>

          {group.items.map((it, i) => (
            <RecordItem
              key={it.id}
              item={it}
              category={categoryMap.get(`${it.balanceType}-${it.categoryId}`)}
              hasBorderBottom={i < group.items.length - 1}
              index={i}
            />
          ))}
        </div>
      ))}
    </motion.div>
  );
}
