"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronLeft, Check, Calendar, Banknote, Receipt, Wallet } from "lucide-react";
import { calcDailyBudget } from "@budget/common";
import { SPRING } from "@/lib/motion";
import { saveUserSettingsAction } from "@/lib/actions/settings";

type FormData = {
  paydayDay: number;
  monthlyIncome: number;
  fixedExpenses: number;
  totalAssets: number;
};

const INITIAL_DATA: FormData = {
  paydayDay: 25,
  monthlyIncome: 0,
  fixedExpenses: 0,
  totalAssets: 0,
};

const STEP_COUNT = 4;

function formatAmount(amount: number): string {
  return `¥${amount.toLocaleString("ja-JP")}`;
}

/** 金額入力の文字列を数値に変換する（先頭ゼロ除去・非数値除去） */
function parseAmountInput(raw: string): number {
  const cleaned = raw.replace(/[^0-9]/g, "").replace(/^0+/, "");
  return cleaned === "" ? 0 : Number(cleaned);
}

const STEP_TRANSITION = { ...SPRING.quick };

export function InitialSetupWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL_DATA);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const budget = calcDailyBudget({
    totalAssets: data.totalAssets,
    fixedExpenses: data.fixedExpenses,
    paydayDay: data.paydayDay,
    today: new Date(),
  });

  function goNext() {
    setStep((s) => s + 1);
  }

  function goBack() {
    setStep((s) => s - 1);
  }

  async function handleSubmit() {
    setIsPending(true);
    setError(null);
    const result = await saveUserSettingsAction(data);
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* ロゴ・ヘッダー */}
      <motion.div
        className="mb-8 text-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.smooth}
      >
        <div
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-extrabold text-white"
          style={{
            background: "var(--color-brand-primary)",
            boxShadow: "0 4px 12px rgba(241,136,64,0.3)",
          }}
        >
          家
        </div>
        <h1
          className="text-xl font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          はじめましょう
        </h1>
        <p
          className="mt-1 text-sm"
          style={{ color: "var(--foreground)", opacity: 0.5 }}
        >
          3つの数字で、あなたの1日予算がわかります
        </p>
      </motion.div>

      {/* ステップインジケーター */}
      <div className="mb-6 flex justify-center gap-1.5">
        {Array.from({ length: STEP_COUNT - 1 }).map((_, i) => (
          <motion.div
            key={i}
            className="h-1.5 w-8 rounded-full"
            style={{
              background: i <= step
                ? "var(--color-brand-primary)"
                : "var(--border-default)",
            }}
            animate={{
              background: i <= step
                ? "var(--color-brand-primary)"
                : "var(--border-default)",
            }}
            transition={SPRING.quick}
          />
        ))}
      </div>

      {/* ステップコンテンツ */}
      <AnimatePresence>
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={STEP_TRANSITION}
          className="overflow-hidden rounded-2xl border p-6"
          style={{
            background: "var(--color-surface-default)",
            borderColor: "var(--border-default)",
            boxShadow: "var(--shadow-card)",
          }}
          data-testid="step-container"
        >
          {step === 0 && (
            <PaydayStep
              paydayDay={data.paydayDay}
              monthlyIncome={data.monthlyIncome}
              onChange={(partial) => setData((d) => ({ ...d, ...partial }))}
              onNext={goNext}
            />
          )}
          {step === 1 && (
            <FixedExpensesStep
              fixedExpenses={data.fixedExpenses}
              onChange={(v) => setData((d) => ({ ...d, fixedExpenses: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <TotalAssetsStep
              totalAssets={data.totalAssets}
              onChange={(v) => setData((d) => ({ ...d, totalAssets: v }))}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <SummaryStep
              data={data}
              dailyBudget={budget.dailyBudget}
              daysUntilPayday={budget.daysUntilPayday}
              onBack={goBack}
              onSubmit={handleSubmit}
              isPending={isPending}
              error={error}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* スキップ導線 */}
      {step < 3 && (
        <button
          type="button"
          onClick={handleSubmit}
          className="mt-4 w-full text-center text-xs underline underline-offset-2"
          style={{ color: "var(--foreground)", opacity: 0.4 }}
          disabled={isPending}
        >
          あとで設定する
        </button>
      )}
    </div>
  );
}

// --- 各ステップコンポーネント ---

type PaydayStepProps = {
  paydayDay: number;
  monthlyIncome: number;
  onChange: (partial: Partial<Pick<FormData, "paydayDay" | "monthlyIncome">>) => void;
  onNext: () => void;
};

function PaydayStep({ paydayDay, monthlyIncome, onChange, onNext }: PaydayStepProps) {
  const isValid = paydayDay >= 1 && paydayDay <= 31 && monthlyIncome >= 0;
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Calendar size={20} style={{ color: "var(--color-brand-primary)" }} />
        <h2 className="font-extrabold" style={{ color: "var(--foreground)" }}>
          給料日と月収を教えてください
        </h2>
      </div>
      <div className="space-y-4">
        <div>
          <label
            className="mb-1 block text-xs font-bold"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
          >
            給料日（毎月何日？）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={paydayDay || ""}
              onChange={(e) => {
                const v = parseAmountInput(e.target.value);
                if (v <= 31) onChange({ paydayDay: v });
              }}
              className="input-field w-24 text-center text-lg font-bold"
              placeholder="25"
              aria-label="給料日"
            />
            <span
              className="text-sm font-bold"
              style={{ color: "var(--foreground)", opacity: 0.6 }}
            >
              日
            </span>
          </div>
        </div>
        <div>
          <label
            className="mb-1 block text-xs font-bold"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
          >
            月収（手取り）
          </label>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: "var(--foreground)", opacity: 0.6 }}
            >
              ¥
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={monthlyIncome || ""}
              onChange={(e) => onChange({ monthlyIncome: parseAmountInput(e.target.value) })}
              className="input-field flex-1 font-bold"
              placeholder="0"
              aria-label="月収"
            />
          </div>
        </div>
      </div>
      <motion.button
        type="button"
        onClick={onNext}
        disabled={!isValid}
        className="btn-candy w-full"
        whileTap={{ scale: 0.97 }}
        transition={SPRING.snap}
      >
        <span>次へ</span>
        <ChevronRight size={18} />
      </motion.button>
    </div>
  );
}

