"use client";

import { useState } from "react";
import { ChevronRight, ChevronLeft, Check, Calendar, Banknote, Receipt, Wallet } from "lucide-react";
import { calcDailyBudget } from "@budget/common";
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

const STEP_COUNT = 4; // 給料日/月収, 固定費, 現在残高, 完了サマリー

/** 金額を「¥XXX,XXX」形式にフォーマット */
function formatAmount(amount: number): string {
    return `¥${amount.toLocaleString("ja-JP")}`;
}

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
        // 成功時は redirect() により画面が切り替わる
    }

    return (
        <div className="w-full max-w-sm">
            {/* ロゴ・ヘッダー */}
            <div className="mb-8 text-center">
                <div
                    className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-[#1c1410] text-white text-lg font-extrabold mb-4"
                    style={{ background: "var(--color-brand-primary)", boxShadow: "var(--shadow-pop-sm)" }}
                >
                    家
                </div>
                <h1 className="text-xl font-extrabold text-[#1c1410]">はじめましょう</h1>
                <p className="mt-1 text-sm text-[#1c1410]/50">3つの数字で、あなたの1日予算がわかります</p>
            </div>

            {/* ステップインジケーター */}
            <div className="mb-6 flex gap-1.5 justify-center">
                {Array.from({ length: STEP_COUNT - 1 }).map((_, i) => (
                    <div
                        key={i}
                        className="h-1.5 w-8 rounded-full transition-colors duration-300"
                        style={{ background: i <= step ? "var(--color-brand-primary)" : "#e5e7eb" }}
                    />
                ))}
            </div>

            {/* ステップコンテンツ */}
            <div
                key={step}
                style={{ animation: "slideIn 0.25s ease" }}
                className="rounded-2xl border-2 border-[#1c1410] bg-white p-6"
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
            </div>

            {/* スキップ導線 */}
            {step < 3 && (
                <button
                    type="button"
                    onClick={handleSubmit}
                    className="mt-4 w-full text-center text-xs text-[#1c1410]/40 underline underline-offset-2"
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
                <h2 className="font-extrabold text-[#1c1410]">給料日と月収を教えてください</h2>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-[#1c1410]/60 block mb-1">給料日（毎月何日？）</label>
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            min={1}
                            max={31}
                            value={paydayDay}
                            onChange={(e) => onChange({ paydayDay: Number(e.target.value) })}
                            className="input-field w-24 text-center font-bold text-lg"
                            aria-label="給料日"
                        />
                        <span className="text-sm font-bold text-[#1c1410]/60">日</span>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-[#1c1410]/60 block mb-1">月収（手取り）</label>
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#1c1410]/60">¥</span>
                        <input
                            type="number"
                            min={0}
                            step={1000}
                            value={monthlyIncome}
                            onChange={(e) => onChange({ monthlyIncome: Number(e.target.value) })}
                            className="input-field flex-1 font-bold"
                            aria-label="月収"
                        />
                    </div>
                </div>
            </div>
            <button type="button" onClick={onNext} disabled={!isValid} className="btn-candy w-full">
                <span>次へ</span>
                <ChevronRight size={18} />
            </button>
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
                <h2 className="font-extrabold text-[#1c1410]">月の固定費を教えてください</h2>
            </div>
            <p className="text-xs text-[#1c1410]/50">家賃・光熱費・サブスクなど、毎月必ず出ていく金額の合計です。</p>
            <div>
                <label className="text-xs font-bold text-[#1c1410]/60 block mb-1">固定費（月額合計）</label>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1c1410]/60">¥</span>
                    <input
                        type="number"
                        min={0}
                        step={1000}
                        value={fixedExpenses}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="input-field flex-1 font-bold"
                        aria-label="固定費"
                    />
                </div>
            </div>
            <div className="flex gap-3">
                <button type="button" onClick={onBack} className="btn-ghost">
                    <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={onNext} className="btn-candy flex-1">
                    <span>次へ</span>
                    <ChevronRight size={18} />
                </button>
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
                <h2 className="font-extrabold text-[#1c1410]">今の残高を教えてください</h2>
            </div>
            <p className="text-xs text-[#1c1410]/50">銀行口座・財布の合計で大丈夫です。だいたいの金額で問題ありません。</p>
            <div>
                <label className="text-xs font-bold text-[#1c1410]/60 block mb-1">現在の残高</label>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1c1410]/60">¥</span>
                    <input
                        type="number"
                        min={0}
                        step={1000}
                        value={totalAssets}
                        onChange={(e) => onChange(Number(e.target.value))}
                        className="input-field flex-1 font-bold"
                        aria-label="現在の残高"
                    />
                </div>
            </div>
            <div className="flex gap-3">
                <button type="button" onClick={onBack} className="btn-ghost">
                    <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={onNext} className="btn-candy flex-1">
                    <span>計算する</span>
                    <ChevronRight size={18} />
                </button>
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

function SummaryStep({ data, dailyBudget, daysUntilPayday, onBack, onSubmit, isPending, error }: SummaryStepProps) {
    return (
        <div className="space-y-5">
            <div className="flex items-center gap-2">
                <Banknote size={20} style={{ color: "var(--color-brand-primary)" }} />
                <h2 className="font-extrabold text-[#1c1410]">あなたの1日予算</h2>
            </div>

            {/* 1日予算ハイライト */}
            <div
                className="rounded-xl border-2 border-[#1c1410] py-5 text-center"
                style={{ background: "var(--color-surface-subtle)", boxShadow: "var(--shadow-pop-sm)" }}
            >
                <p className="text-xs font-bold text-[#1c1410]/50 mb-1">今日から給料日まで、1日に使えるお金</p>
                <p className="text-3xl font-extrabold text-[#1c1410]" aria-label="1日予算">
                    {formatAmount(dailyBudget)}
                </p>
                <p className="text-xs text-[#1c1410]/40 mt-1">給料日まで あと {daysUntilPayday} 日</p>
            </div>

            {/* 入力値サマリー */}
            <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                    <span className="text-[#1c1410]/60">給料日</span>
                    <span className="font-bold text-[#1c1410]">毎月 {data.paydayDay} 日</span>
                </li>
                <li className="flex justify-between">
                    <span className="text-[#1c1410]/60">月収</span>
                    <span className="font-bold text-[#1c1410]">{formatAmount(data.monthlyIncome)}</span>
                </li>
                <li className="flex justify-between">
                    <span className="text-[#1c1410]/60">固定費</span>
                    <span className="font-bold text-[#1c1410]">{formatAmount(data.fixedExpenses)}</span>
                </li>
                <li className="flex justify-between">
                    <span className="text-[#1c1410]/60">現在の残高</span>
                    <span className="font-bold text-[#1c1410]">{formatAmount(data.totalAssets)}</span>
                </li>
            </ul>

            {error && (
                <p className="rounded-xl border border-[#f87171]/40 bg-[#fee2e2] px-3 py-2 text-sm font-medium text-[#1c1410]">
                    {error}
                </p>
            )}

            <div className="flex gap-3">
                <button type="button" onClick={onBack} className="btn-ghost" disabled={isPending}>
                    <ChevronLeft size={18} />
                </button>
                <button type="button" onClick={onSubmit} disabled={isPending} className="btn-candy flex-1">
                    <Check size={18} />
                    <span>{isPending ? "保存中..." : "はじめる"}</span>
                </button>
            </div>
        </div>
    );
}
