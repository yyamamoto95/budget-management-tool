"use client";

import { useState, useCallback } from "react";
import { saveSettingsAction } from "@/lib/actions/settings";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  TrendingUp, Zap, Car, ShoppingBag,
  Wallet, Heart, Home, PiggyBank, Check,
  User, ChevronRight, BookOpen, Settings as SettingsIcon,
} from "lucide-react";
import { GuideTab } from "./GuideTab";
import { SPRING, PAGE_VARIANTS, PAGE_ITEM_VARIANTS } from "@/lib/motion";
import { calcDailyBudget } from "@budget/common";
import type { UserSettingsResponse, FixedExpensesDetail } from "@budget/api-client";
import { AmountField } from "../common/AmountField";
import { SalaryDayPicker } from "./SalaryDayPicker";
import { DataExportSection } from "./DataExportSection";

type FixedKey = keyof FixedExpensesDetail;

const FIXED_COST_ITEMS: {
  key: FixedKey;
  label: string;
  icon: React.ElementType;
  step: number;
}[] = [
  { key: "rent", label: "家賃", icon: Home, step: 1000 },
  { key: "utilities", label: "光熱費", icon: Zap, step: 1000 },
  { key: "insurance", label: "保険料", icon: Heart, step: 500 },
  { key: "subscriptions", label: "サブスク", icon: ShoppingBag, step: 500 },
  { key: "transportation", label: "交通費", icon: Car, step: 1000 },
  { key: "other", label: "その他固定費", icon: Wallet, step: 1000 },
];

const DEFAULT_FIXED: FixedExpensesDetail = {
  rent: 0,
  utilities: 0,
  insurance: 0,
  subscriptions: 0,
  transportation: 0,
  other: 0,
};

type Props = {
  settings: UserSettingsResponse;
};

type SavingsMode = "monthly" | "yearly";

function calcTotalFixed(detail: FixedExpensesDetail): number {
  return Object.values(detail).reduce((a, b) => a + b, 0);
}

function getBudgetColor(dailyBudget: number): string {
  if (dailyBudget >= 3000) return "var(--color-income)";
  if (dailyBudget >= 1000) return "var(--color-caution)";
  return "var(--color-danger)";
}