type FixedExpensesStepProps = {
  fixedExpenses: number;
  onChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
};

function FixedExpensesStep({ fixedExpenses, onChange, onNext, onBack }: FixedExpensesStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Receipt size={20} style={{ color: "var(--color-brand-primary)" }} />
        <h2 className="font-extrabold" style={{ color: "var(--foreground)" }}>
          月の固定費を教えてください
        </h2>
      </div>
      <p
        className="text-xs"
        style={{ color: "var(--foreground)", opacity: 0.5 }}
      >
        家賃・光熱費・サブスクなど、毎月必ず出ていく金額の合計です。
      </p>
      <div>
        <label
          className="mb-1 block text-xs font-bold"
          style={{ color: "var(--foreground)", opacity: 0.6 }}
        >
          固定費（月額合計）
        </label>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
          >
            ¥
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={fixedExpenses || ""}
            onChange={(e) => onChange(parseAmountInput(e.target.value))}
            className="input-field flex-1 font-bold"
            placeholder="0"
            aria-label="固定費"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          className="btn-ghost"
          whileTap={{ scale: 0.95 }}
          transition={SPRING.snap}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <motion.button
          type="button"
          onClick={onNext}
          className="btn-candy flex-1"
          whileTap={{ scale: 0.97 }}
          transition={SPRING.snap}
        >
          <span>次へ</span>
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}

type TotalAssetsStepProps = {
  totalAssets: number;
  onChange: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
};

