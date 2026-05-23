/**
 * PersonalSettingsEPrototype — コンパクトリスト + ステッパー型
 * フラットなセクション形式に刷新。カード・ボーダー廃止 → 余白のみで分離。
 * +/− ボタン + 直接入力フォームを組み合わせ。
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check,
  TrendingUp,
  Home,
  Zap,
  Car,
  ShoppingBag,
  Wallet,
  Heart,
  Bell,
  Calendar,
  BarChart2,
  Settings,
  PiggyBank,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

// ─── Spring プリセット ───────────────────────────────────────────────────────
const SPRING = {
  SNAP:   { type: 'spring', stiffness: 600, damping: 35 },
  QUICK:  { type: 'spring', stiffness: 400, damping: 30 },
  BASE:   { type: 'spring', stiffness: 300, damping: 28 },
  SMOOTH: { type: 'spring', stiffness: 200, damping: 26 },
} as const

// ─── デザイントークン ─────────────────────────────────────────────────────────
const D = {
  bg:          '#fffdf5',
  card:        '#ffffff',
  text:        '#1c1410',
  muted:       'rgba(28,20,16,0.45)',
  mutedLight:  'rgba(28,20,16,0.22)',
  border:      'rgba(28,20,16,0.07)',
  brand:       '#f18840',
  brandDeep:   '#e8622a',
  brandLight:  '#fff6ee',
  income:      '#35b5a2',
  incomeLight: '#ecfaf8',
  danger:      '#f43f5e',
  caution:     '#f59e0b',
  surface:     '#f0ede8',
} as const

// ─── 初期状態 ─────────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  salaryDay:      25,
  monthlyIncome:  252600,
  fixedCosts: {
    rent:         { label: '家賃',         icon: Home,        value: 85000, step: 1000 },
    utilities:    { label: '光熱費',       icon: Zap,         value: 12000, step: 1000 },
    insurance:    { label: '保険料',       icon: Heart,       value:  8000, step:  500 },
    subscription: { label: 'サブスク',     icon: ShoppingBag, value:  5000, step:  500 },
    transport:    { label: '交通費',       icon: Car,         value: 11000, step: 1000 },
    other:        { label: 'その他固定費', icon: Wallet,      value: 10000, step: 1000 },
  },
  currentBalance: 999853,
  savingsMode:    'monthly' as 'monthly' | 'yearly',
  savingsMonthly: 30000,
  savingsYearly:  360000,
}
type FixedKey = keyof typeof INITIAL_STATE.fixedCosts
type State    = typeof INITIAL_STATE

function calcTotalFixed(s: State) {
  return Object.values(s.fixedCosts).reduce((a, b) => a + b.value, 0)
}
function calcMonthlySavings(s: State) {
  return s.savingsMode === 'monthly' ? s.savingsMonthly : Math.round(s.savingsYearly / 12)
}
function calcDailyBudget(s: State) {
  return Math.max(0, Math.floor((s.monthlyIncome - calcTotalFixed(s) - calcMonthlySavings(s)) / 30))
}

// ─── ナビゲーション ──────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'ホーム',     icon: Home,     to: '/home',              active: false },
  { label: 'カレンダー', icon: Calendar,  to: '/home',              active: false },
  { label: 'レポート',   icon: BarChart2, to: '/asset-outlook-ab',  active: false },
  { label: '設定',       icon: Settings,  to: '/personal-settings', active: true  },
] as const

// < > ボタンで素早く切り替えられるよくある給料日
const COMMON_DAYS = [1, 5, 10, 15, 20, 21, 25, 28, 31] as const
// 1〜31 を 7列グリッドに並べる（35マス分、空マスは null）
const DAY_CELLS = Array.from({ length: 35 }, (_, i) => (i < 31 ? i + 1 : null))

// ─── Section ──────────────────────────────────────────────────────────────────
// セクションタイトル。カードなし・余白のみで構造化
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-8 first:mt-0">
      <p className="mb-2 text-[13px] font-extrabold"
        style={{ color: 'rgba(28,20,16,0.65)' }}>
        {title}
      </p>
      <div>{children}</div>
    </div>
  )
}

// ─── StepperRow ───────────────────────────────────────────────────────────────
// − ボタン + 直接入力フィールド + ＋ ボタン
function StepperRow({
  icon: Icon,
  label,
  value,
  onChange,
  step = 1000,
  suffix,
}: {
  icon: React.ElementType
  label: string
  value: number
  onChange: (v: number) => void
  step?: number
  suffix?: string
}) {
  const [focused,  setFocused]  = useState(false)
  const [inputVal, setInputVal] = useState('')

  function handleFocus() {
    setFocused(true)
    setInputVal(value.toString())
  }

  function handleBlur() {
    setFocused(false)
    const n = parseInt(inputVal.replace(/[^0-9]/g, ''), 10)
    if (!isNaN(n) && n >= 0) onChange(n)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') e.currentTarget.blur()
  }

  return (
    <div className="flex items-center gap-3 py-3">
      <Icon size={15} style={{ color: D.mutedLight }} className="shrink-0" />
      <span className="flex-1 text-[14px] font-medium" style={{ color: D.text }}>{label}</span>

      <div className="flex items-center gap-1.5">
        {/* − ボタン */}
        <motion.button
          whileTap={{ scale: 0.80 }}
          transition={SPRING.SNAP}
          onClick={() => onChange(Math.max(0, value - step))}
          className="h-7 w-7 rounded-full flex items-center justify-center text-base font-bold select-none"
          style={{ background: D.surface, color: D.muted }}
          aria-label={`${label}を減らす`}
        >−</motion.button>

        {/* 直接入力フィールド */}
        <div
          className="flex items-baseline gap-0.5 rounded-lg px-2.5 py-1.5 transition-all"
          style={{
            background:  focused ? D.brandLight : D.surface,
            border:      `1.5px solid ${focused ? D.brand : 'transparent'}`,
            minWidth:    96,
          }}
        >
          <span className="text-[11px] font-semibold" style={{ color: focused ? D.brand : D.muted }}>¥</span>
          <input
            type="text"
            inputMode="numeric"
            value={focused ? inputVal : value.toLocaleString('ja-JP')}
            onChange={e => setInputVal(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="bg-transparent outline-none text-right font-bold tabular-nums w-[68px]"
            style={{
              color:    focused ? D.brand : D.text,
              fontSize: 13,
            }}
            aria-label={label}
          />
          {suffix && (
            <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: D.muted }}>
              {suffix}
            </span>
          )}
        </div>

        {/* + ボタン */}
        <motion.button
          whileTap={{ scale: 0.80 }}
          transition={SPRING.SNAP}
          onClick={() => onChange(value + step)}
          className="h-7 w-7 rounded-full flex items-center justify-center text-base font-bold select-none"
          style={{ background: D.surface, color: D.muted }}
          aria-label={`${label}を増やす`}
        >+</motion.button>
      </div>
    </div>
  )
}