export function SettingsClient({ settings }: Props) {
  // 設定 / ガイドのタブ切替（#551 / sandbox PersonalSettingsPrototype 承認済み）
  const [activeMenu, setActiveMenu] = useState<"settings" | "guide">("settings");
  // 設定フォーム状態
  const [salaryDay, setSalaryDay] = useState(settings.paydayDay);
  const [monthlyIncome, setMonthlyIncome] = useState(settings.monthlyIncome);
  const [fixedDetail, setFixedDetail] = useState<FixedExpensesDetail>(
    settings.fixedExpensesDetail ?? DEFAULT_FIXED,
  );
  const [currentBalance, setCurrentBalance] = useState(settings.totalAssets);
  const [savingsMode, setSavingsMode] = useState<SavingsMode>("monthly");
  const [savingsMonthly, setSavingsMonthly] = useState(settings.savingsGoal);
  const [savingsYearly, setSavingsYearly] = useState(settings.savingsGoal * 12);

  // 保存状態
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 計算値
  const totalFixed = calcTotalFixed(fixedDetail);
  const monthlySavings = savingsMode === "monthly" ? savingsMonthly : Math.round(savingsYearly / 12);
  const disposable = monthlyIncome - totalFixed - monthlySavings;
  // 1日予算プレビューはホーム（dashboard）と同じ共有ロジックで算出し、表示を一致させる（#457）
  const { dailyBudget } = calcDailyBudget({
    totalAssets: currentBalance,
    fixedExpenses: totalFixed,
    paydayDay: salaryDay,
    savingsGoal: monthlySavings,
    today: new Date(),
  });
  const budgetColor = getBudgetColor(dailyBudget);

  const inc = monthlyIncome || 1;
  const fixedPct = Math.min(100, (totalFixed / inc) * 100);
  const savingsPct = Math.min(100 - fixedPct, (monthlySavings / inc) * 100);
  const freePct = Math.max(0, 100 - fixedPct - savingsPct);

  const updateFixed = useCallback((key: FixedKey, value: number) => {
    setFixedDetail((prev) => ({ ...prev, [key]: value }));
  }, []);

  function switchSavingsMode(mode: SavingsMode) {
    if (mode === savingsMode) return;
    if (mode === "yearly") {
      setSavingsMode("yearly");
      setSavingsYearly(savingsMonthly * 12);
    } else {
      setSavingsMode("monthly");
      setSavingsMonthly(Math.round(savingsYearly / 12));
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const result = await saveSettingsAction({
        totalAssets: currentBalance,
        monthlyIncome,
        paydayDay: salaryDay,
        fixedExpenses: totalFixed,
        fixedExpensesDetail: fixedDetail,
        savingsGoal: monthlySavings,
      });
      if (result.error) {
        throw new Error(result.error);
      }
      setToast(true);
      setTimeout(() => setToast(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-4 md:px-6 md:py-5">
      <motion.div variants={PAGE_VARIANTS} initial="hidden" animate="visible">
        {/* SP: ミニプレビューバー */}
        <div
          className="sticky top-0 z-10 -mx-4 border-b px-4 py-2.5 lg:hidden"
          style={{
            background: "rgba(255,253,245,0.95)",
            backdropFilter: "blur(10px)",
            borderColor: "var(--border-default)",
          }}
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <div
                className="text-[10px] font-semibold"
                style={{ color: "var(--foreground)", opacity: 0.45 }}
              >
                1日予算
              </div>
              <motion.div
                key={dailyBudget}
                className="text-lg font-extrabold tabular-nums leading-tight"
                style={{ color: budgetColor }}
                initial={{ scale: 0.95, opacity: 0.7 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={SPRING.quick}
              >
                ¥{dailyBudget.toLocaleString("ja-JP")}
              </motion.div>
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex h-1.5 gap-px overflow-hidden rounded-full">
                <motion.div
                  style={{ background: "var(--color-danger)", opacity: 0.75 }}
                  animate={{ width: `${fixedPct}%` }}
                  transition={SPRING.base}
                />
                {savingsPct > 0 && (
                  <motion.div
                    style={{ background: "var(--color-income)" }}
                    animate={{ width: `${savingsPct}%` }}
                    transition={SPRING.base}
                  />
                )}
                <div
                  className="flex-1 rounded-r-full"
                  style={{ background: "var(--color-brand-primary)", opacity: 0.85 }}
                />
              </div>
              <div className="flex justify-between text-[9px] font-semibold">
                <span style={{ color: "var(--color-danger)" }}>固定費 {fixedPct.toFixed(0)}%</span>
                {savingsPct > 0 && (
                  <span style={{ color: "var(--color-income)" }}>貯蓄 {savingsPct.toFixed(0)}%</span>
                )}
                <span style={{ color: "var(--color-brand-primary)" }}>使える {freePct.toFixed(0)}%</span>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div
                className="text-[10px] font-semibold"
                style={{ color: "var(--foreground)", opacity: 0.45 }}
              >
                使える額
              </div>
              <motion.div
                key={disposable}
                className="text-xs font-bold tabular-nums"
                style={{ color: "var(--foreground)" }}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: 1 }}
                transition={SPRING.quick}
              >
                ¥{(disposable / 10000).toFixed(1)}万
              </motion.div>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 gap-4 pt-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-5">
          {/* PC 左カラム: プレビューカード */}
          <div className="hidden lg:sticky lg:top-4 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
            <PreviewCard
              dailyBudget={dailyBudget}
              budgetColor={budgetColor}
              monthlyIncome={monthlyIncome}
              totalFixed={totalFixed}
              monthlySavings={monthlySavings}
              disposable={disposable}
              fixedPct={fixedPct}
              savingsPct={savingsPct}
              freePct={freePct}
              currentBalance={currentBalance}
              salaryDay={salaryDay}
              savingsMode={savingsMode}
              savingsYearly={savingsYearly}
            />
          </div>

          {/* 右カラム: 設定フォーム / ガイド */}
          <div className="space-y-4 lg:col-start-2 lg:row-start-1">
            {/* 設定 / ガイドのタブ切替 */}
            <div
              className="flex gap-0.5 rounded-xl p-0.5"
              style={{ background: "rgba(28,20,16,0.05)" }}
              role="tablist"
              aria-label="設定メニュー"
            >
              {(
                [
                  { key: "settings", label: "設定", icon: SettingsIcon },
                  { key: "guide", label: "ガイド", icon: BookOpen },
                ] as const
              ).map((item) => {
                const active = activeMenu === item.key;
                return (
                  <motion.button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveMenu(item.key)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-[10px] py-2 text-[12px] font-bold transition-colors"
                    style={{
                      background: active ? "var(--color-surface-default)" : "transparent",
                      color: active
                        ? "var(--color-brand-primary)"
                        : "rgba(28,20,16,0.45)",
                      boxShadow: active ? "var(--shadow-card)" : "none",
                    }}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING.snap}
                  >
                    <item.icon size={13} strokeWidth={active ? 2.3 : 2} />
                    {item.label}
                  </motion.button>
                );
              })}
            </div>

            {activeMenu === "guide" ? (
              <GuideTab />
            ) : (
              <>
            {/* 給与セクション */}
            <motion.div variants={PAGE_ITEM_VARIANTS}>
              <SectionCard title="給与">
                <div className="px-4 py-2.5">
                  <SalaryDayPicker value={salaryDay} onChange={setSalaryDay} />
                </div>
                <div
                  className="border-t px-4 pb-3.5 pt-3"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <FieldRow
                    icon={TrendingUp}
                    label="月収（手取り）"
                    value={monthlyIncome}
                    onChange={setMonthlyIncome}
                    step={10000}
                  />
                </div>
              </SectionCard>
            </motion.div>

            {/* 固定費セクション */}
            <motion.div variants={PAGE_ITEM_VARIANTS}>
              <SectionCard title="固定費">
                <div className="px-4">
                  {FIXED_COST_ITEMS.map((item, i) => (
                    <div
                      key={item.key}
                      className={i < FIXED_COST_ITEMS.length - 1 ? "border-b py-2.5" : "py-2.5"}
                      style={{ borderColor: "var(--border-default)" }}
                    >
                      <FieldRow
                        icon={item.icon}
                        label={item.label}
                        value={fixedDetail[item.key]}
                        onChange={(v) => updateFixed(item.key, v)}
                        step={item.step}
                      />
                    </div>
                  ))}
                </div>
                <div
                  className="flex items-center justify-between border-t px-4 py-2.5"
                  style={{
                    background: "var(--color-surface-subtle)",
                    borderColor: "var(--border-default)",
                  }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: "var(--foreground)", opacity: 0.45 }}
                  >
                    合計
                  </span>
                  <motion.span
                    key={totalFixed}
                    className="text-sm font-extrabold tabular-nums"
                    style={{ color: "var(--foreground)" }}
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={SPRING.quick}
                  >
                    ¥{totalFixed.toLocaleString("ja-JP")}
                  </motion.span>
                </div>
              </SectionCard>
            </motion.div>

            {/* 残高 + 貯蓄目標 */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* 残高 */}
              <motion.div variants={PAGE_ITEM_VARIANTS}>
                <SectionCard title="残高">
                  <div className="space-y-1.5 px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-md"
                        style={{ background: "var(--color-surface-subtle)" }}
                      >
                        <Wallet size={12} style={{ color: "var(--color-brand-primary)" }} />
                      </div>
                      <span
                        className="text-xs font-medium"
                        style={{ color: "var(--foreground)", opacity: 0.72 }}
                      >
                        口座残高
                      </span>
                    </div>
                    <AmountField
                      value={currentBalance}
                      onChange={setCurrentBalance}
                      step={10000}
                      label="口座残高"
                    />
                  </div>
                </SectionCard>
              </motion.div>

              {/* 貯蓄目標 */}
              <motion.div variants={PAGE_ITEM_VARIANTS}>
                <SectionCard title="貯蓄目標">
                  <div className="space-y-3 px-4 pb-6 pt-3.5">
                    <div className="mb-0.5 flex items-center gap-2">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-md"
                        style={{ background: "var(--color-surface-subtle)" }}
                      >
                        <PiggyBank size={14} style={{ color: "var(--color-brand-primary)" }} />
                      </div>
                      <div
                        className="inline-flex gap-0.5 rounded-md p-0.5"
                        style={{ background: "var(--color-surface-subtle)" }}
                        role="tablist"
                        aria-label="貯蓄目標の期間"
                      >
                        {(["monthly", "yearly"] as const).map((mode) => {
                          const active = savingsMode === mode;
                          return (
                            <motion.button
                              key={mode}
                              role="tab"
                              aria-selected={active}
                              type="button"
                              onClick={() => switchSavingsMode(mode)}
                              className="rounded-md px-3 py-1 text-xs font-bold"
                              style={{
                                background: active ? "var(--color-surface-default)" : "transparent",
                                color: active ? "var(--color-brand-primary)" : "var(--foreground)",
                                opacity: active ? 1 : 0.45,
                                boxShadow: active ? "var(--shadow-card)" : "none",
                              }}
                              whileTap={{ scale: 0.95 }}
                              transition={SPRING.snap}
                            >
                              {mode === "monthly" ? "月間" : "年間"}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    <AmountField
                      value={savingsMode === "monthly" ? savingsMonthly : savingsYearly}
                      onChange={(v) => {
                        if (savingsMode === "monthly") {
                          setSavingsMonthly(v);
                        } else {
                          setSavingsYearly(v);
                        }
                      }}
                      step={savingsMode === "monthly" ? 5000 : 60000}
                      suffix={savingsMode === "monthly" ? "/ 月" : "/ 年"}
                      label="貯蓄目標"
                    />

                    <AnimatePresence>
                      {monthlySavings > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={SPRING.quick}
                          className="text-[11px] font-semibold"
                          style={{ color: "var(--color-income)" }}
                        >
                          ≈ ¥
                          {(savingsMode === "monthly"
                            ? savingsMonthly * 12
                            : Math.round(savingsYearly / 12)
                          ).toLocaleString("ja-JP")}
                          {savingsMode === "monthly" ? " / 年" : " / 月"}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </SectionCard>
              </motion.div>
            </div>

            {/* エラー */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border px-4 py-3 text-sm font-medium"
                style={{
                  background: "var(--color-danger-light)",
                  borderColor: "var(--color-danger)",
                  color: "var(--foreground)",
                }}
              >
                {error}
              </motion.div>
            )}

            {/* 保存ボタン */}
            <motion.div variants={PAGE_ITEM_VARIANTS}>
              <motion.button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14px] font-extrabold text-white disabled:opacity-50"
                style={{
                  background: "var(--color-brand-primary)",
                  boxShadow: "0 4px 12px rgba(241,136,64,0.3)",
                }}
                whileTap={{ scale: 0.97 }}
                transition={SPRING.snap}
              >
                {saving ? "保存中..." : "設定を保存する"}
              </motion.button>
            </motion.div>

            {/* データエクスポート */}
            <motion.div variants={PAGE_ITEM_VARIANTS}>
              <DataExportSection />
            </motion.div>

            {/* マイページリンク */}
            <motion.div variants={PAGE_ITEM_VARIANTS}>
              <Link
                href="/my-page"
                className="flex w-full items-center gap-3 rounded-2xl border px-5 py-4 transition-colors"
                style={{
                  background: "var(--color-surface-default)",
                  borderColor: "var(--border-default)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <User size={16} style={{ color: "var(--color-brand-primary)" }} />
                <span
                  className="flex-1 text-[13px] font-bold"
                  style={{ color: "var(--foreground)" }}
                >
                  マイページ
                </span>
                <ChevronRight size={14} style={{ color: "var(--foreground)", opacity: 0.3 }} />
              </Link>
            </motion.div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* トースト */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="fixed bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full px-5 py-3 text-sm font-bold text-white"
            style={{
              background: "var(--color-income)",
              boxShadow: "0 8px 24px rgba(76,175,80,0.5)",
            }}
            initial={{ opacity: 0, y: 20, scale: 0.88 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={SPRING.snap}
          >
            <Check size={16} />
            設定を保存しました
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// ─── FieldRow ────────────────────────────────────────────────────────────────

function FieldRow({
  icon: Icon,
  label,
  value,
  onChange,
  step,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div className="flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3">
      <div className="flex items-center gap-1.5 md:w-32 md:shrink-0">
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: "var(--color-surface-subtle)" }}
        >
          <Icon size={12} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <span
          className="text-xs font-medium"
          style={{ color: "var(--foreground)", opacity: 0.72 }}
        >
          {label}
        </span>
      </div>
      <div className="flex-1">
        <AmountField value={value} onChange={onChange} step={step} label={label} />
      </div>
    </div>
  );
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

// GuideTab（ガイドタブ）からも同じカードシェルを使うため export する
export function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 px-0.5">
        <span
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: "var(--foreground)", opacity: 0.45 }}
        >
          {title}
        </span>
      </div>
      <div
        className="overflow-visible rounded-2xl border"
        style={{
          background: "var(--color-surface-default)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// ─── PreviewCard ─────────────────────────────────────────────────────────────

function PreviewCard({
  dailyBudget,
  budgetColor,
  monthlyIncome,
  totalFixed,
  monthlySavings,
  disposable,
  fixedPct,
  savingsPct,
  freePct,
  currentBalance,
  salaryDay,
  savingsMode,
  savingsYearly,
}: {
  dailyBudget: number;
  budgetColor: string;
  monthlyIncome: number;
  totalFixed: number;
  monthlySavings: number;
  disposable: number;
  fixedPct: number;
  savingsPct: number;
  freePct: number;
  currentBalance: number;
  salaryDay: number;
  savingsMode: SavingsMode;
  savingsYearly: number;
}) {
  function getSavingsLabel(): string {
    if (monthlySavings <= 0) return "未設定";
    if (savingsMode === "monthly") {
      return `¥${(monthlySavings / 10000).toFixed(1)}万/月`;
    }
    return `¥${(savingsYearly / 10000).toFixed(0)}万/年`;
  }

  const breakdownRows = [
    { label: "月収", value: monthlyIncome, color: "var(--foreground)", bold: false, hide: false },
    { label: "固定費", value: -totalFixed, color: "var(--color-danger)", bold: false, hide: false },
    { label: "貯蓄目標", value: -monthlySavings, color: "var(--color-income)", bold: false, hide: monthlySavings === 0 },
    { label: "使える額", value: disposable, color: budgetColor, bold: true, hide: false },
  ];

  const summaryChips = [
    { label: "残高", value: `¥${(currentBalance / 10000).toFixed(0)}万` },
    { label: "給料日", value: `毎月${salaryDay}日` },
    { label: "固定費", value: `¥${(totalFixed / 10000).toFixed(1)}万` },
    { label: "貯蓄目標", value: getSavingsLabel() },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING.smooth, delay: 0.04 }}
    >
      <div
        className="relative overflow-hidden rounded-2xl p-5"
        style={{
          background: "var(--color-surface-default)",
          border: "1px solid var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* グロー */}
        <motion.div
          className="pointer-events-none absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            top: -80,
            right: -70,
            background: `radial-gradient(circle, ${budgetColor}1f 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="relative">
          {/* ヒーロー数字 */}
          <motion.div
            key={dailyBudget}
            className="text-[52px] font-extrabold tabular-nums leading-none"
            style={{ color: budgetColor, letterSpacing: "-0.02em" }}
            initial={{ scale: 0.96, opacity: 0.7 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={SPRING.quick}
          >
            ¥{dailyBudget.toLocaleString("ja-JP")}
          </motion.div>
          <div
            className="mb-4 mt-1 text-[10px]"
            style={{ color: "var(--foreground)", opacity: 0.45 }}
          >
            / 日
          </div>

          {/* 配分バー */}
          <div className="mb-4">
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
              <motion.div
                style={{ background: "var(--color-danger)", opacity: 0.7 }}
                animate={{ width: `${fixedPct}%` }}
                transition={SPRING.base}
              />
              <motion.div
                style={{ background: "var(--color-income)", opacity: 0.85 }}
                animate={{ width: `${savingsPct}%` }}
                transition={SPRING.base}
              />
              <div
                className="flex-1 rounded-r-full"
                style={{ background: "var(--color-brand-primary)", opacity: 0.85 }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[9px] font-semibold">
              <span style={{ color: "var(--color-danger)" }}>固定費 {fixedPct.toFixed(0)}%</span>
              {monthlySavings > 0 && (
                <span style={{ color: "var(--color-income)" }}>貯蓄 {savingsPct.toFixed(0)}%</span>
              )}
              <span style={{ color: "var(--color-brand-primary)" }}>使える {freePct.toFixed(0)}%</span>
            </div>
          </div>

          {/* 内訳 */}
          <div
            className="mb-4 space-y-1.5 rounded-md p-3 text-[11px]"
            style={{ background: "var(--color-surface-subtle)" }}
          >
            {breakdownRows
              .filter((r) => !r.hide)
              .map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between ${row.bold ? "border-t pt-1.5" : ""}`}
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <span style={{ color: "var(--foreground)", opacity: 0.45, fontWeight: row.bold ? 700 : 500 }}>
                    {row.label}
                  </span>
                  <motion.span
                    key={row.value}
                    className="font-bold tabular-nums"
                    style={{ color: row.color }}
                    initial={{ opacity: 0.6, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={SPRING.quick}
                  >
                    {row.value >= 0 ? "" : "−"}¥{Math.abs(row.value).toLocaleString("ja-JP")}
                  </motion.span>
                </div>
              ))}
          </div>

          {/* サマリーチップ */}
          <div className="grid grid-cols-2 gap-1.5">
            {summaryChips.map((chip, i) => (
              <motion.div
                key={chip.label}
                className="rounded-md p-2"
                style={{ background: "var(--color-surface-subtle)" }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...SPRING.base, delay: 0.1 + i * 0.04 }}
              >
                <div
                  className="mb-0.5 text-[9px] font-semibold"
                  style={{ color: "var(--foreground)", opacity: 0.35 }}
                >
                  {chip.label}
                </div>
                <div className="text-xs font-extrabold" style={{ color: "var(--foreground)" }}>
                  {chip.value}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
