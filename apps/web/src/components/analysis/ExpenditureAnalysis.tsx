"use client";

import Link from "next/link";
import type { AnalysisData } from "@/lib/api/xday";

interface Props {
    data: AnalysisData;
}

/** 偏差値に対応するオレンジグラデーション幅（%）と色 */
function deviationBar(deviation: number): { width: number; color: string } {
    // 偏差値 50 = 標準。50 を中心に ±30 をバー長にマッピング
    const clamped = Math.max(20, Math.min(80, deviation));
    const width = Math.round(((clamped - 20) / 60) * 100);
    if (deviation >= 70) return { width, color: "var(--color-brand-secondary)" };
    if (deviation >= 60) return { width, color: "var(--color-brand-primary)" };
    if (deviation >= 40) return { width, color: "var(--color-income)" };
    return { width, color: "var(--color-income)" };
}

/** カテゴリの偏差値・寿命影響を表示する行 */
function CategoryRow({ c }: { c: AnalysisData["categories"][number] }) {
    const bar = deviationBar(c.deviation);
    return (
        <div className="border-b border-orange-50 py-3 last:border-0">
            <div className="mb-1.5 flex items-center justify-between">
                <span className="text-sm font-medium text-zinc-700">{c.label}</span>
                <span className="text-sm tabular-nums text-zinc-700">
                    ¥{c.monthlyAmount.toLocaleString()}
                </span>
            </div>
            {/* オレンジグラデーションバー */}
            <div className="mb-1 h-2 overflow-hidden rounded-full bg-orange-50">
                <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${bar.width}%`, backgroundColor: bar.color }}
                />
            </div>
            <div className="flex items-center justify-between text-xs">
                <span
                    className="font-semibold"
                    style={{ color: bar.color }}
                >
                    偏差値 {c.deviation}
                    {c.level === "surplus" && " — 良好"}
                    {c.level === "normal" && " — 標準"}
                    {c.level === "caution" && " — やや高め"}
                    {c.level === "danger" && " — 見直しで効果大"}
                </span>
                {c.xDayImpactDays > 5 && (
                    <span className="text-zinc-400">
                        調整で +{c.xDayImpactDays}日 延びます
                    </span>
                )}
            </div>
        </div>
    );
}

/** 支出分析UI — 「賢い比較」で寿命を延ばすヒントを提示 */
export function ExpenditureAnalysis({ data }: Props) {
    const { month, categories, totalDeviation, totalMonthlyAmount } = data;

    // 改善効果が大きいカテゴリ（上位3件）
    const topImpact = [...categories]
        .filter(c => c.xDayImpactDays > 5)
        .sort((a, b) => b.xDayImpactDays - a.xDayImpactDays)
        .slice(0, 3);

    const totalImpactDays = topImpact.reduce((s, c) => s + c.xDayImpactDays, 0);

    return (
        <div className="min-h-screen bg-[var(--background)] px-4 py-8">
            <div className="mx-auto max-w-md">
                {/* ヘッダー */}
                <p className="mb-1 text-xs font-medium text-zinc-400">支出分析 / {month}</p>
                <h1 className="mb-6 text-xl font-bold text-zinc-800">
                    家計の寿命を延ばすヒント
                </h1>

                {/* サマリーカード */}
                <div className="mb-6 rounded-[var(--radius-card)] border border-orange-100 bg-[var(--color-surface-subtle)] p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs text-zinc-400">今月の総支出</p>
                            <p className="text-2xl font-bold tabular-nums text-zinc-800">
                                ¥{totalMonthlyAmount.toLocaleString()}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-zinc-400">支出偏差値</p>
                            <p
                                className="text-2xl font-bold tabular-nums"
                                style={{
                                    color: (() => {
                                        if (totalDeviation >= 70) return "var(--color-brand-secondary)";
                                        if (totalDeviation >= 60) return "var(--color-brand-primary)";
                                        return "var(--color-income)";
                                    })(),
                                }}
                            >
                                {totalDeviation}
                            </p>
                        </div>
                    </div>

                    {/* 全体バー */}
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-orange-50">
                        <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                                width: `${deviationBar(totalDeviation).width}%`,
                                backgroundColor: deviationBar(totalDeviation).color,
                            }}
                        />
                    </div>
                    <p className="mt-2 text-xs text-zinc-400">
                        偏差値 50 = 同属性の平均水準
                    </p>
                </div>

                {/* カテゴリ別分析 */}
                <div className="mb-6 rounded-[var(--radius-card)] border border-orange-100 bg-white p-5 shadow-sm">
                    <h2 className="mb-4 text-sm font-semibold text-zinc-700">カテゴリ別の立ち位置</h2>
                    {categories.map(c => (
                        <CategoryRow key={c.category} c={c} />
                    ))}
                </div>

                {/* 提案カード */}
                {topImpact.length > 0 && (
                    <div
                        className="mb-6 rounded-[var(--radius-card)] border p-5 shadow-sm"
                        style={{
                            borderColor: "var(--color-expense-light)",
                            backgroundColor: "var(--color-expense-light)",
                        }}
                    >
                        <h2 className="mb-3 text-sm font-semibold" style={{ color: "var(--color-brand-secondary)" }}>
                            ここを調整すると効果的です
                        </h2>
                        <div className="space-y-2">
                            {topImpact.map(c => (
                                <div key={c.category} className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-700">{c.label} を平均水準に</span>
                                    <span className="font-semibold" style={{ color: "var(--color-brand-primary)" }}>
                                        +{c.xDayImpactDays}日
                                    </span>
                                </div>
                            ))}
                        </div>
                        {totalImpactDays > 0 && (
                            <div className="mt-3 border-t border-orange-200 pt-3">
                                <p className="text-sm font-bold" style={{ color: "var(--color-brand-primary)" }}>
                                    合計で +{totalImpactDays}日 延ばせます
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* 判定コメント */}
                <div className="mb-6 rounded-[var(--radius-card)] border border-orange-100 bg-white p-5 shadow-sm">
                    <h2 className="mb-2 text-sm font-semibold text-zinc-700">総合判定</h2>
                    {totalDeviation < 40 && (
                        <p className="text-sm text-zinc-700" style={{ color: "var(--color-income)" }}>
                            支出水準は平均を下回っています。この調子を維持することで家計の寿命を着実に延ばせます。
                        </p>
                    )}
                    {totalDeviation >= 40 && totalDeviation < 60 && (
                        <p className="text-sm text-zinc-700">
                            支出水準は標準的です。上のカテゴリを少し調整するだけで、より長い自由な期間を手に入れられます。
                        </p>
                    )}
                    {totalDeviation >= 60 && totalDeviation < 70 && (
                        <p className="text-sm text-zinc-700">
                            支出が平均よりやや高い傾向にあります。
                            {topImpact[0] && `特に「${topImpact[0].label}」を見直すと効果的です。`}
                        </p>
                    )}
                    {totalDeviation >= 70 && (
                        <p className="text-sm text-zinc-700">
                            支出が高水準です。上記のカテゴリを調整することで、家計の寿命を合計
                            <strong className="mx-1" style={{ color: "var(--color-brand-primary)" }}>
                                +{totalImpactDays}日
                            </strong>
                            延ばすことができます。
                        </p>
                    )}
                </div>

                <Link
                    href="/"
                    className="inline-block text-sm text-zinc-400 underline underline-offset-2 hover:text-zinc-600"
                >
                    ← ダッシュボードに戻る
                </Link>
            </div>
        </div>
    );
}
