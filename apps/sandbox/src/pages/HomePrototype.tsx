/**
 * HomePrototype — ホーム画面
 *
 * 主要機能:
 *   1. DailyBudget カードをタップ（モバイル限定）で「詳細カード」に展開
 *      lg 以上では常時詳細表示。ペース・ストリークを折りたたみ
 *   2. モバイルのカード表示順を明示的に設計（DOM順 = 表示順）
 *      ① 今日使えるお金 → ② 今月のサマリー → ③ クイック入力 → ④ 最近の記録
 *      デスクトップ: 左=[①②] 右=[③④]
 *   3. 資産見通し: ポジティブ「今のペースで貯蓄できる期間 → あとNヶ月」
 *   4. クイック入力カテゴリ: よく使う4件を固定表示、残りは「もっと見る」で折りたたむ
 *   5. 初回設定完了後の空状態を明示的にデザイン
 *      （オンボーディングとは別機能。デモトグルで確認可能）
 *   6. ベルアイコンのバッジ通知をタップ展開パネルに統合
 *
 * Animation philosophy:
 *   SNAP(600) / QUICK(400) / BASE(300) / SMOOTH(200) / BAR(70)
 *   すべて spring。staggerChildren ウォーターフォール。useReducedMotion 尊重。
 */

import { useState, useMemo, useRef, useEffect, type ReactNode } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { HomeTour } from "../components/HomeTour";
import { Link } from "react-router-dom";
import {
    animate,
    motion,
    AnimatePresence,
    useMotionValue,
    useSpring,
    useReducedMotion,
    type PanInfo,
} from "framer-motion";

const MotionLink = motion(Link);
import { Drawer } from "vaul";
import {
    Home, BarChart2, Settings,
    Bell, BellOff, Plus, Check, Receipt,
    Wallet,
    ChevronLeft, ChevronRight, ChevronDown, Delete,
    TrendingDown, TrendingUp, AlertTriangle, AlertCircle, CheckCircle2, HelpCircle, MinusCircle, X,
    ArrowUpRight, ArrowDownRight, Sparkles,
    PenLine,
} from "lucide-react";
import {
    EXPENSE_CATEGORIES as EXPENSE_TOKEN_LIST,
    INCOME_CATEGORIES  as INCOME_TOKEN_LIST,
    getExpenseCategoryToken,
    getIncomeCategoryToken,
} from '../tokens/categoryTokens'

// ─── デザイントークン ─────────────────────────────────────────────────────

const R = {
    card:  "16px",
    inner: "10px",
    badge: "9999px",
    input: "12px",
} as const;

const C = {
    bg:            "#fffdf5",
    card:          "#ffffff",
    text:          "#1c1410",
    muted:         "rgba(28,20,16,0.42)",
    border:        "rgba(28,20,16,0.08)",
    borderStrong:  "rgba(28,20,16,0.14)",
    shadow:        "0 1px 3px rgba(28,20,16,0.06), 0 0 0 1px rgba(28,20,16,0.06)",
    shadowMd:      "0 4px 16px rgba(28,20,16,0.09), 0 0 0 1px rgba(28,20,16,0.06)",
    brand:         "#f18840",
    brandDeep:     "#e8622a",
    brandLight:    "#fff6ee",
    income:        "#35b5a2",
    incomeDeep:    "#22a090",
    incomeLight:   "#ecfaf8",
    safe:    { bg: "#f8faf8", border: "rgba(196,181,165,0.5)",  hero: "#6b5b52", badge: "#c4b5a5", label: "余裕",  glow: "rgba(107,91,82,0.12)"  },
    caution: { bg: "#fef4f4", border: "rgba(248,113,113,0.35)", hero: "#b91c1c", badge: "#f87171", label: "注意",  glow: "rgba(248,113,113,0.16)" },
    danger:  { bg: "#fff1f2", border: "rgba(244,63,94,0.35)",   hero: "#9f1239", badge: "#f43f5e", label: "ピンチ", glow: "rgba(244,63,94,0.18)"  },
} as const;

// ─── Spring プリセット ──────────────────────────────────────────────────────

const SPRING = {
    snap:   { type: "spring", stiffness: 600, damping: 35 } as const,
    quick:  { type: "spring", stiffness: 400, damping: 30 } as const,
    base:   { type: "spring", stiffness: 300, damping: 28 } as const,
    smooth: { type: "spring", stiffness: 200, damping: 26 } as const,
    bar:    { type: "spring", stiffness: 70,  damping: 18 } as const,
} as const;

// ─── Animation Variants ────────────────────────────────────────────────────

const PAGE = {
    container: {
        hidden:  {},
        visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
    },
    item: {
        hidden:  { opacity: 0, y: 22, filter: "blur(8px)" },
        visible: { opacity: 1, y: 0,  filter: "blur(0px)", transition: SPRING.smooth },
    },
};


const DRAWER_ANIM = {
    container: {
        hidden:  {},
        visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
    },
    item: {
        hidden:  { opacity: 0, y: 14 },
        visible: { opacity: 1, y: 0, transition: SPRING.quick },
    },
};

// ─── モックデータ ────────────────────────────────────────────────────────────

const MOCK = {
    userId:          "Y",
    todayExpense:    1280,
    recordingStreak: 6,
    avgDailyExpense: 9800,
    totalAssets:     999853,
    monthlyIncome:   252600,
    dailyBudget:     7692,
    daysUntilPayday: 13,
    monthSummary:    { label: "2026 / 05", expense: 148700, income: 252600 },
    lastMonthExpense: 170200, // 先月（4月）の支出 — 先月比計算用
    savingsGoal:     30000, // 月間貯蓄目標
    // 直近7日（今日=土5/16が右端）— 5/10(日) は記録もれ日の例
    weeklyData: [
        { dow: "日", date: "2026-05-10", expense: 0,     recorded: false },
        { dow: "月", date: "2026-05-11", expense: 1200,  recorded: true  },
        { dow: "火", date: "2026-05-12", expense: 20470, recorded: true  },
        { dow: "水", date: "2026-05-13", expense: 2400,  recorded: true  },
        { dow: "木", date: "2026-05-14", expense: 4000,  recorded: true  },
        { dow: "金", date: "2026-05-15", expense: 1830,  recorded: true  },
        { dow: "土", date: "2026-05-16", expense: 0,     recorded: false }, // 今日・未入力
    ],
    recentExpenses: [
        { id: "1", date: "2026-05-15", time: "12:34", amount: 1280,  balanceType: 0, categoryName: "食費",   content: "スーパー" },
        { id: "2", date: "2026-05-15", time: "08:12", amount: 550,   balanceType: 0, categoryName: "交通費", content: "電車" },
        { id: "3", date: "2026-05-14", time: "19:05", amount: 3200,  balanceType: 0, categoryName: "日用品", content: "ドラッグストア" },
        { id: "4", date: "2026-05-14", time: "13:22", amount: 800,   balanceType: 0, categoryName: "食費",   content: "コンビニ" },
        { id: "5", date: "2026-05-13", time: "00:01", amount: 50000, balanceType: 1, categoryName: "給料",   content: "5月給与（一部）" },
        { id: "6", date: "2026-05-12", time: "11:10", amount: 20000, balanceType: 0, categoryName: "日用品", content: "生活用品まとめ買い" },
    ],
    alerts: [
        { id: "a1", type: "caution" as const, message: "今月の食費が先月比 +23% です" },
        { id: "a2", type: "danger"  as const, message: "固定費の引き落とし予定日まで3日" },
    ],
};

// SSOT からカテゴリ配列を生成（id は表示順インデックス）
const EXPENSE_CATEGORIES = EXPENSE_TOKEN_LIST.map((tok, i) => ({ ...tok, id: i }))
const INCOME_CATEGORIES  = INCOME_TOKEN_LIST.map((tok, i) => ({ ...tok, id: i }))

/** クイック入力エリアで先頭固定するカテゴリ（SSOT キー名で定義） */
const PINNED_EXPENSE_KEYS = ['food', 'transport', 'utility', 'daily']
const PINNED_INCOME_KEYS  = ['salary', 'bonus', 'sideJob']
const PINNED_EXPENSE_IDS  = PINNED_EXPENSE_KEYS.map(k => EXPENSE_CATEGORIES.findIndex(c => c.key === k))
const PINNED_INCOME_IDS   = PINNED_INCOME_KEYS.map(k => INCOME_CATEGORIES.findIndex(c => c.key === k))

// ─── ユーティリティ ────────────────────────────────────────────────────────

function formatYen(n: number) { return `¥${Math.round(n).toLocaleString("ja-JP")}`; }
function formatYenSigned(n: number) {
    return `${n >= 0 ? "+" : "−"}¥${Math.abs(Math.round(n)).toLocaleString("ja-JP")}`;
}
// ─── ストリーク用ツールチップ ─────────────────────────────────────────────────

type StreakState = "achieved" | "over" | "unrecorded" | "future"