function TotalAssetsStep({ totalAssets, onChange, onNext, onBack }: TotalAssetsStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Wallet size={20} style={{ color: "var(--color-brand-primary)" }} />
        <h2 className="font-extrabold" style={{ color: "var(--foreground)" }}>
          今の残高を教えてください
        </h2>
      </div>
      <p
        className="text-xs"
        style={{ color: "var(--foreground)", opacity: 0.5 }}
      >
        銀行口座・財布の合計で大丈夫です。だいたいの金額で問題ありません。
      </p>
      <div>
        <label
          className="mb-1 block text-xs font-bold"
          style={{ color: "var(--foreground)", opacity: 0.6 }}
        >
          現在の残高
        </label>
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold"
            style={{ color: "var(--foreground)", opacity: 0.6 }}
          >
            ¥
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={totalAssets || ""}
            onChange={(e) => onChange(parseAmountInput(e.target.value))}
            className="input-field flex-1 font-bold"
            placeholder="0"
            aria-label="現在の残高"
          />
        </div>
      </div>
      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          className="btn-ghost"
          whileTap={{ scale: 0.95 }}
          transition={SPRING.snap}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <motion.button
          type="button"
          onClick={onNext}
          className="btn-candy flex-1"
          whileTap={{ scale: 0.97 }}
          transition={SPRING.snap}
        >
          <span>計算する</span>
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}

type SummaryStepProps = {
  data: FormData;
  dailyBudget: number;
  daysUntilPayday: number;
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
  error: string | null;
};

function SummaryStep({
  data,
  dailyBudget,
  daysUntilPayday,
  onBack,
  onSubmit,
  isPending,
  error,
}: SummaryStepProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Banknote size={20} style={{ color: "var(--color-brand-primary)" }} />
        <h2 className="font-extrabold" style={{ color: "var(--foreground)" }}>
          あなたの1日予算
        </h2>
      </div>

      {/* 1日予算ハイライト */}
      <motion.div
        className="overflow-hidden rounded-xl border py-5 text-center"
        style={{
          background: "var(--color-surface-subtle)",
          borderColor: "var(--border-default)",
          boxShadow: "var(--shadow-card)",
        }}
        initial={{ scale: 0.95, opacity: 0.7 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={SPRING.quick}
      >
        <p
          className="mb-1 text-xs font-bold"
          style={{ color: "var(--foreground)", opacity: 0.5 }}
        >
          今日から給料日まで、1日に使えるお金
        </p>
        <p
          className="text-3xl font-extrabold"
          style={{ color: "var(--foreground)" }}
          aria-label="1日予算"
        >
          {formatAmount(dailyBudget)}
        </p>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--foreground)", opacity: 0.4 }}
        >
          給料日まで あと {daysUntilPayday} 日
        </p>
      </motion.div>

      {/* 入力値サマリー */}
      <ul className="space-y-2 text-sm">
        {[
          { label: "給料日", value: `毎月 ${data.paydayDay} 日` },
          { label: "月収", value: formatAmount(data.monthlyIncome) },
          { label: "固定費", value: formatAmount(data.fixedExpenses) },
          { label: "現在の残高", value: formatAmount(data.totalAssets) },
        ].map((row) => (
          <li key={row.label} className="flex justify-between">
            <span style={{ color: "var(--foreground)", opacity: 0.6 }}>{row.label}</span>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>
              {row.value}
            </span>
          </li>
        ))}
      </ul>

      {error && (
        <p
          className="rounded-xl border px-3 py-2 text-sm font-medium"
          style={{
            background: "var(--color-danger-light)",
            borderColor: "var(--color-danger)",
            color: "var(--foreground)",
          }}
        >
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          className="btn-ghost"
          disabled={isPending}
          whileTap={{ scale: 0.95 }}
          transition={SPRING.snap}
        >
          <ChevronLeft size={18} />
        </motion.button>
        <motion.button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="btn-candy flex-1"
          whileTap={{ scale: 0.97 }}
          transition={SPRING.snap}
        >
          <Check size={18} />
          <span>{isPending ? "保存中..." : "はじめる"}</span>
        </motion.button>
      </div>
    </div>
  );
}