// ─── DayPickerRow ─────────────────────────────────────────────────────────────
// 給料日:
//   < > ボタン → COMMON_DAYS をステップ移動（よくある日を素早く選択）
//   日付ボタン → クリックで 1〜31 グリッドを表示（自由選択）
function DayPickerRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // クリック外で閉じる
  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  // < > はよくある給料日を前後にジャンプ
  const prevCommon = COMMON_DAYS.filter(d => d < value)
  const nextCommon = COMMON_DAYS.filter(d => d > value)
  const canPrev    = prevCommon.length > 0
  const canNext    = nextCommon.length > 0

  return (
    <div ref={containerRef} className="relative flex items-center gap-3 py-3">
      <TrendingUp size={15} style={{ color: D.mutedLight }} className="shrink-0" />
      <span className="flex-1 text-[14px] font-medium" style={{ color: D.text }}>給料日</span>

      <div className="flex items-center gap-1.5">
        {/* 前の共通日 */}
        <motion.button
          whileTap={{ scale: 0.80 }}
          transition={SPRING.SNAP}
          onClick={() => canPrev && onChange(prevCommon[prevCommon.length - 1])}
          disabled={!canPrev}
          className="h-7 w-7 rounded-full flex items-center justify-center"
          style={{ background: D.surface, color: canPrev ? D.muted : D.border }}
          aria-label="前のよくある給料日"
        >
          <ChevronLeft size={14} />
        </motion.button>

        {/* 現在値 — クリックでグリッドを開く */}
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-bold text-[13px] tabular-nums transition-all"
          style={{
            background: open ? D.brandLight : D.surface,
            border:     `1.5px solid ${open ? D.brand : 'transparent'}`,
            color:      open ? D.brand : D.text,
            minWidth:   56,
            justifyContent: 'center',
          }}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label="給料日を選択（1〜31）"
        >
          {value}日
          <ChevronDown size={11} style={{
            transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
            opacity:    0.5,
          }} />
        </button>

        {/* 次の共通日 */}
        <motion.button
          whileTap={{ scale: 0.80 }}
          transition={SPRING.SNAP}
          onClick={() => canNext && onChange(nextCommon[0])}
          disabled={!canNext}
          className="h-7 w-7 rounded-full flex items-center justify-center"
          style={{ background: D.surface, color: canNext ? D.muted : D.border }}
          aria-label="次のよくある給料日"
        >
          <ChevronRight size={14} />
        </motion.button>
      </div>

      {/* 1〜31 グリッド ドロップダウン */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-0 top-full z-50 mt-1.5 rounded-2xl p-2"
            style={{
              background: D.card,
              border:     `1px solid ${D.border}`,
              boxShadow:  '0 8px 24px rgba(28,20,16,0.14)',
              minWidth:   228,
            }}
            initial={{ opacity: 0, scale: 0.94, y: -6 }}
            animate={{ opacity: 1, scale: 1,    y:  0 }}
            exit={{    opacity: 0, scale: 0.94, y: -6 }}
            transition={SPRING.SNAP}
            role="listbox"
            aria-label="給料日を選択"
          >
            <p className="px-1 pb-1.5 text-[10px] font-bold" style={{ color: D.mutedLight }}>
              日付を選択（1〜31日）
            </p>
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_CELLS.map((d, i) =>
                d === null ? (
                  <div key={`empty-${i}`} className="h-8 w-8" />
                ) : (
                  <motion.button
                    key={d}
                    whileTap={{ scale: 0.85 }}
                    transition={SPRING.SNAP}
                    onClick={() => { onChange(d); setOpen(false) }}
                    role="option"
                    aria-selected={d === value}
                    className="h-8 w-8 rounded-lg text-[12px] font-bold flex items-center justify-center transition-colors"
                    style={{
                      // よくある日は薄くハイライト、選択中は brand color
                      background: d === value
                        ? D.brand
                        : COMMON_DAYS.includes(d as typeof COMMON_DAYS[number])
                          ? 'rgba(241,136,64,0.08)'
                          : 'transparent',
                      color: d === value ? '#fff' : D.text,
                    }}
                  >
                    {d}
                  </motion.button>
                )
              )}
            </div>
            {/* よくある日の凡例 */}
            <div className="flex items-center gap-1.5 mt-2 px-1">
              <span className="h-2 w-2 rounded-sm shrink-0"
                style={{ background: 'rgba(241,136,64,0.15)' }} />
              <span className="text-[9px] font-semibold" style={{ color: D.mutedLight }}>
                よくある給料日
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── メインコンポーネント ──────────────────────────────────────────────────────
export function PersonalSettingsEPrototype() {
  const [state, setState] = useState<State>(INITIAL_STATE)
  const [showToast, setShowToast] = useState(false)

  const totalFixed     = calcTotalFixed(state)
  const monthlySavings = calcMonthlySavings(state)
  const dailyBudget    = calcDailyBudget(state)
  const disposable     = state.monthlyIncome - totalFixed - monthlySavings

  const budgetColor =
    dailyBudget <= 0    ? D.danger :
    dailyBudget < 2000  ? D.caution : D.income

  const fixedRatio   = Math.min(1, totalFixed / Math.max(1, state.monthlyIncome))
  const savingsRatio = Math.min(1 - fixedRatio, monthlySavings / Math.max(1, state.monthlyIncome))
  const freeRatio    = Math.max(0, 1 - fixedRatio - savingsRatio)

  function handleSave() {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 2500)
  }

  function updateFixed(key: FixedKey, value: number) {
    setState(s => ({
      ...s,
      fixedCosts: { ...s.fixedCosts, [key]: { ...s.fixedCosts[key], value } },
    }))
  }

  const fixedEntries = Object.entries(state.fixedCosts) as [FixedKey, State['fixedCosts'][FixedKey]][]

  const savingsValue = state.savingsMode === 'monthly' ? state.savingsMonthly : state.savingsYearly
  const savingsStep  = state.savingsMode === 'monthly' ? 5000 : 60000

  return (
    <div className="min-h-screen pb-28 lg:pb-8" style={{ background: D.bg }}>

      {/* ─── ヘッダー ──────────────────────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING.BASE}
        className="sticky top-0 z-30 flex h-14 items-center justify-between border-b px-4 md:px-6"
        style={{
          background:     'rgba(255,253,245,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor:    D.border,
        }}
      >
        <div className="flex items-center gap-2.5">
          <img src="/logo192.png" alt="家計かんり" className="h-8 w-8 shrink-0" style={{ borderRadius: '10px' }} />
          <span className="font-extrabold text-[15px]" style={{ color: D.text }}>家計かんり</span>
        </div>

        <nav className="hidden md:flex items-center gap-1" aria-label="メインナビ">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={item.active ? 'page' : undefined}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ color: item.active ? D.brand : D.muted, background: item.active ? D.brandLight : 'transparent' }}
            >
              <item.icon size={15} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            className="h-9 w-9 flex items-center justify-center rounded-full"
            style={{ background: D.surface }}
            aria-label="通知"
          >
            <Bell size={16} style={{ color: D.muted }} />
          </button>
          <Link
            to="/my-page"
            className="h-9 w-9 flex items-center justify-center rounded-full font-bold text-sm text-white"
            style={{ background: D.brand }}
            aria-label="マイページ"
          >
            Y
          </Link>
        </div>
      </motion.header>

      {/* ─── スティッキー プレビューバー ─────────────────────────────────────── */}
      <div
        className="sticky top-14 z-10 border-b px-4 py-2.5"
        style={{
          background:     'rgba(255,253,245,0.95)',
          backdropFilter: 'blur(10px)',
          borderColor:    D.border,
        }}
      >
        <div className="mx-auto max-w-5xl flex items-center gap-4">
          <div className="shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: D.muted }}>1日予算</div>
            <motion.div
              key={dailyBudget}
              className="text-lg font-extrabold tabular-nums"
              style={{ color: budgetColor }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={SPRING.QUICK}
              aria-live="polite"
            >
              ¥{dailyBudget.toLocaleString('ja-JP')}
            </motion.div>
          </div>

          {/* 配分バー + 凡例 */}
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="flex h-2 overflow-hidden rounded-full gap-0.5">
              <motion.div style={{ background: D.danger }}
                animate={{ width: `${fixedRatio * 100}%` }}
                transition={SPRING.SMOOTH} className="rounded-full" />
              <motion.div style={{ background: D.income }}
                animate={{ width: `${savingsRatio * 100}%` }}
                transition={SPRING.SMOOTH} className="rounded-full" />
              <motion.div style={{ background: D.brand }}
                animate={{ width: `${freeRatio * 100}%` }}
                transition={SPRING.SMOOTH} className="rounded-full" />
            </div>
            <div className="flex items-center gap-3">
              {([
                { color: D.danger, label: '固定費' },
                { color: D.income, label: '貯蓄' },
                { color: D.brand,  label: '自由費' },
              ] as const).map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-[9px] font-semibold" style={{ color: D.muted }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="shrink-0 text-right">
            <div className="text-[10px] font-bold uppercase tracking-wide" style={{ color: D.muted }}>使える額</div>
            <div className="text-sm font-bold tabular-nums" style={{ color: disposable >= 0 ? D.income : D.danger }}>
              ¥{Math.abs(disposable).toLocaleString('ja-JP')}
            </div>
          </div>
        </div>
      </div>

      {/* ─── メインコンテンツ ───────────────────────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-4 pb-4 md:px-8">

        {/* PC: 2カラム / SP: 1カラム */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 lg:items-start">

          {/* 左列: 給与 + 固定費 */}
          <div>
            <Section title="給与">
              <DayPickerRow
                value={state.salaryDay}
                onChange={v => setState(s => ({ ...s, salaryDay: v }))}
              />
              <StepperRow
                icon={TrendingUp}
                label="月収（手取り）"
                value={state.monthlyIncome}
                onChange={v => setState(s => ({ ...s, monthlyIncome: v }))}
                step={10000}
              />
            </Section>

            <Section title="固定費">
              {fixedEntries.map(([key, cfg]) => (
                <StepperRow
                  key={key}
                  icon={cfg.icon}
                  label={cfg.label}
                  value={cfg.value}
                  onChange={v => updateFixed(key, v)}
                  step={cfg.step}
                />
              ))}
              {/* 合計 */}
              <div className="flex items-center justify-between pt-2 mt-1"
                style={{ borderTop: `1px solid ${D.border}` }}>
                <span className="text-[12px] font-semibold" style={{ color: D.muted }}>合計</span>
                <motion.span
                  key={totalFixed}
                  className="tabular-nums font-extrabold text-[13px]"
                  style={{ color: D.text }}
                  initial={{ scale: 0.94 }}
                  animate={{ scale: 1 }}
                  transition={SPRING.QUICK}
                >
                  ¥{totalFixed.toLocaleString('ja-JP')}
                </motion.span>
              </div>
            </Section>
          </div>

          {/* 右列: 残高 + 貯蓄目標 */}
          <div>
            <Section title="残高">
              <StepperRow
                icon={Wallet}
                label="口座残高"
                value={state.currentBalance}
                onChange={v => setState(s => ({ ...s, currentBalance: v }))}
                step={10000}
              />
            </Section>

            <Section title="貯蓄目標">
              {/* 目標の単位 — ラジオピル */}
              <div className="flex items-center gap-3 py-3">
                <PiggyBank size={15} style={{ color: D.mutedLight }} className="shrink-0" />
                <span className="flex-1 text-[14px] font-medium" style={{ color: D.text }}>目標の単位</span>
                <div className="flex gap-2" role="radiogroup" aria-label="目標の単位">
                  {([
                    { mode: 'monthly' as const, label: '月額' },
                    { mode: 'yearly'  as const, label: '年額' },
                  ]).map(({ mode, label }) => {
                    const selected = state.savingsMode === mode
                    return (
                      <button
                        key={mode}
                        role="radio"
                        aria-checked={selected}
                        onClick={() => setState(s => ({ ...s, savingsMode: mode }))}
                        className="rounded-full px-3.5 py-1.5 text-[12px] font-bold transition-all"
                        style={{
                          background: selected ? D.brand : 'transparent',
                          color:      selected ? '#fff' : D.muted,
                          border:     `1.5px solid ${selected ? D.brand : D.border}`,
                        }}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 目標額 */}
              <StepperRow
                icon={PiggyBank}
                label="目標額"
                value={savingsValue}
                onChange={v => setState(s => ({
                  ...s,
                  savingsMonthly: s.savingsMode === 'monthly' ? v : s.savingsMonthly,
                  savingsYearly:  s.savingsMode === 'yearly'  ? v : s.savingsYearly,
                }))}
                step={savingsStep}
                suffix={state.savingsMode === 'monthly' ? '/ 月' : '/ 年'}
              />

              {/* 換算ヒント */}
              {savingsValue > 0 && (
                <p className="pb-1 text-[11px] font-medium" style={{ color: D.income }}>
                  {state.savingsMode === 'monthly'
                    ? `≈ ¥${(state.savingsMonthly * 12).toLocaleString('ja-JP')} / 年`
                    : `≈ ¥${Math.round(state.savingsYearly / 12).toLocaleString('ja-JP')} / 月`
                  }
                </p>
              )}
            </Section>
          </div>

        </div>{/* /grid */}

        {/* 保存ボタン */}
        <motion.button
          onClick={handleSave}
          whileTap={{ scale: 0.97 }}
          transition={SPRING.SNAP}
          className="mt-8 w-full rounded-2xl py-4 text-sm font-extrabold text-white"
          style={{ background: D.brand, boxShadow: `0 4px 16px ${D.brand}40` }}
        >
          設定を保存する
        </motion.button>
      </main>

      {/* ─── ボトムナビ ──────────────────────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-4 h-14 lg:hidden border-t"
        style={{
          background:     'rgba(255,253,245,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor:    D.border,
          paddingBottom:  'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="ボトムナビ"
      >
        {NAV_ITEMS.map(item => (
          <Link
            key={item.to}
            to={item.to}
            aria-current={item.active ? 'page' : undefined}
            className="flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold"
            style={{ color: item.active ? D.brand : D.muted }}
          >
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* ─── トースト ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={SPRING.QUICK}
            className="fixed bottom-24 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold text-white shadow-lg"
            style={{ background: D.income }}
          >
            <Check size={16} />
            設定を保存しました
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