function StreakTooltipContent({
    dow, date, state, expense, dailyBudget,
}: {
    dow: string; date: string; state: StreakState; expense: number; dailyBudget: number;
}) {
    const [, m, d] = date.split("-")
    const dateLabel = `${parseInt(m)}/${parseInt(d)} (${dow})`
    const saving = dailyBudget - expense
    const over   = expense - dailyBudget

    if (state === "future") return null

    return (
        <div className="flex flex-col gap-1 min-w-[100px]">
            <div className="text-[11px] font-bold text-white mb-0.5">{dateLabel}</div>
            {state === "unrecorded" ? (
                <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>記録なし</div>
            ) : (
                <>
                    <div className="flex justify-between gap-3 text-[10px]">
                        <span style={{ color: "rgba(255,255,255,0.55)" }}>支出</span>
                        <span className="font-mono text-white">{formatYen(expense)}</span>
                    </div>
                    <div className="flex justify-between gap-3 text-[10px]">
                        <span style={{ color: "rgba(255,255,255,0.55)" }}>日予算</span>
                        <span className="font-mono text-white">{formatYen(dailyBudget)}</span>
                    </div>
                    <div className="mt-0.5 flex justify-between gap-3 text-[10px] border-t border-white/10 pt-1">
                        {state === "achieved" ? (
                            <>
                                <span style={{ color: "#4ade80" }}>節約達成</span>
                                <span className="font-mono font-bold" style={{ color: "#4ade80" }}>+{formatYen(saving)}</span>
                            </>
                        ) : (
                            <>
                                <span style={{ color: "#f43f5e" }}>超過</span>
                                <span className="font-mono font-bold" style={{ color: "#f43f5e" }}>+{formatYen(over)}</span>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

/** ホバー(PC) / タップ(SP) 両対応ツールチップ */
function StreakTooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
    const [open, setOpen] = useState(false)
    return (
        <TooltipPrimitive.Root open={open} onOpenChange={setOpen} delayDuration={150}>
            <TooltipPrimitive.Trigger asChild>
                {/* button にしてタップでも開閉できるようにする */}
                <button
                    type="button"
                    className="flex flex-col items-center gap-1 cursor-default"
                    onClick={() => setOpen(v => !v)}
                >
                    {children}
                </button>
            </TooltipPrimitive.Trigger>
            {content && (
                <TooltipPrimitive.Portal>
                    <TooltipPrimitive.Content
                        sideOffset={6}
                        side="top"
                        className="z-[100] rounded-xl px-3 py-2 shadow-xl"
                        style={{
                            background: "#1c1410",
                            border: "1px solid rgba(255,255,255,0.08)",
                        }}
                    >
                        {content}
                        <TooltipPrimitive.Arrow style={{ fill: "#1c1410" }} />
                    </TooltipPrimitive.Content>
                </TooltipPrimitive.Portal>
            )}
        </TooltipPrimitive.Root>
    )
}

type Tone = "safe" | "caution" | "danger";
function budgetTone(ratio: number): Tone {
    if (ratio >= 0.8) return "safe";
    if (ratio >= 0.2) return "caution";
    return "danger";
}


function categoryAccent(name: string, isIncome: boolean) {
    const tok = isIncome ? getIncomeCategoryToken(name) : getExpenseCategoryToken(name)
    return { bg: tok.bg, fg: tok.color }
}
function categoryIconComp(name: string, isIncome: boolean) {
    const tok = isIncome ? getIncomeCategoryToken(name) : getExpenseCategoryToken(name)
    return tok.icon
}

// ─── ブレイクポイント検出 ────────────────────────────────────────────────────

function useIsLargeScreen() {
    const [isLarge, setIsLarge] = useState(() =>
        typeof window !== "undefined" ? window.innerWidth >= 1024 : false,
    );
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 1024px)");
        const handler = (e: MediaQueryListEvent) => setIsLarge(e.matches);
        mq.addEventListener("change", handler);
        return () => mq.removeEventListener("change", handler);
    }, []);
    return isLarge;
}

// ─── SpringNumber ─────────────────────────────────────────────────────────

function SpringNumber({ value, format }: { value: number; format: (n: number) => string }) {
    const shouldReduce = useReducedMotion();
    const mv      = useMotionValue(0);
    const spring_ = useSpring(mv, { stiffness: 350, damping: 30 });
    const [display, setDisplay] = useState(shouldReduce ? format(value) : format(0));
    const prev = useRef(0);

    useEffect(() => {
        if (shouldReduce) { setDisplay(format(value)); return; }
        const ctrl = animate(prev.current, value, {
            duration: 0.9,
            ease: [0.16, 1, 0.3, 1],
            onUpdate: (v) => setDisplay(format(v)),
        });
        prev.current = value;
        return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    void spring_;
    return <>{display}</>;
}

// ─── ProgressBar ─────────────────────────────────────────────────────────

function ProgressBar({
    pct, gradient, delay = 0, height = "h-2", trackColor = "rgba(28,20,16,0.07)",
}: {
    pct: number; gradient: string; delay?: number; height?: string; trackColor?: string;
}) {
    return (
        <div className={`${height} overflow-hidden`} style={{ background: trackColor, borderRadius: R.badge }}>
            <motion.div
                className="h-full"
                style={{ background: gradient, borderRadius: R.badge }}
                initial={{ width: "0%" }}
                animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                transition={{ ...SPRING.bar, delay }}
            />
        </div>
    );
}

// ─── Numpad ──────────────────────────────────────────────────────────────

function Numpad({ onKey }: { onKey: (k: string) => void }) {
    const keys = ["1","2","3","4","5","6","7","8","9","000","0","⌫"];
    return (
        <div className="grid grid-cols-3 gap-1.5">
            {keys.map((k) => (
                <motion.button
                    key={k}
                    type="button"
                    onClick={() => onKey(k)}
                    whileTap={{ scale: 0.84 }}
                    transition={SPRING.snap}
                    aria-label={k === "⌫" ? "1文字削除" : k === "00" ? "ゼロを2つ入力" : `${k}を入力`}
                    className="flex h-10 items-center justify-center text-[16px] font-semibold tap-highlight select-none"
                    style={{
                        borderRadius: R.inner,
                        background:   k === "⌫" ? "#fff0ea" : C.card,
                        color:        k === "⌫" ? C.brand   : C.text,
                        border:       `1px solid ${C.border}`,
                        boxShadow:    "0 1px 3px rgba(28,20,16,0.06)",
                    }}
                >
                    {k === "⌫" ? <Delete size={19} aria-hidden /> : k}
                </motion.button>
            ))}
        </div>
    );
}

// ─── 日付グルーピング ──────────────────────────────────────────────────────

type Expense = typeof MOCK.recentExpenses[number];
function groupByDate(list: Expense[]) {
    const today = "2026-05-15", yesterday = "2026-05-14";
    const map = new Map<string, Expense[]>();
    for (const it of list) {
        const arr = map.get(it.date) ?? [];
        arr.push(it);
        map.set(it.date, arr);
    }
    // 日付降順に並べ直し、直近3日分のみ返す
    const entries = Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
    return entries.slice(0, 3).map(([date, items]) => {
        let label: string;
        if (date === today)          label = "今日";
        else if (date === yesterday) label = "昨日";
        else                         label = date.replace(/-/g, "/"); // yyyy/mm/dd
        const dayTotal = items
            .filter(it => it.balanceType === 0)
            .reduce((s, it) => s + it.amount, 0);
        return { date, items, label, dayTotal };
    });
}

// ─── クイック入力フォーム（Drawer / Modal 共用） ─────────────────────────────

type QECProps = {
    balanceType: 0 | 1
    setBalanceType: (t: 0 | 1) => void
    amountStr: string
    onClear: () => void
    categoryId: number
    setCategoryId: (id: number) => void
    noteText: string
    setNoteText: (v: string) => void
    submitted: boolean
    showAllCategories: boolean
    setShowAllCategories: (v: boolean) => void
    visibleCategories: { id: number; name: string; icon: React.ElementType; color: string }[]
    restCategories:    { id: number; name: string; icon: React.ElementType; color: string }[]
    previewRemaining: number | null
    handleNumKey: (k: string) => void
    handleSubmit: () => void
    variant: "drawer" | "modal"
}

/** セグメントコントロール（支出 / 収入）— Drawer / Modal 共用 */
function SegmentControl({ balanceType, setBalanceType }: {
    balanceType: 0 | 1
    setBalanceType: (t: 0 | 1) => void
}) {
    return (
        <div role="tablist" aria-label="収支タイプ選択" className="flex p-1" style={{ borderRadius: R.inner, background: "rgba(28,20,16,0.06)" }}>
            {([0, 1] as const).map((t) => (
                <motion.button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={balanceType === t}
                    aria-label={t === 0 ? "支出を記録" : "収入を記録"}
                    onClick={() => setBalanceType(t)}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING.snap}
                    className="flex-1 py-2 text-sm font-bold relative tap-highlight"
                    style={{ borderRadius: "10px", zIndex: 1 }}
                >
                    {balanceType === t && (
                        <motion.div
                            layoutId="tab-bg"
                            className="absolute inset-0"
                            style={{
                                borderRadius: "10px",
                                background: t === 0
                                    ? `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`
                                    : `linear-gradient(135deg, ${C.income}, ${C.incomeDeep})`,
                                boxShadow: t === 0
                                    ? "0 2px 10px rgba(241,136,64,0.28)"
                                    : "0 2px 10px rgba(53,181,162,0.25)",
                            }}
                            transition={SPRING.base}
                        />
                    )}
                    <span className="relative z-10" style={{ color: balanceType === t ? "#fff" : C.muted }}>
                        {t === 0 ? "支出" : "収入"}
                    </span>
                </motion.button>
            ))}
        </div>
    );
}

/** 金額表示パネル */
function AmountPanel({ balanceType, amountStr, onClear, previewRemaining, titleNode }: {
    balanceType: 0 | 1
    amountStr: string
    onClear: () => void
    previewRemaining: number | null
    titleNode: React.ReactNode
}) {
    return (
        <motion.div
            layout
            className="relative overflow-hidden rounded-2xl px-5 py-4"
            style={{
                background: balanceType === 0
                    ? `linear-gradient(135deg, ${C.brandLight}, #ffe8d6)`
                    : `linear-gradient(135deg, ${C.incomeLight}, #d4f5ef)`,
                border: `1.5px solid ${balanceType === 0 ? "rgba(241,136,64,0.22)" : "rgba(53,181,162,0.22)"}`,
            }}
            transition={SPRING.base}
        >
            {titleNode}
            <div
                className="hero-number text-4xl font-black mt-1"
                style={{ color: balanceType === 0 ? C.brandDeep : C.incomeDeep, letterSpacing: "-0.03em" }}
            >
                ¥{amountStr === "" ? "0" : Number(amountStr).toLocaleString("ja-JP")}
            </div>
            {previewRemaining !== null && amountStr !== "" && Number(amountStr) > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={SPRING.quick}
                    className="mt-1.5 text-[11px]"
                    style={{ color: C.muted }}
                >
                    記録後の残り：
                    <span
                        className="font-bold tabular-nums ml-0.5"
                        style={{ color: previewRemaining < MOCK.dailyBudget * 0.2 ? "#f43f5e" : C.text }}
                    >
                        {formatYen(previewRemaining)}
                    </span>
                </motion.div>
            )}
            <AnimatePresence>
                {amountStr !== "" && (
                    <motion.button
                        type="button"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileTap={{ scale: 0.80 }}
                        transition={SPRING.snap}
                        onClick={onClear}
                        className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full"
                        style={{ background: "rgba(28,20,16,0.10)", color: C.muted }}
                        aria-label="クリア"
                    >
                        <X size={12} />
                    </motion.button>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/** カテゴリグリッド */
function CategoryGrid({ balanceType, categoryId, setCategoryId, visibleCategories, restCategories, showAllCategories, setShowAllCategories }: {
    balanceType: 0 | 1
    categoryId: number
    setCategoryId: (id: number) => void
    visibleCategories: { id: number; name: string; icon: React.ElementType; color: string }[]
    restCategories:    { id: number; name: string; icon: React.ElementType; color: string }[]
    showAllCategories: boolean
    setShowAllCategories: (v: boolean) => void
}) {
    return (
        <div>
            <div className="text-[10px] font-semibold mb-2" style={{ color: C.muted }}>
                カテゴリ
                {!showAllCategories && (
                    <span className="ml-1.5 text-[9px]" style={{ color: "rgba(28,20,16,0.30)" }}>よく使う順</span>
                )}
            </div>
            <AnimatePresence mode="wait">
                <motion.div
                    key={balanceType}
                    initial={{ opacity: 0, x: balanceType === 0 ? -6 : 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: balanceType === 0 ? 6 : -6 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                >
                    <div className="grid grid-cols-4 gap-2">
                        {visibleCategories.map((cat) => {
                            const Icon = cat.icon;
                            const isSelected = categoryId === cat.id;
                            return (
                                <motion.button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategoryId(cat.id)}
                                    whileTap={{ scale: 0.88 }}
                                    transition={SPRING.snap}
                                    className="relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold tap-highlight overflow-hidden"
                                    style={{ borderRadius: R.inner }}
                                >
                                    {isSelected ? (
                                        <motion.div
                                            layoutId="cat-bg"
                                            className="absolute inset-0"
                                            style={{
                                                borderRadius: R.inner,
                                                background:   `color-mix(in srgb, ${cat.color} 13%, white)`,
                                                border:       `1.5px solid color-mix(in srgb, ${cat.color} 36%, transparent)`,
                                            }}
                                            transition={SPRING.base}
                                        />
                                    ) : (
                                        <div className="absolute inset-0" style={{ borderRadius: R.inner, background: C.bg, border: `1px solid ${C.border}` }} />
                                    )}
                                    <span className="relative z-10">
                                        <Icon size={18} style={{ color: isSelected ? cat.color : "rgba(28,20,16,0.35)" }} aria-hidden />
                                    </span>
                                    <span className="relative z-10" style={{ color: isSelected ? cat.color : C.muted }}>
                                        {cat.name}
                                    </span>
                                </motion.button>
                            );
                        })}
                    </div>
                    {restCategories.length > 0 && (
                        <motion.button
                            type="button"
                            onClick={() => setShowAllCategories(!showAllCategories)}
                            whileTap={{ scale: 0.96 }}
                            transition={SPRING.snap}
                            aria-expanded={showAllCategories}
                            aria-label={showAllCategories ? "カテゴリ一覧を折りたたむ" : `カテゴリ一覧をすべて表示（残り${restCategories.length}件）`}
                            className="mt-2 flex w-full items-center justify-center gap-1 py-2 text-[11px] font-semibold tap-highlight"
                            style={{ borderRadius: R.inner, background: C.bg, border: `1px solid ${C.border}`, color: C.muted }}
                        >
                            <ChevronDown size={12} aria-hidden style={{ transform: showAllCategories ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
                            {showAllCategories ? "折りたたむ" : `もっと見る（${restCategories.length}件）`}
                        </motion.button>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/** 確定ボタン（成功状態含む） */
/**
 * PC モーダル用 金額入力フィールド（shadcn UI スタイル）
 * テンキー入力に加えてキーボード直接入力に対応。
 */

function SubmitButton({ submitted, amountStr, balanceType, handleSubmit }: {
    submitted: boolean
    amountStr: string
    balanceType: 0 | 1
    handleSubmit: () => void
}) {
    return (
        <AnimatePresence mode="wait">
            {submitted ? (
                <motion.div
                    key="success"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1,    opacity: 1 }}
                    exit={{ scale: 0.90,   opacity: 0 }}
                    transition={SPRING.quick}
                    className="flex w-full items-center justify-center gap-2 py-4 text-sm font-bold text-white"
                    style={{ background: `linear-gradient(135deg, ${C.income}, ${C.incomeDeep})`, borderRadius: R.input }}
                >
                    <Check size={18} strokeWidth={2.5} />
                    記録しました！
                </motion.div>
            ) : (
                <motion.button
                    key="submit"
                    type="button"
                    onClick={handleSubmit}
                    disabled={amountStr === "" || amountStr === "0"}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING.snap}
                    className="flex w-full items-center justify-center gap-2 py-4 text-sm font-bold text-white tap-highlight disabled:opacity-40"
                    style={{
                        background: amountStr && Number(amountStr) > 0
                            ? (balanceType === 0
                                ? `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`
                                : `linear-gradient(135deg, ${C.income}, ${C.incomeDeep})`)
                            : "rgba(28,20,16,0.14)",
                        borderRadius: R.input,
                        boxShadow: amountStr && Number(amountStr) > 0
                            ? (balanceType === 0
                                ? "0 4px 16px rgba(241,136,64,0.28)"
                                : "0 4px 16px rgba(53,181,162,0.24)")
                            : "none",
                        transition: "background 0.2s, box-shadow 0.2s",
                    }}
                >
                    <Receipt size={16} />
                    記録する
                </motion.button>
            )}
        </AnimatePresence>
    );
}

function QuickEntryContent(p: QECProps) {
    const isModal = p.variant === "modal";

    if (isModal) {
        /* ── PC モーダル: 2カラムレイアウト ──────────────────────────────────
         *  [セグメント — 全幅]
         *  左: 金額表示 + テンキー
         *  右: カテゴリ + メモ + 記録ボタン
         */
        return (
            <motion.div
                variants={DRAWER_ANIM.container}
                initial="hidden"
                animate="visible"
                className="px-5 space-y-4"
            >
                {/* セグメントコントロール（全幅） */}
                <motion.div variants={DRAWER_ANIM.item}>
                    <SegmentControl
                        balanceType={p.balanceType}
                        setBalanceType={p.setBalanceType}
                    />
                </motion.div>

                {/* 2カラムグリッド */}
                <motion.div variants={DRAWER_ANIM.item} className="grid grid-cols-2 gap-4 items-start">
                    {/* 左: 金額表示 + テンキー */}
                    <div className="space-y-3">
                        <AmountPanel
                            balanceType={p.balanceType}
                            amountStr={p.amountStr}
                            onClear={p.onClear}
                            previewRemaining={p.previewRemaining}
                            titleNode={
                                <span className="text-[10px] font-semibold" style={{ color: C.muted }}>
                                    {p.balanceType === 0 ? "支出金額" : "収入金額"}
                                </span>
                            }
                        />
                        <Numpad onKey={p.handleNumKey} />
                    </div>

                    {/* 右: カテゴリ + メモ + 記録ボタン */}
                    <div className="flex flex-col gap-3">
                        <div
                            className="rounded-xl p-3"
                            style={{ border: `1px solid ${C.border}`, background: C.bg }}
                        >
                            <CategoryGrid
                                balanceType={p.balanceType}
                                categoryId={p.categoryId}
                                setCategoryId={p.setCategoryId}
                                visibleCategories={p.visibleCategories}
                                restCategories={p.restCategories}
                                showAllCategories={p.showAllCategories}
                                setShowAllCategories={p.setShowAllCategories}
                            />
                        </div>
                        <div>
                            <div className="text-[10px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: C.muted }}>
                                <PenLine size={10} />
                                メモ（任意）
                            </div>
                            <input
                                value={p.noteText}
                                onChange={(e) => p.setNoteText(e.target.value)}
                                className="flex h-9 w-full px-3 outline-none transition-colors"
                                style={{
                                    fontSize:     "14px",
                                    border:       `1.5px solid ${p.noteText ? C.brand : C.border}`,
                                    borderRadius: R.input,
                                    background:   p.noteText ? C.brandLight : C.bg,
                                    color:        C.text,
                                }}
                                placeholder="店名・用途など"
                            />
                        </div>
                        <SubmitButton
                            submitted={p.submitted}
                            amountStr={p.amountStr}
                            balanceType={p.balanceType}
                            handleSubmit={p.handleSubmit}
                        />
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    /* ── SP Drawer: 縦積みレイアウト（既存） ─────────────────────────── */
    return (
        <motion.div
            className="overflow-y-auto"
            style={{ maxHeight: "calc(94dvh - 28px)" }}
            variants={DRAWER_ANIM.container}
            initial="hidden"
            animate="visible"
        >
            <motion.div className="px-4 pb-3" variants={DRAWER_ANIM.item}>
                <SegmentControl
                    balanceType={p.balanceType}
                    setBalanceType={p.setBalanceType}
                />
            </motion.div>
            <motion.div className="mx-4 mb-3" variants={DRAWER_ANIM.item}>
                <AmountPanel
                    balanceType={p.balanceType}
                    amountStr={p.amountStr}
                    onClear={p.onClear}
                    previewRemaining={p.previewRemaining}
                    titleNode={
                        <Drawer.Title className="text-[10px] font-semibold" style={{ color: C.muted }}>
                            {p.balanceType === 0 ? "支出金額" : "収入金額"}
                        </Drawer.Title>
                    }
                />
            </motion.div>
            <motion.div className="px-4 mb-3" variants={DRAWER_ANIM.item}>
                <CategoryGrid
                    balanceType={p.balanceType}
                    categoryId={p.categoryId}
                    setCategoryId={p.setCategoryId}
                    visibleCategories={p.visibleCategories}
                    restCategories={p.restCategories}
                    showAllCategories={p.showAllCategories}
                    setShowAllCategories={p.setShowAllCategories}
                />
            </motion.div>
            <motion.div className="px-4 mb-3" variants={DRAWER_ANIM.item}>
                <div className="text-[10px] font-semibold mb-1.5 flex items-center gap-1" style={{ color: C.muted }}>
                    <PenLine size={10} />
                    メモ（任意）
                </div>
                <input
                    value={p.noteText}
                    onChange={(e) => p.setNoteText(e.target.value)}
                    className="flex h-10 w-full px-3 outline-none transition-colors"
                    style={{
                        fontSize:     "16px",
                        border:       `1.5px solid ${p.noteText ? C.brand : C.border}`,
                        borderRadius: R.input,
                        background:   p.noteText ? C.brandLight : C.bg,
                        color:        C.text,
                    }}
                    placeholder="店名・用途など"
                />
            </motion.div>
            <motion.div className="px-4 mb-3" variants={DRAWER_ANIM.item}>
                <Numpad onKey={p.handleNumKey} />
            </motion.div>
            <motion.div className="px-4 pb-10" variants={DRAWER_ANIM.item}>
                <SubmitButton
                    submitted={p.submitted}
                    amountStr={p.amountStr}
                    balanceType={p.balanceType}
                    handleSubmit={p.handleSubmit}
                />
            </motion.div>
        </motion.div>
    );
}

// ─── メインコンポーネント ────────────────────────────────────────────────────

export function HomePrototype() {
    const shouldReduce  = useReducedMotion();
    const isLargeScreen = useIsLargeScreen();

    // ── 既存 state ────────────────────────────────────────────────────────────
    const [drawerOpen, setDrawerOpen]   = useState(false);
    const [balanceType, setBalanceType] = useState<0 | 1>(0);
    const [alerts, setAlerts]           = useState(MOCK.alerts);
    const [submitted, setSubmitted]     = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);

    // ── per-tab フォーム draft（タブを切り替えても入力を保持）────────────────
    type TabDraft = { amountStr: string; categoryId: number; noteText: string; showAllCategories: boolean }
    const DEFAULT_DRAFT: TabDraft = { amountStr: "", categoryId: 0, noteText: "", showAllCategories: false };
    const [drafts, setDrafts] = useState<{ 0: TabDraft; 1: TabDraft }>({
        0: { ...DEFAULT_DRAFT },
        1: { ...DEFAULT_DRAFT },
    });

    // 現在タブの convenience accessors
    const draft             = drafts[balanceType];
    const amountStr         = draft.amountStr;
    const categoryId        = draft.categoryId;
    const noteText          = draft.noteText;
    const showAllCategories = draft.showAllCategories;

    function patchDraft(patch: Partial<TabDraft>) {
        setDrafts(prev => ({ ...prev, [balanceType]: { ...prev[balanceType], ...patch } }));
    }
    function setAmountStr(v: string | ((p: string) => string)) {
        setDrafts(prev => {
            const cur = prev[balanceType].amountStr;
            const next = typeof v === "function" ? v(cur) : v;
            return { ...prev, [balanceType]: { ...prev[balanceType], amountStr: next } };
        });
    }
    function setCategoryId(id: number) { patchDraft({ categoryId: id }); }
    function setNoteText(t: string) { patchDraft({ noteText: t }); }
    function setShowAllCategories(v: boolean | ((p: boolean) => boolean)) {
        setDrafts(prev => {
            const cur = prev[balanceType].showAllCategories;
            const next = typeof v === "function" ? v(cur) : v;
            return { ...prev, [balanceType]: { ...prev[balanceType], showAllCategories: next } };
        });
    }

    // ── 機能 state ───────────────────────────────────────────────────────────
    // ⑥ ベル通知パネル
    const [notifPanelOpen, setNotifPanelOpen] = useState(false);
    // ⑤ 初回設定完了後の空状態デモトグル
    const [isFirstSetup, setIsFirstSetup] = useState(false);

    // ── SP スワイプカルーセル（今日の状況・今月の貯蓄予測・今月のサマリー）────────
    const [carouselIdx,        setCarouselIdx]        = useState(0)
    const [carouselDir,        setCarouselDir]        = useState<1 | -1>(1)
    const [carouselHintPlayed, setCarouselHintPlayed] = useState(false)

    const CAROUSEL_COUNT = 3
    function goCarousel(nextIdx: number) {
        if (nextIdx < 0 || nextIdx >= CAROUSEL_COUNT) return
        setCarouselDir(nextIdx > carouselIdx ? 1 : -1)
        setCarouselIdx(nextIdx)
    }
    function handleCarouselDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
        const threshold = 40
        if      (info.offset.x < -threshold) goCarousel(carouselIdx + 1)
        else if (info.offset.x >  threshold) goCarousel(carouselIdx - 1)
    }
    const carouselSlideVariants = {
        enter:  (dir: number) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
        center: { x: 0, opacity: 1, transition: { type: 'spring' as const, stiffness: 320, damping: 30 } },
        exit:   (dir: number) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.14 } }),
    }
    const CAROUSEL_LABELS = ['今日の状況', '今月の貯蓄予測', '今月のサマリー'] as const

    // ── 計算値 ────────────────────────────────────────────────────────────────
    const netMonth    = MOCK.monthSummary.income - MOCK.monthSummary.expense;
    const savingsRate = Math.round((netMonth / MOCK.monthSummary.income) * 100);

    const remaining = Math.max(0, MOCK.dailyBudget - MOCK.todayExpense);
    const ratio     = MOCK.dailyBudget > 0 ? remaining / MOCK.dailyBudget : 1;
    const tone      = budgetTone(ratio);
    const ps        = C[tone];

    const dayOfMonth    = 15;
    const daysInMonth   = 31;

    // ── Block 1/2/3 計算値 ────────────────────────────────────────────────────
    const todayTotalExpense = MOCK.recentExpenses
        .filter(r => r.date === "2026-05-15" && r.balanceType === 0)
        .reduce((s, r) => s + r.amount, 0) // 1,830

    // A案: 今日のペースで残り日数を延長して月末予測
    const pastExpense            = MOCK.monthSummary.expense - todayTotalExpense
    const remainingDays          = daysInMonth - dayOfMonth               // 16日
    const projectedMonthEndExp   = pastExpense + todayTotalExpense * (remainingDays + 1)
    const projectedSavings       = MOCK.monthSummary.income - projectedMonthEndExp
    const savingsAchievementRate = projectedSavings / MOCK.savingsGoal    // 例: 2.49

    const remainingBudget      = MOCK.monthSummary.income - MOCK.monthSummary.expense // 103,900
    const dailyRemainingBudget = remainingDays > 0 ? remainingBudget / remainingDays : 0

    // Block 2 バー用
    const income             = MOCK.monthSummary.income
    const actualExpensePct   = Math.min(99, (MOCK.monthSummary.expense / income) * 100)
    const projectedExpensePct= Math.min(99, (projectedMonthEndExp / income) * 100)
    const targetExpenseAmount= income - MOCK.savingsGoal                  // 222,600
    const targetLinePct      = Math.min(99, (targetExpenseAmount / income) * 100) // 88%

    // 貯蓄バーの色
    const savingsBarColor = savingsAchievementRate >= 1
        ? { solid: "linear-gradient(90deg, #34d399, #35b5a2)", light: "rgba(53,181,162,0.22)" }
        : savingsAchievementRate >= 0.5
            ? { solid: "linear-gradient(90deg, #f9a8d4, #e879a3)", light: "rgba(232,121,163,0.22)" }
            : { solid: "linear-gradient(90deg, #fb7185, #f43f5e)", light: "rgba(244,63,94,0.22)" }

    // Block 2 バッジ
    const savingsBadge = savingsAchievementRate >= 1
        ? { label: "達成見込み ✓", bg: "rgba(53,181,162,0.10)",  color: C.income   }
        : savingsAchievementRate >= 0.5
            ? { label: `目標まであと${formatYen(MOCK.savingsGoal - projectedSavings)}`, bg: "rgba(232,121,163,0.12)", color: "#e879a3" }
            : projectedSavings < 0
                ? { label: "赤字見込み", bg: "rgba(244,63,94,0.09)", color: "#f43f5e" }
                : { label: "達成困難",   bg: "rgba(244,63,94,0.09)", color: "#f43f5e" }

    // Block 1 今日ステータスバッジ
    const todaySpendPct   = MOCK.dailyBudget > 0 ? todayTotalExpense / MOCK.dailyBudget : 0
    const todayStatusBadge = todaySpendPct <= 0.5
        ? { label: "好調",   bg: C.incomeLight,               color: C.income   }
        : todaySpendPct <= 0.8
            ? { label: "順調",   bg: C.incomeLight,               color: C.income   }
            : todaySpendPct <= 1.0
                ? { label: "注意",   bg: "rgba(232,121,163,0.12)",    color: "#e879a3"  }
                : { label: "超過",   bg: "rgba(244,63,94,0.09)",      color: "#f43f5e"  }

    // Block 1 貯蓄インサイト（アイコン・メッセージ）
    const achievePct = Math.round(savingsAchievementRate * 100)
    const savingsInsight = savingsAchievementRate >= 1.5
        ? { Icon: Sparkles,      color: C.brand,    bg: C.brandLight,                message: `今日この調子なら目標 +${achievePct - 100}% 達成見込み！` }
        : savingsAchievementRate >= 1.0
            ? { Icon: TrendingUp,    color: C.income,   bg: C.incomeLight,               message: "このペースなら今月の貯蓄目標達成見込み" }
            : savingsAchievementRate >= 0.5
                ? { Icon: AlertTriangle, color: "#e879a3",  bg: "rgba(232,121,163,0.08)",    message: "あと少し節約すると目標達成できそう" }
                : projectedSavings < 0
                    ? { Icon: AlertCircle,   color: "#f43f5e",  bg: "rgba(244,63,94,0.08)",      message: "このペースだと今月赤字になりそう" }
                    : { Icon: AlertCircle,   color: C.brand,    bg: C.brandLight,                message: "支出を抑えると目標に近づきます" }

    // Block 3 週次ストリーク集計
    const weekAchievedCount = MOCK.weeklyData.filter(
        d => d.recorded && d.expense <= MOCK.dailyBudget
    ).length
    const weekRecordedCount = MOCK.weeklyData.filter(d => d.recorded).length

    const grouped = useMemo(() => groupByDate(MOCK.recentExpenses), []);

    // ── カテゴリ固定ロジック ──────────────────────────────────────────────────
    const allCategories = balanceType === 0 ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
    const pinnedIds     = balanceType === 0 ? PINNED_EXPENSE_IDS : PINNED_INCOME_IDS;
    const pinnedCategories  = allCategories.filter(c =>  pinnedIds.includes(c.id));
    const restCategories    = allCategories.filter(c => !pinnedIds.includes(c.id));
    const visibleCategories = showAllCategories ? allCategories : pinnedCategories;

    const previewRemaining = balanceType === 0
        ? Math.max(0, remaining - (Number(amountStr) || 0))
        : null;


    // ── アニメーション variants (reduceMotion 対応) ──────────────────────────
    const pageContainerVariants = shouldReduce ? {} : PAGE.container;
    const pageItemVariants      = shouldReduce ? {} : PAGE.item;

    // ── ハンドラ ──────────────────────────────────────────────────────────────
    function handleNumKey(k: string) {
        if (k === "⌫")  { setAmountStr((p) => p.slice(0, -1)); return; }
        if (k === "000") { setAmountStr((p) => p === "" ? p : p + "000"); return; }
        setAmountStr((p) => {
            const next = p + k;
            return Number(next) > 9_999_999 ? p : next;
        });
    }

    function handleOpenDrawer(categoryIdOverride?: number) {
        if (categoryIdOverride !== undefined) {
            // カテゴリ指定で開く場合のみ支出タブのカテゴリを上書き
            setDrafts(prev => ({ ...prev, 0: { ...prev[0], categoryId: categoryIdOverride } }));
            setBalanceType(0);
        }
        setSubmitted(false);
        setShowCloseConfirm(false);
        setDrawerOpen(true);
    }

    // 未入力データ確認（モーダル閉じる前に使用）
    const hasUnsavedData = drafts[0].amountStr !== "" || drafts[1].amountStr !== "";

    function handleModalCloseRequest() {
        if (hasUnsavedData) {
            setShowCloseConfirm(true);
        } else {
            setDrawerOpen(false);
        }
    }
    function handleModalForceClose() {
        setDrawerOpen(false);
        setShowCloseConfirm(false);
    }

    function handleSubmit() {
        if (!Number(amountStr)) return;
        setSubmitted(true);
        const bt = balanceType; // クロージャ用
        setTimeout(() => {
            // 記録後：現タブの金額・メモをリセット、ドロワー/モーダルは開いたまま
            setDrafts(prev => ({ ...prev, [bt]: { ...prev[bt], amountStr: "", noteText: "" } }));
            setSubmitted(false);
        }, 700);
    }

    // Esc でモーダルを閉じる（PC のみ）
    useEffect(() => {
        if (!drawerOpen || !isLargeScreen) return;
        function onKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                e.preventDefault();
                if (drafts[0].amountStr !== "" || drafts[1].amountStr !== "") {
                    setShowCloseConfirm(true);
                } else {
                    setDrawerOpen(false);
                }
            }
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [drawerOpen, isLargeScreen, drafts[0].amountStr, drafts[1].amountStr]);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <TooltipPrimitive.Provider delayDuration={150}>
        {/* ─── サイドナビ（PC のみ） ──────────────────────────────────────── */}
        <motion.aside
            initial={{ x: -52, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ ...SPRING.smooth, delay: 0.05 }}
            className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 w-52"
            style={{ background: C.card, borderRight: `1px solid ${C.border}` }}
        >
            {/* ロゴ */}
            <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4" style={{ borderColor: C.border }}>
                <img src="/logo192.png" alt="家計かんり" className="h-8 w-8 shrink-0" style={{ borderRadius: "10px" }} />
                <span className="text-[15px] font-extrabold tracking-tight" style={{ color: C.text }}>家計かんり</span>
            </div>

            {/* ナビ項目 */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="メインメニュー">
                {[
                    { label: "ホーム",   icon: Home,      to: "/home",              active: true  },
                    { label: "明細",     icon: Receipt,   to: "/meisai",            active: false },
                    { label: "レポート", icon: BarChart2,  to: "/report",            active: false },
                    { label: "設定",     icon: Settings,   to: "/personal-settings", active: false },
                ].map((item) => (
                    <MotionLink
                        key={item.label}
                        to={item.to}
                        whileTap={{ scale: 0.97 }}
                        transition={SPRING.snap}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-[13px] font-semibold tap-highlight"
                        {...(
                            item.label === "設定"     ? { "data-tour": "nav-settings" } :
                            item.label === "明細"     ? { "data-tour": "nav-meisai"   } :
                            item.label === "レポート" ? { "data-tour": "nav-report"   } :
                            {}
                        )}
                        style={{
                            borderRadius:   "10px",
                            background:     item.active ? C.brandLight : "transparent",
                            color:          item.active ? C.brand : "rgba(28,20,16,0.50)",
                            textDecoration: "none",
                        }}
                    >
                        <item.icon size={17} aria-hidden />
                        {item.label}
                    </MotionLink>
                ))}
            </nav>

            {/* ─── サイドバーフッター: ベル + アバター（PC のみ） ─── */}
            <div className="relative shrink-0 border-t px-3 py-2.5 flex items-center gap-2" style={{ borderColor: C.border }}>
                <div className="relative">
                    <motion.button
                        type="button"
                        onClick={() => setNotifPanelOpen((p) => !p)}
                        whileTap={{ scale: 0.82 }}
                        transition={SPRING.snap}
                        className="relative flex h-8 w-8 items-center justify-center tap-highlight"
                        style={{ color: "rgba(28,20,16,0.45)", borderRadius: "8px" }}
                        aria-label="通知"
                        aria-expanded={notifPanelOpen}
                    >
                        <Bell size={17} />
                        <AnimatePresence>
                            {alerts.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={SPRING.quick}
                                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[9px] font-extrabold text-white"
                                    style={{ background: "#f43f5e" }}
                                >
                                    {alerts.length}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    {/* 通知パネル（上方向に展開） */}
                    <AnimatePresence>
                        {notifPanelOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1   }}
                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                transition={SPRING.quick}
                                className="absolute left-0 bottom-full mb-2 z-50 w-64 overflow-hidden border"
                                style={{
                                    borderRadius: R.card,
                                    background:   C.card,
                                    borderColor:  C.borderStrong,
                                    boxShadow:    C.shadowMd,
                                }}
                            >
                                <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.border }}>
                                    <span className="text-sm font-bold" style={{ color: C.text }}>通知</span>
                                    <button type="button" onClick={() => setNotifPanelOpen(false)} style={{ color: C.muted }} aria-label="パネルを閉じる">
                                        <X size={14} />
                                    </button>
                                </div>
                                {alerts.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 px-4 py-8" style={{ color: C.muted }}>
                                        <BellOff size={20} />
                                        <span className="text-xs">新しい通知はありません</span>
                                    </div>
                                ) : (
                                    <div>
                                        {alerts.map((alert) => {
                                            const aColor = alert.type === "danger" ? "#f43f5e" : "#f59e0b";
                                            return (
                                                <div key={alert.id} className="flex items-start gap-3 border-b px-4 py-3 last:border-0" style={{ borderColor: C.border }}>
                                                    {alert.type === "danger"
                                                        ? <TrendingDown  size={13} style={{ color: aColor, flexShrink: 0, marginTop: 1 }} />
                                                        : <AlertTriangle size={13} style={{ color: aColor, flexShrink: 0, marginTop: 1 }} />
                                                    }
                                                    <span className="flex-1 text-xs leading-relaxed" style={{ color: C.text }}>{alert.message}</span>
                                                    <button type="button" onClick={() => setAlerts((p) => p.filter((a) => a.id !== alert.id))} style={{ color: C.muted, flexShrink: 0 }} aria-label="通知を閉じる">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1" />

                <MotionLink
                    to="/my-page"
                    whileTap={{ scale: 0.90 }}
                    transition={SPRING.snap}
                    className="flex h-8 w-8 items-center justify-center text-[12px] font-extrabold text-white tap-highlight"
                    style={{
                        background:     `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`,
                        borderRadius:   R.badge,
                        boxShadow:      "0 2px 8px rgba(241,136,64,0.30)",
                        textDecoration: "none",
                    }}
                    aria-label="マイページ"
                >
                    {MOCK.userId}
                </MotionLink>
            </div>
        </motion.aside>

        <div className="min-h-screen pb-32 tap-highlight lg:pb-28 lg:pl-52" style={{ background: C.bg, color: C.text }}>

            {/* ─── SP: ベル + アバター（ヘッダー廃止後の代替） ─── */}
            <div className="lg:hidden flex items-center justify-end gap-2 px-4 pt-3 pb-1">
                <div className="relative">
                    <motion.button
                        type="button"
                        onClick={() => setNotifPanelOpen((p) => !p)}
                        whileTap={{ scale: 0.82 }}
                        transition={SPRING.snap}
                        className="relative flex h-8 w-8 items-center justify-center tap-highlight"
                        style={{ color: "rgba(28,20,16,0.45)", borderRadius: "8px" }}
                        aria-label="通知"
                        aria-expanded={notifPanelOpen}
                    >
                        <Bell size={17} />
                        <AnimatePresence>
                            {alerts.length > 0 && (
                                <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={SPRING.quick}
                                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white text-[9px] font-extrabold text-white"
                                    style={{ background: "#f43f5e" }}
                                >
                                    {alerts.length}
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </motion.button>

                    {/* 通知パネル（SP: 下方向に展開） */}
                    <AnimatePresence>
                        {notifPanelOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0,  scale: 1    }}
                                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                transition={SPRING.quick}
                                className="absolute right-0 top-10 z-50 w-72 overflow-hidden border"
                                style={{
                                    borderRadius: R.card,
                                    background:   C.card,
                                    borderColor:  C.borderStrong,
                                    boxShadow:    C.shadowMd,
                                }}
                            >
                                <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.border }}>
                                    <span className="text-sm font-bold" style={{ color: C.text }}>通知</span>
                                    <button type="button" onClick={() => setNotifPanelOpen(false)} style={{ color: C.muted }} aria-label="パネルを閉じる">
                                        <X size={14} />
                                    </button>
                                </div>
                                {alerts.length === 0 ? (
                                    <div className="flex flex-col items-center gap-2 px-4 py-8" style={{ color: C.muted }}>
                                        <BellOff size={20} />
                                        <span className="text-xs">新しい通知はありません</span>
                                    </div>
                                ) : (
                                    <div>
                                        {alerts.map((alert) => {
                                            const aColor = alert.type === "danger" ? "#f43f5e" : "#f59e0b";
                                            return (
                                                <div key={alert.id} className="flex items-start gap-3 border-b px-4 py-3 last:border-0" style={{ borderColor: C.border }}>
                                                    {alert.type === "danger"
                                                        ? <TrendingDown  size={13} style={{ color: aColor, flexShrink: 0, marginTop: 1 }} />
                                                        : <AlertTriangle size={13} style={{ color: aColor, flexShrink: 0, marginTop: 1 }} />
                                                    }
                                                    <span className="flex-1 text-xs leading-relaxed" style={{ color: C.text }}>{alert.message}</span>
                                                    <button type="button" onClick={() => setAlerts((p) => p.filter((a) => a.id !== alert.id))} style={{ color: C.muted, flexShrink: 0 }} aria-label="通知を閉じる">
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <MotionLink
                    to="/my-page"
                    whileTap={{ scale: 0.90 }}
                    transition={SPRING.snap}
                    className="flex h-8 w-8 items-center justify-center text-[12px] font-extrabold text-white tap-highlight"
                    style={{
                        background:     `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`,
                        borderRadius:   R.badge,
                        boxShadow:      "0 2px 8px rgba(241,136,64,0.30)",
                        textDecoration: "none",
                    }}
                    aria-label="マイページ"
                >
                    {MOCK.userId}
                </MotionLink>
            </div>

            {/* 通知パネルのオーバーレイ（クリックで閉じる） */}
            <AnimatePresence>
                {notifPanelOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-40"
                        onClick={() => setNotifPanelOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* ─── メインコンテンツ ─────────────────────────────────────────── */}
            <main className="mx-auto max-w-7xl px-4 py-4 md:px-6 md:py-5">

                {/* ⑤ 初回設定デモトグル */}
                <div className="mb-3 flex items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold" style={{ color: C.muted }}>
                        デモ: 初回設定完了後の空状態
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsFirstSetup((p) => !p)}
                        className="flex h-6 w-11 items-center rounded-full border transition-colors"
                        style={{
                            background:  isFirstSetup ? C.brand : "rgba(28,20,16,0.12)",
                            borderColor: isFirstSetup ? C.brandDeep : "transparent",
                        }}
                        aria-pressed={isFirstSetup}
                        aria-label="初回設定デモを切り替え"
                    >
                        <motion.div
                            layout
                            transition={SPRING.quick}
                            className="h-4 w-4 rounded-full bg-white"
                            style={{
                                marginLeft: isFirstSetup ? "24px" : "4px",
                                boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            }}
                        />
                    </button>
                </div>

                {/* ── ⑤ 初回設定完了後の空状態 ─────────────────────────────── */}
                {isFirstSetup ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={SPRING.base}
                        className="flex flex-col items-center gap-6 py-16 text-center"
                    >
                        <motion.div
                            initial={{ scale: 0.6, opacity: 0 }}
                            animate={{ scale: 1,   opacity: 1 }}
                            transition={{ ...SPRING.smooth, delay: 0.1 }}
                            className="flex h-16 w-16 items-center justify-center rounded-2xl"
                            style={{ background: C.brandLight, boxShadow: "0 4px 20px rgba(241,136,64,0.16)" }}
                        >
                            <Sparkles size={28} style={{ color: C.brand }} />
                        </motion.div>
                        <div>
                            <h2 className="text-xl font-extrabold" style={{ color: C.text }}>
                                初回設定が完了しました！
                            </h2>
                            <p className="mt-1 text-sm" style={{ color: C.muted }}>
                                あなたの1日予算が計算されました
                            </p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...SPRING.base, delay: 0.2 }}
                            className="w-full max-w-xs rounded-2xl border-2 p-6 text-center"
                            style={{ background: ps.bg, borderColor: ps.border }}
                        >
                            <p className="text-xs font-semibold mb-1" style={{ color: C.muted }}>
                                今日使えるお金
                            </p>
                            <p className="text-4xl font-black" style={{ color: ps.hero, letterSpacing: "-0.03em" }}>
                                {formatYen(MOCK.dailyBudget)}
                            </p>
                            <p className="mt-2 text-xs" style={{ color: C.muted }}>
                                給料日まで あと {MOCK.daysUntilPayday} 日
                            </p>
                        </motion.div>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ ...SPRING.base, delay: 0.35 }}
                            className="text-sm"
                            style={{ color: C.muted }}
                        >
                            最初の支出を記録してみましょう
                        </motion.p>
                        <motion.button
                            type="button"
                            onClick={() => { setIsFirstSetup(false); handleOpenDrawer(); }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ ...SPRING.base, delay: 0.45 }}
                            whileTap={{ scale: 0.96 }}
                            className="flex items-center gap-2 px-8 py-4 text-base font-bold text-white"
                            style={{
                                background:   `linear-gradient(135deg, ${C.brand}, ${C.brandDeep})`,
                                borderRadius: R.badge,
                                boxShadow:    "0 4px 20px rgba(241,136,64,0.32)",
                            }}
                        >
                            <Plus size={18} strokeWidth={2.5} />
                            最初の支出を記録する
                        </motion.button>
                    </motion.div>

                ) : (<>
                    {/* ─── 通常ダッシュボード ──────────────────────────────────
                     * モバイル: 縦1カラム
                     * デスクトップ（lg）:
                     *   上段 左=[今日の状況・今週の記録] 右=[今月の貯蓄予測・サマリー]
                     *   下段 全幅=[最近の記録]
                     */}
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">

                        {/* ── 左カラム: 状況系ブロック ──────────────────────── */}
                        <motion.div
                            className="space-y-3"
                            variants={pageContainerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                        {isLargeScreen ? (
                            /* ── PC: Block 1〜4 縦並び ─────────────────── */
                            <>
                                {/* Block 1: 今日の状況 */}
                                <motion.div
                                    data-tour="block-today"
                                    variants={pageItemVariants}
                                    className="border p-4"
                                    style={{ borderRadius: R.card, background: C.card, borderColor: C.border, boxShadow: C.shadow }}
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-[13px] font-bold" style={{ color: C.text }}>今日の状況</span>
                                        <span className="px-2.5 py-0.5 text-[10px] font-bold" style={{ borderRadius: R.badge, background: todayStatusBadge.bg, color: todayStatusBadge.color }}>{todayStatusBadge.label}</span>
                                    </div>
                                    <div className="mb-1.5 flex justify-between text-[11px]" style={{ color: C.muted }}>
                                        <span>今日の支出</span>
                                        <span className="tabular-nums font-semibold">{formatYen(todayTotalExpense)} / {formatYen(MOCK.dailyBudget)}</span>
                                    </div>
                                    <ProgressBar pct={Math.min(100, Math.round(todaySpendPct * 100))} delay={0.3} gradient={todaySpendPct <= 0.8 ? "linear-gradient(90deg, #34d399, #35b5a2)" : todaySpendPct <= 1.0 ? "linear-gradient(90deg, #f9a8d4, #e879a3)" : "linear-gradient(90deg, #fb7185, #f43f5e)"} />
                                    <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: savingsInsight.bg }}>
                                        <savingsInsight.Icon size={13} style={{ color: savingsInsight.color, flexShrink: 0 }} />
                                        <span className="text-[11px] font-semibold leading-tight" style={{ color: savingsInsight.color }}>{savingsInsight.message}</span>
                                    </div>
                                </motion.div>

                                {/* Block 2: 今週の記録 */}
                                <motion.div data-tour="block-streak" variants={pageItemVariants} className="border p-4" style={{ borderRadius: R.card, background: C.card, borderColor: C.border, boxShadow: C.shadow }}>
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-[13px] font-bold" style={{ color: C.text }}>今週の記録</span>
                                        <span className="text-[11px] font-semibold tabular-nums" style={{ color: C.muted }}>{weekAchievedCount} / {weekRecordedCount}日 節約達成</span>
                                    </div>
                                    <div className="grid grid-cols-7 gap-1">
                                        {MOCK.weeklyData.map((day) => {
                                            const TODAY_DATE = "2026-05-16"
                                            const isToday    = day.date === TODAY_DATE
                                            const isFuture   = day.date > TODAY_DATE
                                            const achieved   = !isFuture && day.recorded && day.expense <= MOCK.dailyBudget
                                            const over       = !isFuture && day.recorded && day.expense > MOCK.dailyBudget
                                            const unrecorded = !isFuture && !day.recorded
                                            const streakState: StreakState = achieved ? "achieved" : over ? "over" : unrecorded ? "unrecorded" : "future"
                                            const Icon  = achieved ? CheckCircle2 : over ? AlertCircle : unrecorded ? HelpCircle : MinusCircle
                                            const color = achieved ? C.brand : over ? "#f43f5e" : unrecorded ? "rgba(28,20,16,0.38)" : "rgba(28,20,16,0.15)"
                                            const tooltipContent = <StreakTooltipContent dow={day.dow} date={day.date} state={streakState} expense={day.expense} dailyBudget={MOCK.dailyBudget} />
                                            const [, mm, dd] = day.date.split("-")
                                            const dateLabel = `${parseInt(mm)}/${parseInt(dd)}(${day.dow})`
                                            return (
                                                <StreakTooltip key={day.dow} content={isFuture ? null : tooltipContent}>
                                                    <span className="text-[8px] font-semibold leading-none tabular-nums" style={{ color: isToday ? C.brand : C.muted }}>{dateLabel}</span>
                                                    <Icon size={22} strokeWidth={2} style={{ color }} />
                                                </StreakTooltip>
                                            )
                                        })}
                                    </div>
                                </motion.div>

                            </>
                        ) : (
                            /* ── SP: スワイプカルーセル(Block1,3,4) + ストリーク(Block2) ─ */
                            <>
                                {/* ── カルーセルカード ── */}
                                <motion.div variants={pageItemVariants}>
                                    <div
                                        className="border overflow-hidden"
                                        style={{ borderRadius: R.card, background: C.card, borderColor: C.border, boxShadow: C.shadow }}
                                    >
                                        {/* スワイプ可能エリア */}
                                        <motion.div
                                            drag="x"
                                            dragConstraints={{ left: 0, right: 0 }}
                                            dragElastic={0.04}
                                            onDragEnd={handleCarouselDragEnd}
                                            style={{ touchAction: 'pan-y', cursor: 'grab', minHeight: 260, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                                            whileDrag={{ cursor: 'grabbing' }}
                                            // 初回: 微小なウィグルでスワイプ可能性を伝える（小さめ）
                                            animate={carouselHintPlayed ? {} : { x: [0, -5, 3, 0] }}
                                            transition={carouselHintPlayed ? {} : { duration: 0.7, delay: 0.8, ease: 'easeInOut' }}
                                            onAnimationComplete={() => setCarouselHintPlayed(true)}
                                        >
                                            <AnimatePresence mode="wait" custom={carouselDir}>
                                                {/* Slide 0: 今日の状況 + 今週の記録 */}
                                                {carouselIdx === 0 && (
                                                    <motion.div
                                                        key="today"
                                                        data-tour="block-today"
                                                        custom={carouselDir}
                                                        variants={carouselSlideVariants}
                                                        initial="enter"
                                                        animate="center"
                                                        exit="exit"
                                                        className="p-4"
                                                    >
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <span className="text-[13px] font-bold" style={{ color: C.text }}>今日の状況</span>
                                                            <span className="px-2.5 py-0.5 text-[10px] font-bold" style={{ borderRadius: R.badge, background: todayStatusBadge.bg, color: todayStatusBadge.color }}>{todayStatusBadge.label}</span>
                                                        </div>
                                                        <div className="mb-1.5 flex justify-between text-[11px]" style={{ color: C.muted }}>
                                                            <span>今日の支出</span>
                                                            <span className="tabular-nums font-semibold">{formatYen(todayTotalExpense)} / {formatYen(MOCK.dailyBudget)}</span>
                                                        </div>
                                                        <ProgressBar pct={Math.min(100, Math.round(todaySpendPct * 100))} delay={0.1} gradient={todaySpendPct <= 0.8 ? "linear-gradient(90deg, #34d399, #35b5a2)" : todaySpendPct <= 1.0 ? "linear-gradient(90deg, #f9a8d4, #e879a3)" : "linear-gradient(90deg, #fb7185, #f43f5e)"} />
                                                        <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2.5" style={{ background: savingsInsight.bg }}>
                                                            <savingsInsight.Icon size={13} style={{ color: savingsInsight.color, flexShrink: 0 }} />
                                                            <span className="text-[11px] font-semibold leading-tight" style={{ color: savingsInsight.color }}>{savingsInsight.message}</span>
                                                        </div>

                                                        {/* 今週の記録 */}
                                                        <div
                                                            data-tour="block-streak"
                                                            className="mt-3 pt-3 border-t"
                                                            style={{ borderColor: C.border }}
                                                        >
                                                            <div className="mb-2 flex items-center justify-between">
                                                                <span className="text-[13px] font-bold" style={{ color: C.text }}>今週の記録</span>
                                                                <span className="text-[11px] font-semibold tabular-nums" style={{ color: C.muted }}>{weekAchievedCount} / {weekRecordedCount}日 節約達成</span>
                                                            </div>
                                                            <div className="grid grid-cols-7 gap-1">
                                                                {MOCK.weeklyData.map((day) => {
                                                                    const TODAY_DATE = "2026-05-16"
                                                                    const isToday    = day.date === TODAY_DATE
                                                                    const isFuture   = day.date > TODAY_DATE
                                                                    const achieved   = !isFuture && day.recorded && day.expense <= MOCK.dailyBudget
                                                                    const over       = !isFuture && day.recorded && day.expense > MOCK.dailyBudget
                                                                    const unrecorded = !isFuture && !day.recorded
                                                                    const streakState: StreakState = achieved ? "achieved" : over ? "over" : unrecorded ? "unrecorded" : "future"
                                                                    const Icon  = achieved ? CheckCircle2 : over ? AlertCircle : unrecorded ? HelpCircle : MinusCircle
                                                                    const color = achieved ? C.brand : over ? "#f43f5e" : unrecorded ? "rgba(28,20,16,0.38)" : "rgba(28,20,16,0.15)"
                                                                    const tooltipContent = <StreakTooltipContent dow={day.dow} date={day.date} state={streakState} expense={day.expense} dailyBudget={MOCK.dailyBudget} />
                                                                    const [, mm, dd] = day.date.split("-")
                                                                    const dateLabel = `${parseInt(mm)}/${parseInt(dd)}(${day.dow})`
                                                                    return (
                                                                        <StreakTooltip key={day.dow} content={isFuture ? null : tooltipContent}>
                                                                            <span className="text-[8px] font-semibold leading-none tabular-nums" style={{ color: isToday ? C.brand : C.muted }}>{dateLabel}</span>
                                                                            <Icon size={22} strokeWidth={2} style={{ color }} />
                                                                        </StreakTooltip>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Slide 1: 今月の貯蓄予測 */}
                                                {carouselIdx === 1 && (
                                                    <motion.div
                                                        key="forecast"
                                                        data-tour="block-savings-forecast"
                                                        custom={carouselDir}
                                                        variants={carouselSlideVariants}
                                                        initial="enter"
                                                        animate="center"
                                                        exit="exit"
                                                        className="p-4"
                                                    >
                                                        <div className="mb-3 flex items-center justify-between">
                                                            <span className="text-[13px] font-bold" style={{ color: C.text }}>今月の貯蓄予測</span>
                                                            <span className="px-2 py-0.5 text-[10px] font-bold" style={{ borderRadius: R.badge, background: savingsBadge.bg, color: savingsBadge.color }}>{savingsBadge.label}</span>
                                                        </div>
                                                        <div className="text-[10px] font-semibold mb-0.5" style={{ color: C.muted }}>月末予測残高</div>
                                                        <div className="mb-3 flex items-baseline gap-1.5">
                                                            <span className="hero-number font-black" style={{ color: projectedSavings >= 0 ? C.income : "#f43f5e", fontSize: "clamp(1.6rem, 5vw, 2rem)", letterSpacing: "-0.03em" }}>{projectedSavings >= 0 ? "+" : "−"}{formatYen(Math.abs(projectedSavings))}</span>
                                                            <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{projectedSavings >= 0 ? "貯まる見込み" : "不足見込み"}</span>
                                                        </div>
                                                        <div className="mb-1 flex justify-between text-[10px]" style={{ color: C.muted }}>
                                                            <span>{formatYen(MOCK.monthSummary.expense)} 使用</span>
                                                            <span>目標貯蓄 {formatYen(MOCK.savingsGoal)}</span>
                                                        </div>
                                                        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(28,20,16,0.06)" }}>
                                                            <motion.div className="absolute h-full" initial={{ width: 0 }} animate={{ width: `${actualExpensePct}%` }} transition={{ ...SPRING.bar, delay: 0.1 }} style={{ background: savingsBarColor.solid, borderRadius: "9999px 0 0 9999px" }} />
                                                            <motion.div className="absolute h-full" initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100 - actualExpensePct, projectedExpensePct - actualExpensePct))}%` }} transition={{ ...SPRING.bar, delay: 0.25 }} style={{ left: `${actualExpensePct}%`, background: savingsBarColor.light }} />
                                                            <div className="absolute top-0 h-full w-0.5" style={{ left: `${targetLinePct}%`, background: "rgba(28,20,16,0.28)" }} />
                                                        </div>
                                                        <div className="mt-1 text-right text-[10px]" style={{ color: C.muted }}>{dayOfMonth}日経過 / {daysInMonth}日</div>
                                                        <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: C.border }}>
                                                            {[
                                                                { label: "残り予算",  value: formatYen(remainingBudget),                   color: remainingBudget >= 0      ? C.text : "#f43f5e" },
                                                                { label: "残り日数",  value: `あと${remainingDays}日`,                      color: C.text },
                                                                { label: "1日の目安", value: formatYen(Math.max(0, dailyRemainingBudget)), color: dailyRemainingBudget >= 0 ? C.text : "#f43f5e" },
                                                            ].map(item => (
                                                                <div key={item.label} className="text-center">
                                                                    <div className="text-[9px] font-semibold mb-0.5" style={{ color: C.muted }}>{item.label}</div>
                                                                    <div className="text-[12px] font-extrabold tabular-nums" style={{ color: item.color }}>{item.value}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {/* Slide 2: 今月のサマリー */}
                                                {carouselIdx === 2 && (() => {
                                                    const lastMonthDailyAvg  = MOCK.lastMonthExpense / 30
                                                    const thisMonthDailyAvg  = MOCK.monthSummary.expense / dayOfMonth
                                                    const momPct  = Math.round((thisMonthDailyAvg / lastMonthDailyAvg - 1) * 100)
                                                    const momSaved = momPct < 0
                                                    const sRate   = Math.round((netMonth / MOCK.monthSummary.income) * 100)
                                                    return (
                                                        <motion.div
                                                            key="summary"
                                                            data-tour="block-summary"
                                                            custom={carouselDir}
                                                            variants={carouselSlideVariants}
                                                            initial="enter"
                                                            animate="center"
                                                            exit="exit"
                                                            className="p-4 overflow-hidden"
                                                        >
                                                            <div className="mb-1 flex items-center justify-between">
                                                                <span className="text-[13px] font-bold" style={{ color: C.text }}>今月のサマリー</span>
                                                                <span className="font-mono text-[11px]" style={{ color: C.muted }}>{MOCK.monthSummary.label}</span>
                                                            </div>
                                                            <div className="mb-3 flex items-end gap-2">
                                                                <span className="hero-number text-3xl font-black" style={{ color: C.income, letterSpacing: "-0.02em" }}><SpringNumber value={netMonth} format={formatYen} /></span>
                                                                <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING.base, delay: 0.4 }} className="mb-0.5 flex items-center gap-0.5 text-xs font-semibold" style={{ color: savingsRate >= 20 ? C.income : "#f59e0b" }}><ArrowUpRight size={12} />{savingsRate}%</motion.span>
                                                            </div>
                                                            <div className="space-y-1.5 mb-3">
                                                                {[
                                                                    { label: "収入", value: formatYen(MOCK.monthSummary.income), color: C.income, icon: ArrowUpRight },
                                                                    { label: "支出", value: formatYen(MOCK.monthSummary.expense), color: C.brand, icon: ArrowDownRight },
                                                                ].map((item) => (
                                                                    <div key={item.label} className="flex items-center justify-between">
                                                                        <span className="flex items-center gap-1 text-[11px]" style={{ color: item.color }}><item.icon size={11} />{item.label}</span>
                                                                        <span className="hero-number text-[13px] font-bold tabular-nums" style={{ color: C.text }}>{item.value}</span>
                                                                    </div>
                                                                ))}
                                                                <div className="border-t pt-1.5 flex items-center justify-between" style={{ borderColor: C.border }}>
                                                                    <span className="flex items-center gap-1 text-[11px]" style={{ color: C.muted }}><Wallet size={10} />収支差</span>
                                                                    <span className="hero-number text-[13px] font-extrabold tabular-nums" style={{ color: netMonth >= 0 ? C.income : "#f43f5e" }}>{formatYenSigned(netMonth)}</span>
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <div className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5" style={{ background: momSaved ? C.incomeLight : "rgba(244,63,94,0.06)" }}>
                                                                    <span className="text-[9px] font-semibold" style={{ color: C.muted }}>先月比 支出</span>
                                                                    <span className="text-[18px] font-extrabold tabular-nums" style={{ color: momSaved ? C.income : "#f43f5e", letterSpacing: "-0.02em" }}>{momPct > 0 ? "+" : ""}{momPct}%</span>
                                                                    <span className="text-[9px]" style={{ color: C.muted }}>{momSaved ? `月換算で${formatYen(Math.round((lastMonthDailyAvg - thisMonthDailyAvg) * 30))}節約` : "先月より支出増"}</span>
                                                                </div>
                                                                <div className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5" style={{ background: C.incomeLight }}>
                                                                    <span className="text-[9px] font-semibold" style={{ color: C.muted }}>今月の貯蓄率</span>
                                                                    <span className="text-[18px] font-extrabold tabular-nums" style={{ color: C.income, letterSpacing: "-0.02em" }}>{sRate}%</span>
                                                                    <span className="text-[9px]" style={{ color: C.muted }}>収入の{sRate}%を貯蓄ペース</span>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )
                                                })()}
                                            </AnimatePresence>
                                        </motion.div>

                                        {/* ── インジケーター行: ＜ ドット ＞ ── */}
                                        <div
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 border-t"
                                            style={{ borderColor: C.border }}
                                        >
                                            {/* 前へボタン */}
                                            <motion.button
                                                type="button"
                                                onClick={() => goCarousel(carouselIdx - 1)}
                                                disabled={carouselIdx === 0}
                                                whileTap={{ scale: 0.85 }}
                                                className="flex h-6 w-6 items-center justify-center rounded-full transition-opacity disabled:opacity-25"
                                                style={{ color: C.brand }}
                                                aria-label="前のカード"
                                            >
                                                <ChevronLeft size={15} strokeWidth={2.5} />
                                            </motion.button>

                                            {/* ドットインジケーター */}
                                            {CAROUSEL_LABELS.map((label, i) => (
                                                <motion.button
                                                    key={i}
                                                    type="button"
                                                    onClick={() => { setCarouselDir(i > carouselIdx ? 1 : -1); setCarouselIdx(i) }}
                                                    aria-label={label}
                                                    aria-current={i === carouselIdx ? 'true' : undefined}
                                                    animate={{
                                                        width:      i === carouselIdx ? 20 : 6,
                                                        background: i === carouselIdx ? C.brand : 'rgba(28,20,16,0.18)',
                                                    }}
                                                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                                                    style={{ height: 6, borderRadius: 9999 }}
                                                />
                                            ))}

                                            {/* 次へボタン */}
                                            <motion.button
                                                type="button"
                                                onClick={() => goCarousel(carouselIdx + 1)}
                                                disabled={carouselIdx === CAROUSEL_COUNT - 1}
                                                whileTap={{ scale: 0.85 }}
                                                className="flex h-6 w-6 items-center justify-center rounded-full transition-opacity disabled:opacity-25"
                                                style={{ color: C.brand }}
                                                aria-label="次のカード"
                                            >
                                                <ChevronRight size={15} strokeWidth={2.5} />
                                            </motion.button>
                                        </div>
                                    </div>
                                </motion.div>

                            </>
                        )}
                        </motion.div>

                        {/* ── 右カラム: 今月の貯蓄予測・サマリー（PC のみ） ── */}
                        {isLargeScreen && (
                            <motion.div
                                className="space-y-3"
                                variants={pageContainerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {/* Block 3: 今月の貯蓄予測 */}
                                <motion.div data-tour="block-savings-forecast" variants={pageItemVariants} className="border p-4" style={{ borderRadius: R.card, background: C.card, borderColor: C.border, boxShadow: C.shadow }}>
                                    <div className="mb-3 flex items-center justify-between">
                                        <span className="text-[13px] font-bold" style={{ color: C.text }}>今月の貯蓄予測</span>
                                        <span className="px-2 py-0.5 text-[10px] font-bold" style={{ borderRadius: R.badge, background: savingsBadge.bg, color: savingsBadge.color }}>{savingsBadge.label}</span>
                                    </div>
                                    <div className="text-[10px] font-semibold mb-0.5" style={{ color: C.muted }}>月末予測残高</div>
                                    <div className="mb-3 flex items-baseline gap-1.5">
                                        <span className="hero-number font-black" style={{ color: projectedSavings >= 0 ? C.income : "#f43f5e", fontSize: "clamp(1.6rem, 5vw, 2rem)", letterSpacing: "-0.03em" }}>{projectedSavings >= 0 ? "+" : "−"}{formatYen(Math.abs(projectedSavings))}</span>
                                        <span className="text-[11px] font-semibold" style={{ color: C.muted }}>{projectedSavings >= 0 ? "貯まる見込み" : "不足見込み"}</span>
                                    </div>
                                    <div className="mb-1 flex justify-between text-[10px]" style={{ color: C.muted }}>
                                        <span>{formatYen(MOCK.monthSummary.expense)} 使用</span>
                                        <span>目標貯蓄 {formatYen(MOCK.savingsGoal)}</span>
                                    </div>
                                    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: "rgba(28,20,16,0.06)" }}>
                                        <motion.div className="absolute h-full" initial={{ width: 0 }} animate={{ width: `${actualExpensePct}%` }} transition={{ ...SPRING.bar, delay: 0.3 }} style={{ background: savingsBarColor.solid, borderRadius: "9999px 0 0 9999px" }} />
                                        <motion.div className="absolute h-full" initial={{ width: 0 }} animate={{ width: `${Math.max(0, Math.min(100 - actualExpensePct, projectedExpensePct - actualExpensePct))}%` }} transition={{ ...SPRING.bar, delay: 0.5 }} style={{ left: `${actualExpensePct}%`, background: savingsBarColor.light }} />
                                        <div className="absolute top-0 h-full w-0.5" style={{ left: `${targetLinePct}%`, background: "rgba(28,20,16,0.28)" }} />
                                    </div>
                                    <div className="mt-1 text-right text-[10px]" style={{ color: C.muted }}>{dayOfMonth}日経過 / {daysInMonth}日</div>
                                    <div className="mt-3 grid grid-cols-3 gap-2 pt-3 border-t" style={{ borderColor: C.border }}>
                                        {[
                                            { label: "残り予算",  value: formatYen(remainingBudget),                   color: remainingBudget >= 0      ? C.text : "#f43f5e" },
                                            { label: "残り日数",  value: `あと${remainingDays}日`,                      color: C.text },
                                            { label: "1日の目安", value: formatYen(Math.max(0, dailyRemainingBudget)), color: dailyRemainingBudget >= 0 ? C.text : "#f43f5e" },
                                        ].map(item => (
                                            <div key={item.label} className="text-center">
                                                <div className="text-[9px] font-semibold mb-0.5" style={{ color: C.muted }}>{item.label}</div>
                                                <div className="text-[12px] font-extrabold tabular-nums" style={{ color: item.color }}>{item.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Block 4: 今月のサマリー */}
                                {(() => {
                                    const lastMonthDailyAvg  = MOCK.lastMonthExpense / 30
                                    const thisMonthDailyAvg  = MOCK.monthSummary.expense / dayOfMonth
                                    const momPct  = Math.round((thisMonthDailyAvg / lastMonthDailyAvg - 1) * 100)
                                    const momSaved = momPct < 0
                                    const sRate   = Math.round((netMonth / MOCK.monthSummary.income) * 100)
                                    return (
                                        <motion.div data-tour="block-summary" variants={pageItemVariants} className="border p-4 overflow-hidden" style={{ borderRadius: R.card, background: C.card, borderColor: C.border, boxShadow: C.shadow }}>
                                            <div className="mb-1 flex items-center justify-between">
                                                <span className="text-[13px] font-bold" style={{ color: C.text }}>今月のサマリー</span>
                                                <span className="font-mono text-[11px]" style={{ color: C.muted }}>{MOCK.monthSummary.label}</span>
                                            </div>
                                            <div className="mb-3 flex items-end gap-2">
                                                <span className="hero-number text-3xl font-black" style={{ color: C.income, letterSpacing: "-0.02em" }}><SpringNumber value={netMonth} format={formatYen} /></span>
                                                <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ ...SPRING.base, delay: 0.6 }} className="mb-0.5 flex items-center gap-0.5 text-xs font-semibold" style={{ color: savingsRate >= 20 ? C.income : "#f59e0b" }}><ArrowUpRight size={12} />{savingsRate}%</motion.span>
                                            </div>
                                            <div className="space-y-1.5 mb-3">
                                                {[
                                                    { label: "収入", value: formatYen(MOCK.monthSummary.income), color: C.income, icon: ArrowUpRight },
                                                    { label: "支出", value: formatYen(MOCK.monthSummary.expense), color: C.brand, icon: ArrowDownRight },
                                                ].map((item) => (
                                                    <div key={item.label} className="flex items-center justify-between">
                                                        <span className="flex items-center gap-1 text-[11px]" style={{ color: item.color }}><item.icon size={11} />{item.label}</span>
                                                        <span className="hero-number text-[13px] font-bold tabular-nums" style={{ color: C.text }}>{item.value}</span>
                                                    </div>
                                                ))}
                                                <div className="border-t pt-1.5 flex items-center justify-between" style={{ borderColor: C.border }}>
                                                    <span className="flex items-center gap-1 text-[11px]" style={{ color: C.muted }}><Wallet size={10} />収支差</span>
                                                    <span className="hero-number text-[13px] font-extrabold tabular-nums" style={{ color: netMonth >= 0 ? C.income : "#f43f5e" }}>{formatYenSigned(netMonth)}</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5" style={{ background: momSaved ? C.incomeLight : "rgba(244,63,94,0.06)" }}>
                                                    <span className="text-[9px] font-semibold" style={{ color: C.muted }}>先月比 支出</span>
                                                    <span className="text-[18px] font-extrabold tabular-nums" style={{ color: momSaved ? C.income : "#f43f5e", letterSpacing: "-0.02em" }}>{momPct > 0 ? "+" : ""}{momPct}%</span>
                                                    <span className="text-[9px]" style={{ color: C.muted }}>{momSaved ? `月換算で${formatYen(Math.round((lastMonthDailyAvg - thisMonthDailyAvg) * 30))}節約` : "先月より支出増"}</span>
                                                </div>
                                                <div className="flex flex-col gap-0.5 rounded-xl px-3 py-2.5" style={{ background: C.incomeLight }}>
                                                    <span className="text-[9px] font-semibold" style={{ color: C.muted }}>今月の貯蓄率</span>
                                                    <span className="text-[18px] font-extrabold tabular-nums" style={{ color: C.income, letterSpacing: "-0.02em" }}>{sRate}%</span>
                                                    <span className="text-[9px]" style={{ color: C.muted }}>収入の{sRate}%を貯蓄ペース</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )
                                })()}
                            </motion.div>
                        )}
                    </div>

                    {/* ④ 最近の記録 — 全幅（PC/SP 共通） */}
                    <motion.div
                        data-tour="recent-records"
                        variants={pageContainerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        <div
                            className="overflow-hidden border"
                            style={{ borderRadius: R.card, background: C.card, borderColor: C.border, boxShadow: C.shadow }}
                        >
                            {/* カードヘッダー */}
                            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: C.border }}>
                                <span className="text-sm font-bold" style={{ color: C.text }}>最近の記録</span>
                                <MotionLink
                                    to="/meisai?period=all"
                                    whileTap={{ scale: 0.92 }}
                                    transition={SPRING.snap}
                                    className="flex items-center gap-0.5 text-[12px] font-semibold tap-highlight"
                                    style={{ color: C.brand, textDecoration: "none" }}
                                >
                                    すべて見る <ChevronRight size={12} />
                                </MotionLink>
                            </div>

                            {/* 日付グループ */}
                            {grouped.map((group) => (
                                <div key={group.date}>
                                    {/* 日付ヘッダー: 背景色 + 曜日付きラベル + 日計 */}
                                    <div
                                        className="flex items-center justify-between px-4 py-2"
                                        style={{
                                            background:   "rgba(28,20,16,0.03)",
                                            borderBottom: `1px solid ${C.border}`,
                                        }}
                                    >
                                        <span className="text-[12px] font-extrabold" style={{ color: C.text }}>
                                            {group.label}
                                        </span>
                                        {group.dayTotal > 0 && (
                                            <span className="text-[11px] font-semibold tabular-nums" style={{ color: C.muted }}>
                                                −¥{group.dayTotal.toLocaleString("ja-JP")}
                                            </span>
                                        )}
                                    </div>

                                    {/* アイテム */}
                                    {group.items.map((it, i) => {
                                        const isIncome = it.balanceType === 1;
                                        const acc      = categoryAccent(it.categoryName, isIncome);
                                        const Icon     = categoryIconComp(it.categoryName, isIncome);
                                        return (
                                            <motion.button
                                                key={it.id}
                                                type="button"
                                                initial={{ opacity: 0, y: 4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: i * 0.04, duration: 0.15, ease: "easeOut" }}
                                                className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                                                style={{
                                                    borderBottom: i < group.items.length - 1
                                                        ? `1px solid ${C.border}`
                                                        : "none",
                                                }}
                                            >
                                                <div
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center"
                                                    style={{ background: acc.bg, borderRadius: "9px" }}
                                                    aria-hidden
                                                >
                                                    <Icon size={14} style={{ color: acc.fg }} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="truncate text-[13px] font-semibold" style={{ color: C.text }}>
                                                        {it.content?.trim() || it.categoryName}
                                                    </div>
                                                    <div className="mt-0.5 flex items-center gap-1.5">
                                                        <span
                                                            className="inline-flex items-center px-1.5 text-[10px] font-semibold leading-[16px]"
                                                            style={{ background: acc.bg, color: acc.fg, borderRadius: "4px" }}
                                                        >
                                                            {it.categoryName}
                                                        </span>
                                                        <span className="text-[10px]" style={{ color: "rgba(28,20,16,0.22)" }}>
                                                            {it.time}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div
                                                    className="shrink-0 text-[14px] font-bold tabular-nums"
                                                    style={{ color: isIncome ? C.income : C.text, letterSpacing: "-0.01em" }}
                                                >
                                                    {isIncome ? "+" : "−"}¥{it.amount.toLocaleString("ja-JP")}
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </>
                )}
            </main>

            {/* ─── ボトムナビ（中央FAB統合 — モバイルのみ） ───────────────────── */}
            <motion.nav
                initial={{ y: 80, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ ...SPRING.smooth, delay: 0.35 }}
                className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
                style={{
                    background:     "rgba(255,253,245,0.96)",
                    backdropFilter: "blur(16px)",
                    borderTop:      `1px solid ${C.border}`,
                    paddingBottom:  "env(safe-area-inset-bottom, 0px)",
                }}
                aria-label="メインメニュー"
            >
                <div className="flex items-center h-14">
                    {/* 左2項目 */}
                    {[
                        { label: "ホーム", icon: Home,    to: "/home",   active: true  },
                        { label: "明細",   icon: Receipt, to: "/meisai", active: false },
                    ].map((item) => (
                        <Link key={item.label} to={item.to}
                            aria-current={item.active ? "page" : undefined}
                            {...(item.label === "明細" ? { "data-tour": "nav-meisai" } : {})}
                            className="flex flex-1 flex-col items-center justify-center gap-0.5 h-full tap-highlight transition-colors"
                            style={{ color: item.active ? C.brand : "rgba(28,20,16,0.40)", textDecoration: "none" }}
                        >
                            <item.icon size={20} strokeWidth={item.active ? 2.4 : 2} aria-hidden />
                            <span className="text-[10px] font-bold leading-none">{item.label}</span>
                        </Link>
                    ))}

                    {/* 中央 FAB — ナビバーから突き出る */}
                    <div className="flex flex-1 items-end justify-center pb-3">
                        <motion.button
                            type="button"
                            onClick={() => handleOpenDrawer()}
                            aria-label="記録する"
                            className="flex items-center justify-center rounded-full text-white"
                            style={{
                                width:      56,
                                height:     56,
                                background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brandDeep} 100%)`,
                                boxShadow:  "0 4px 20px rgba(241,136,64,0.45), 0 1px 4px rgba(241,136,64,0.20)",
                            }}
                            whileTap={{ scale: 0.88 }}
                            transition={{ type: "spring", stiffness: 600, damping: 35 }}
                        >
                            <Plus size={22} strokeWidth={2.5} />
                        </motion.button>
                    </div>

                    {/* 右2項目 */}
                    {[
                        { label: "レポート", icon: BarChart2, to: "/report",            active: false },
                        { label: "設定",     icon: Settings,  to: "/personal-settings", active: false },
                    ].map((item) => (
                        <Link key={item.label} to={item.to}
                            aria-current={item.active ? "page" : undefined}
                            {...(
                                item.label === "設定"     ? { "data-tour": "nav-settings" } :
                                item.label === "レポート" ? { "data-tour": "nav-report"   } :
                                {}
                            )}
                            className="flex flex-1 flex-col items-center justify-center gap-0.5 h-full tap-highlight transition-colors"
                            style={{ color: item.active ? C.brand : "rgba(28,20,16,0.40)", textDecoration: "none" }}
                        >
                            <item.icon size={20} strokeWidth={item.active ? 2.4 : 2} aria-hidden />
                            <span className="text-[10px] font-bold leading-none">{item.label}</span>
                        </Link>
                    ))}
                </div>
            </motion.nav>

            {/* ─── Drawer（支出・収入記録 — SP のみ） ────────────────────────── */}
            <Drawer.Root open={drawerOpen && !isLargeScreen} onOpenChange={setDrawerOpen}>
                <Drawer.Portal>
                    <Drawer.Overlay
                        className="fixed inset-0 z-40"
                        style={{ background: "rgba(28,20,16,0.36)", backdropFilter: "blur(4px)" }}
                    />
                    <Drawer.Content
                        className="fixed bottom-0 left-0 right-0 z-50 outline-none"
                        style={{
                            background:   C.card,
                            borderTop:    `1px solid ${C.border}`,
                            borderRadius: "22px 22px 0 0",
                            maxHeight:    "94dvh",
                            boxShadow:    "0 -8px 40px rgba(28,20,16,0.14)",
                        }}
                    >
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="h-1 w-10 rounded-full" style={{ background: "rgba(28,20,16,0.12)" }} />
                        </div>

                        <QuickEntryContent
                            variant="drawer"
                            balanceType={balanceType}
                            setBalanceType={setBalanceType}
                            amountStr={amountStr}
                            onClear={() => setAmountStr("")}
                            categoryId={categoryId}
                            setCategoryId={setCategoryId}
                            noteText={noteText}
                            setNoteText={setNoteText}
                            submitted={submitted}
                            showAllCategories={showAllCategories}
                            setShowAllCategories={setShowAllCategories}
                            visibleCategories={visibleCategories}
                            restCategories={restCategories}
                            previewRemaining={previewRemaining}
                            handleNumKey={handleNumKey}
                            handleSubmit={handleSubmit}
                        />
                    </Drawer.Content>
                </Drawer.Portal>
            </Drawer.Root>

            {/* ─── PC モーダル（lg 以上、Drawer の代替） ──────────────────────
             *  本実装 apps/web/src/components/ui/dialog.tsx のスタイルを踏襲:
             *  - fixed left-1/2 top-1/2 / -translate-x/y-1/2
             *  - rounded-2xl, border-2 border-[#1c1410]/10, bg-white, shadow-lg
             *  - black/50 オーバーレイ + backdropFilter blur
             */}
            <AnimatePresence>
                {drawerOpen && isLargeScreen && (
                    <>
                        {/* オーバーレイ */}
                        <motion.div
                            className="fixed inset-0 z-40"
                            style={{ background: "rgba(28,20,16,0.50)", backdropFilter: "blur(4px)" }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={handleModalCloseRequest}
                        />
                        {/* モーダルパネル */}
                        <motion.div
                            role="dialog"
                            aria-modal="true"
                            aria-label="支出・収入を記録"
                            className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full overflow-y-auto"
                            style={{
                                maxWidth:     "min(52rem, calc(100% - 2rem))",
                                maxHeight:    "90dvh",
                                borderRadius: "1.25rem",
                                border:       "2px solid rgba(28,20,16,0.10)",
                                background:   C.card,
                                boxShadow:    "0 8px 48px rgba(28,20,16,0.18)",
                            }}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.96 }}
                            transition={SPRING.quick}
                        >
                            {/* モーダルヘッダー */}
                            <div
                                className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4"
                                style={{
                                    borderColor:  C.border,
                                    background:   C.card,
                                    borderRadius: "1.25rem 1.25rem 0 0",
                                }}
                            >
                                <span className="text-[15px] font-bold" style={{ color: C.text }}>
                                    支出・収入を記録
                                </span>
                                <motion.button
                                    type="button"
                                    onClick={handleModalCloseRequest}
                                    whileTap={{ scale: 0.82 }}
                                    transition={SPRING.snap}
                                    className="flex h-7 w-7 items-center justify-center rounded-lg opacity-60 transition-opacity hover:opacity-100"
                                    style={{ color: C.text }}
                                    aria-label="閉じる"
                                >
                                    <X size={15} />
                                </motion.button>
                            </div>
                            {/* フォームコンテンツ（Drawer と共通） */}
                            <div className="pt-4 pb-6">
                                <QuickEntryContent
                                    variant="modal"
                                    balanceType={balanceType}
                                    setBalanceType={setBalanceType}
                                    amountStr={amountStr}
                                    onClear={() => setAmountStr("")}
                                    categoryId={categoryId}
                                    setCategoryId={setCategoryId}
                                    noteText={noteText}
                                    setNoteText={setNoteText}
                                    submitted={submitted}
                                    showAllCategories={showAllCategories}
                                    setShowAllCategories={setShowAllCategories}
                                    visibleCategories={visibleCategories}
                                    restCategories={restCategories}
                                    previewRemaining={previewRemaining}
                                    handleNumKey={handleNumKey}
                                    handleSubmit={handleSubmit}
                                />
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ─── 入力破棄確認ダイアログ（PC モーダル専用）────────────────── */}
            <AnimatePresence>
                {showCloseConfirm && (
                    <motion.div
                        className="fixed inset-0 z-[60] flex items-center justify-center"
                        style={{ background: "rgba(28,20,16,0.46)", backdropFilter: "blur(6px)" }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            role="alertdialog"
                            aria-modal="true"
                            aria-labelledby="close-confirm-title"
                            aria-describedby="close-confirm-desc"
                            className="w-full mx-4 overflow-hidden"
                            style={{
                                maxWidth:     "22rem",
                                borderRadius: R.card,
                                background:   C.card,
                                border:       `1px solid ${C.border}`,
                                boxShadow:    C.shadowMd,
                            }}
                            initial={{ opacity: 0, scale: 0.94 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.94 }}
                            transition={SPRING.quick}
                        >
                            <div className="px-5 py-5">
                                <div id="close-confirm-title" className="text-[15px] font-bold mb-1" style={{ color: C.text }}>
                                    入力を破棄して閉じますか？
                                </div>
                                <div id="close-confirm-desc" className="text-[13px]" style={{ color: C.muted }}>
                                    入力中のデータは保存されません。
                                </div>
                            </div>
                            <div className="flex border-t" style={{ borderColor: C.border }}>
                                <button
                                    type="button"
                                    className="flex-1 py-3 text-[14px] font-semibold border-r transition-colors hover:bg-black/[0.02]"
                                    style={{ color: C.muted, borderColor: C.border }}
                                    onClick={() => setShowCloseConfirm(false)}
                                >
                                    キャンセル
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 py-3 text-[14px] font-bold transition-colors hover:bg-red-50"
                                    style={{ color: "#ef4444" }}
                                    onClick={handleModalForceClose}
                                >
                                    破棄して閉じる
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
        {/* ─── PC 専用 FAB（lg 以上のみ表示） ─────────────────────────────── */}
        <motion.button
            type="button"
            aria-label="記録する"
            onClick={() => handleOpenDrawer()}
            className="fixed bottom-6 right-16 z-40 hidden lg:flex items-center gap-2 rounded-full px-5 text-sm font-bold text-white"
            style={{
                height:     48,
                background: `linear-gradient(135deg, ${C.brand} 0%, ${C.brandDeep} 100%)`,
                boxShadow:  "0 4px 20px rgba(241,136,64,0.40), 0 1px 4px rgba(241,136,64,0.18)",
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.93 }}
            transition={SPRING.snap}
        >
            <Plus size={17} strokeWidth={2.5} />
            記録する
        </motion.button>
        <HomeTour />
        </TooltipPrimitive.Provider>
    );
}
