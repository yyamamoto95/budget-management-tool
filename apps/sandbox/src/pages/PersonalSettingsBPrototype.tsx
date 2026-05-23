/**
 * PersonalSettingsBPrototype — ウィザード型
 * 5ステップのリニアウィザード形式。
 * ステップ: 0=給与, 1=固定費, 2=残高, 3=貯蓄目標, 4=確認・保存
 * ステップ間はframer-motionでスライドアニメーション。
 * 各ステップの下部にナビゲーションボタン（戻る/次へ）を配置。
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
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
} from 'lucide-react'

// ─── デザイントークン ─────────────────────────────────────────────────────
const D = {
  bg:          '#fffdf5',
  card:        '#ffffff',
  text:        '#1c1410',
  muted:       'rgba(28,20,16,0.45)',
  border:      'rgba(28,20,16,0.08)',
  borderStrong:'rgba(28,20,16,0.14)',
  shadow:      '0 2px 12px rgba(28,20,16,0.08), 0 0 0 1px rgba(28,20,16,0.06)',
  brand:       '#f18840',
  brandDeep:   '#e8622a',
  brandLight:  '#fff6ee',
  income:      '#35b5a2',
  incomeLight: '#ecfaf8',
  danger:      '#f43f5e',
  caution:     '#f59e0b',
  surface:     '#f5f3ef',
} as const

// ─── Spring プリセット ───────────────────────────────────────────────────
const SPRING = {
  SNAP:   { type: 'spring', stiffness: 600, damping: 35 },
  QUICK:  { type: 'spring', stiffness: 400, damping: 30 },
  BASE:   { type: 'spring', stiffness: 300, damping: 28 },
  SMOOTH: { type: 'spring', stiffness: 200, damping: 26 },
} as const

// ─── 初期状態 ─────────────────────────────────────────────────────────────
const INITIAL_STATE = {
  salaryDay:      25,
  monthlyIncome:  252600,
  fixedCosts: {
    rent:         { label: '家賃',         icon: Home,       value: 85000, step: 1000 },
    utilities:    { label: '光熱費',       icon: Zap,        value: 12000, step: 1000 },
    insurance:    { label: '保険料',       icon: Heart,      value:  8000, step:  500 },
    subscription: { label: 'サブスク',     icon: ShoppingBag,value:  5000, step:  500 },
    transport:    { label: '交通費',       icon: Car,        value: 11000, step: 1000 },
    other:        { label: 'その他固定費', icon: Wallet,     value: 10000, step: 1000 },
  },
  currentBalance: 999853,
  savingsMode:    'monthly' as 'monthly' | 'yearly',
  savingsMonthly: 30000,
  savingsYearly:  360000,
}

type FixedKey = keyof typeof INITIAL_STATE.fixedCosts
type State    = typeof INITIAL_STATE

function calcTotalFixed(state: State) {
  return Object.values(state.fixedCosts).reduce((a, b) => a + b.value, 0)
}

function calcMonthlySavings(state: State) {
  return state.savingsMode === 'monthly' ? state.savingsMonthly : Math.round(state.savingsYearly / 12)
}

function calcDailyBudget(state: State) {
  const disposable = state.monthlyIncome - calcTotalFixed(state) - calcMonthlySavings(state)
  return Math.max(0, Math.floor(disposable / 30))
}

// ─── ナビ定義 ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'ホーム',     icon: Home,     to: '/home',              active: false },
  { label: 'カレンダー', icon: Calendar,  to: '/home',              active: false },
  { label: 'レポート',   icon: BarChart2, to: '/asset-outlook-ab',  active: false },
  { label: '設定',       icon: Settings,  to: '/personal-settings', active: true  },
] as const

// ─── 数値入力行 ───────────────────────────────────────────────────────────
function NumberRow({
  label,
  icon: Icon,
  value,
  onChange,
  step = 1000,
  suffix,
}: {
  label: string
  icon: React.ElementType
  value: number
  onChange: (v: number) => void
  step?: number
  suffix?: string
}) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState('')

  function startEdit() {
    setDraft(value.toString())
    setEditing(true)
  }

  function commitEdit() {
    const n = parseInt(draft, 10)
    if (!isNaN(n) && n >= 0) onChange(n)
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-3 py-3.5">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: D.surface }}
      >
        <Icon size={16} style={{ color: D.brand }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold mb-0.5" style={{ color: D.muted }}>{label}</div>
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-sm" style={{ color: D.muted }}>¥</span>
            <input
              autoFocus
              type="number"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="w-32 font-bold outline-none border-b-2 bg-transparent tabular-nums"
              style={{ fontSize: '16px', color: D.text, borderColor: D.brand }}
              step={step}
              min={0}
            />
            {suffix && <span className="text-sm ml-1" style={{ color: D.muted }}>{suffix}</span>}
          </div>
        ) : (
          <motion.button
            className="flex items-center gap-1"
            onClick={startEdit}
            whileTap={{ scale: 0.97 }}
            transition={SPRING.SNAP}
          >
            <span className="text-sm font-extrabold tabular-nums" style={{ color: D.text }}>
              ¥{value.toLocaleString('ja-JP')}
            </span>
            {suffix && <span className="text-xs ml-0.5" style={{ color: D.muted }}>{suffix}</span>}
            <ChevronRight size={12} style={{ color: D.muted }} />
          </motion.button>
        )}
      </div>
    </div>
  )
}

// ─── 給料日ピッカー ───────────────────────────────────────────────────────
const SALARY_DAYS = [1, 5, 10, 15, 20, 21, 25, 28, 31]

function DayPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="py-3.5">
      <div className="text-[11px] font-semibold mb-2.5" style={{ color: D.muted }}>給料日</div>
      <div className="flex flex-wrap gap-2">
        {SALARY_DAYS.map((d) => (
          <motion.button
            key={d}
            className="relative h-10 w-10 rounded-2xl text-sm font-bold"
            style={{
              background: value === d ? D.brand : D.surface,
              color:      value === d ? '#fff'  : D.text,
              boxShadow:  value === d ? `0 4px 12px ${D.brand}40` : 'none',
            }}
            onClick={() => onChange(d)}
            whileTap={{ scale: 0.88 }}
            transition={SPRING.SNAP}
            aria-pressed={value === d}
          >
            {d}
          </motion.button>
        ))}
        <div className="self-center text-xs" style={{ color: D.muted }}>日</div>
      </div>
    </div>
  )
}

// ─── トースト ─────────────────────────────────────────────────────────────
function Toast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-sm font-bold text-white z-50 whitespace-nowrap"
          style={{
            background: D.income,
            boxShadow:  `0 8px 24px ${D.income}50`,
            bottom:     'calc(5rem + env(safe-area-inset-bottom, 0px))',
          }}
          initial={{ opacity: 0, y: 20, scale: 0.88 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={   { opacity: 0, y:  8, scale: 0.94 }}
          transition={SPRING.SNAP}
          role="status"
          aria-live="polite"
        >
          <Check size={16} aria-hidden />
          設定を保存しました
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── ステップインジケーター ───────────────────────────────────────────────
const STEP_LABELS = ['給与', '固定費', '残高', '貯蓄', '確認'] as const

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6" role="list" aria-label="ステップ進捗">
      {STEP_LABELS.map((label, i) => {
        const isDone    = i < currentStep
        const isCurrent = i === currentStep
        const color     = isDone ? D.income : isCurrent ? D.brand : D.muted

        return (
          <div key={label} className="flex items-center" role="listitem">
            {/* ステップ番号 + ラベル */}
            <div className="flex flex-col items-center" aria-current={isCurrent ? 'step' : undefined}>
              <motion.div
                className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-extrabold"
                style={{
                  background: isDone ? D.income : isCurrent ? D.brand : D.surface,
                  color:      isDone || isCurrent ? '#fff' : D.muted,
                  boxShadow:  isCurrent ? `0 4px 12px ${D.brand}40` : 'none',
                }}
                animate={{ scale: isCurrent ? 1.1 : 1 }}
                transition={SPRING.QUICK}
              >
                {isDone ? <Check size={12} /> : i + 1}
              </motion.div>
              <span
                className="text-[9px] font-bold mt-0.5 whitespace-nowrap"
                style={{ color }}
              >
                {label}
              </span>
            </div>

            {/* コネクター */}
            {i < STEP_LABELS.length - 1 && (
              <div
                className="h-0.5 w-6 mb-4 mx-0.5"
                style={{ background: i < currentStep ? D.income : D.border }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── ミニプレビュー ───────────────────────────────────────────────────────
function MiniPreview({ state, label = '1日予算（暫定）' }: { state: State; label?: string }) {
  const dailyBudget = calcDailyBudget(state)
  const budgetColor = dailyBudget >= 3000 ? D.income : dailyBudget >= 1000 ? D.caution : D.danger

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-2.5 mt-4"
      style={{ background: D.brandLight, border: `1px solid ${D.brand}30` }}
    >
      <span className="text-[11px] font-semibold" style={{ color: D.brand }}>{label}</span>
      <motion.span
        className="text-base font-extrabold tabular-nums"
        style={{ color: budgetColor }}
        key={dailyBudget}
        initial={{ scale: 0.92, opacity: 0.7 }}
        animate={{ scale: 1,    opacity: 1   }}
        transition={SPRING.QUICK}
        aria-live="polite"
        aria-atomic="true"
      >
        ¥{dailyBudget.toLocaleString('ja-JP')} / 日
      </motion.span>
    </div>
  )
}

// ─── メインページ ─────────────────────────────────────────────────────────
export function PersonalSettingsBPrototype() {
  const [state, setState]   = useState<State>(INITIAL_STATE)
  const [saved, setSaved]   = useState(false)
  const [step, setStep]     = useState(0)
  const [direction, setDirection] = useState(1) // +1 = 前進, -1 = 後退

  const totalFixed     = calcTotalFixed(state)
  const monthlySavings = calcMonthlySavings(state)
  const dailyBudget    = calcDailyBudget(state)
  const budgetColor    = dailyBudget >= 3000 ? D.income : dailyBudget >= 1000 ? D.caution : D.danger

  function goNext() {
    setDirection(1)
    setStep((s) => Math.min(4, s + 1))
  }

  function goPrev() {
    setDirection(-1)
    setStep((s) => Math.max(0, s - 1))
  }

  function updateFixed(key: FixedKey, value: number) {
    setState((s) => ({
      ...s,
      fixedCosts: { ...s.fixedCosts, [key]: { ...s.fixedCosts[key], value } },
    }))
  }

  function switchSavingsMode(mode: 'monthly' | 'yearly') {
    setState((s) => {
      if (mode === s.savingsMode) return s
      if (mode === 'yearly') {
        return { ...s, savingsMode: 'yearly', savingsYearly: s.savingsMonthly * 12 }
      }
      return { ...s, savingsMode: 'monthly', savingsMonthly: Math.round(s.savingsYearly / 12) }
    })
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // 給料日まで何日か（簡易計算）
  const today = new Date()
  const nextSalary = new Date(today.getFullYear(), today.getMonth(), state.salaryDay)
  if (nextSalary <= today) nextSalary.setMonth(nextSalary.getMonth() + 1)
  const daysUntilSalary = Math.ceil((nextSalary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const budgetDaysFromBalance = dailyBudget > 0 ? Math.floor(state.currentBalance / dailyBudget) : 0

  // スライドアニメーション設定
  const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <div className="min-h-screen" style={{ background: D.bg, paddingBottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))' }}>

      {/* ─── ヘッダー ─────────────────────────────────────────────────── */}
      <motion.header
        className="sticky top-0 z-20 flex h-14 items-center border-b px-4 md:px-6"
        style={{
          background:     'rgba(255,253,245,0.92)',
          backdropFilter: 'blur(12px)',
          borderColor:    D.border,
        }}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={SPRING.SMOOTH}
      >
        <div className="flex items-center gap-2.5 shrink-0">
          <img src="/logo192.png" alt="家計かんり" className="h-8 w-8 shrink-0" style={{ borderRadius: '10px' }} />
          <span className="text-[15px] font-extrabold tracking-tight" style={{ color: D.text }}>家計かんり</span>
        </div>

        <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex" aria-label="メインナビゲーション">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              aria-current={item.active ? 'page' : undefined}
              className="flex items-center gap-1.5 px-3 py-2 text-[13px] font-semibold"
              style={{
                borderRadius:   '10px',
                background:     item.active ? D.brandLight : 'transparent',
                color:          item.active ? D.brand : 'rgba(28,20,16,0.50)',
                textDecoration: 'none',
              }}
            >
              <item.icon size={14} aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center"
            style={{ color: 'rgba(28,20,16,0.45)', borderRadius: '8px' }}
            aria-label="通知"
          >
            <Bell size={17} />
          </button>
          <Link
            to="/my-page"
            className="flex h-8 w-8 items-center justify-center text-[12px] font-extrabold text-white"
            style={{
              background:     `linear-gradient(135deg, ${D.brand}, ${D.brandDeep})`,
              borderRadius:   '9999px',
              boxShadow:      '0 2px 8px rgba(241,136,64,0.30)',
              textDecoration: 'none',
            }}
            aria-label="マイページ"
          >
            Y
          </Link>
        </div>
      </motion.header>

      {/* ─── メインコンテンツ ─────────────────────────────────────────── */}
      <main className="mx-auto max-w-lg px-4 py-6 md:px-6">

        {/* ステップインジケーター */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...SPRING.SMOOTH, delay: 0.05 }}
        >
          <StepIndicator currentStep={step} />
        </motion.div>

        {/* ステップコンテンツ */}
        <div style={{ overflow: 'hidden' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={SPRING.BASE}
            >
              {/* ── ステップ 0: 給与 ── */}
              {step === 0 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                >
                  <h2 className="text-lg font-extrabold mb-1" style={{ color: D.text }}>
                    給料日と月収を教えてください
                  </h2>
                  <p className="text-[12px] mb-4" style={{ color: D.muted }}>
                    毎月の給料日と手取り収入を設定します
                  </p>

                  <DayPicker
                    value={state.salaryDay}
                    onChange={(v) => setState((s) => ({ ...s, salaryDay: v }))}
                  />
                  <div className="border-t" style={{ borderColor: D.border }}>
                    <NumberRow
                      label="月収（手取り）"
                      icon={TrendingUp}
                      value={state.monthlyIncome}
                      onChange={(v) => setState((s) => ({ ...s, monthlyIncome: v }))}
                      step={10000}
                    />
                  </div>

                  <MiniPreview state={state} />

                  <div className="flex justify-end mt-4">
                    <motion.button
                      className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                      style={{ background: D.brand, boxShadow: `0 4px 14px ${D.brand}40` }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goNext}
                      transition={SPRING.SNAP}
                    >
                      次へ
                      <ChevronRight size={15} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── ステップ 1: 固定費 ── */}
              {step === 1 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                >
                  <h2 className="text-lg font-extrabold mb-1" style={{ color: D.text }}>
                    毎月の固定費を入力
                  </h2>
                  <p className="text-[12px] mb-4" style={{ color: D.muted }}>
                    毎月かならず支払う費用を入力してください
                  </p>

                  <div className="space-y-0">
                    {(Object.entries(state.fixedCosts) as [FixedKey, State['fixedCosts'][FixedKey]][]).map(
                      ([key, cfg], i, arr) => (
                        <div
                          key={key}
                          className={i < arr.length - 1 ? 'border-b' : ''}
                          style={{ borderColor: D.border }}
                        >
                          <NumberRow
                            label={cfg.label}
                            icon={cfg.icon}
                            value={cfg.value}
                            onChange={(v) => updateFixed(key, v)}
                            step={cfg.step}
                          />
                        </div>
                      ),
                    )}
                  </div>

                  {/* 合計バー */}
                  <div
                    className="flex justify-between items-center px-0 py-3 border-t"
                    style={{ borderColor: D.border }}
                  >
                    <span className="text-xs font-bold" style={{ color: D.muted }}>固定費合計</span>
                    <motion.span
                      className="text-sm font-extrabold tabular-nums"
                      style={{ color: D.text }}
                      key={totalFixed}
                      initial={{ scale: 0.95 }}
                      animate={{ scale: 1 }}
                      transition={SPRING.QUICK}
                    >
                      ¥{totalFixed.toLocaleString('ja-JP')}
                    </motion.span>
                  </div>

                  <MiniPreview state={state} />

                  <div className="flex justify-between mt-4">
                    <motion.button
                      className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold"
                      style={{ background: D.surface, color: D.text }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goPrev}
                      transition={SPRING.SNAP}
                    >
                      <ChevronLeft size={15} />
                      戻る
                    </motion.button>
                    <motion.button
                      className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                      style={{ background: D.brand, boxShadow: `0 4px 14px ${D.brand}40` }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goNext}
                      transition={SPRING.SNAP}
                    >
                      次へ
                      <ChevronRight size={15} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── ステップ 2: 残高 ── */}
              {step === 2 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                >
                  <h2 className="text-lg font-extrabold mb-1" style={{ color: D.text }}>
                    現在の口座残高
                  </h2>
                  <p className="text-[12px] mb-4" style={{ color: D.muted }}>
                    今日時点の口座残高を入力してください
                  </p>

                  <NumberRow
                    label="口座残高"
                    icon={Wallet}
                    value={state.currentBalance}
                    onChange={(v) => setState((s) => ({ ...s, currentBalance: v }))}
                    step={10000}
                  />

                  {/* 残高インサイト */}
                  <div
                    className="rounded-xl p-3 mt-2 space-y-1.5 text-[11px]"
                    style={{ background: D.surface }}
                  >
                    <div className="flex justify-between">
                      <span style={{ color: D.muted }}>給料日まで</span>
                      <span className="font-bold" style={{ color: D.text }}>約 {daysUntilSalary} 日</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: D.muted }}>残高で賄える日数</span>
                      <span className="font-bold tabular-nums" style={{ color: dailyBudget > 0 ? D.text : D.muted }}>
                        {dailyBudget > 0 ? `約 ${budgetDaysFromBalance} 日分` : '—'}
                      </span>
                    </div>
                  </div>

                  <MiniPreview state={state} />

                  <div className="flex justify-between mt-4">
                    <motion.button
                      className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold"
                      style={{ background: D.surface, color: D.text }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goPrev}
                      transition={SPRING.SNAP}
                    >
                      <ChevronLeft size={15} />
                      戻る
                    </motion.button>
                    <motion.button
                      className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                      style={{ background: D.brand, boxShadow: `0 4px 14px ${D.brand}40` }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goNext}
                      transition={SPRING.SNAP}
                    >
                      次へ
                      <ChevronRight size={15} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── ステップ 3: 貯蓄目標 ── */}
              {step === 3 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                >
                  <h2 className="text-lg font-extrabold mb-1" style={{ color: D.text }}>
                    毎月・毎年の貯蓄目標
                  </h2>
                  <p className="text-[12px] mb-4" style={{ color: D.muted }}>
                    貯蓄目標を設定すると1日予算に反映されます
                  </p>

                  {/* 月間 / 年間 トグル */}
                  <div
                    className="inline-flex rounded-xl p-1 gap-1 mb-4"
                    style={{ background: D.surface }}
                    role="tablist"
                    aria-label="貯蓄目標の期間"
                  >
                    {(['monthly', 'yearly'] as const).map((mode) => {
                      const active = state.savingsMode === mode
                      return (
                        <motion.button
                          key={mode}
                          role="tab"
                          aria-selected={active}
                          type="button"
                          onClick={() => switchSavingsMode(mode)}
                          className="px-5 py-1.5 rounded-lg text-xs font-bold"
                          style={{
                            background: active ? D.card   : 'transparent',
                            color:      active ? D.brand  : D.muted,
                            boxShadow:  active ? D.shadow : 'none',
                          }}
                          whileTap={{ scale: 0.95 }}
                          transition={SPRING.SNAP}
                        >
                          {mode === 'monthly' ? '月間' : '年間'}
                        </motion.button>
                      )
                    })}
                  </div>

                  {state.savingsMode === 'monthly' ? (
                    <NumberRow
                      key="savings-monthly"
                      label="月間貯蓄目標"
                      icon={PiggyBank}
                      value={state.savingsMonthly}
                      onChange={(v) => setState((s) => ({ ...s, savingsMonthly: v }))}
                      step={5000}
                      suffix="/ 月"
                    />
                  ) : (
                    <NumberRow
                      key="savings-yearly"
                      label="年間貯蓄目標"
                      icon={PiggyBank}
                      value={state.savingsYearly}
                      onChange={(v) => setState((s) => ({ ...s, savingsYearly: v }))}
                      step={60000}
                      suffix="/ 年"
                    />
                  )}

                  {/* 換算参照 */}
                  {(state.savingsMode === 'monthly' ? state.savingsMonthly : state.savingsYearly) > 0 && (
                    <div
                      className="flex items-center justify-between px-0 py-2.5 border-t"
                      style={{ background: D.incomeLight, borderColor: D.border, borderRadius: '10px', padding: '8px 12px', marginTop: '4px' }}
                    >
                      <span className="text-[11px] font-semibold" style={{ color: D.income }}>
                        {state.savingsMode === 'monthly' ? '年間換算' : '月間換算'}
                      </span>
                      <span className="text-[11px] font-extrabold tabular-nums" style={{ color: D.income }}>
                        ≈ ¥{(
                          state.savingsMode === 'monthly'
                            ? state.savingsMonthly * 12
                            : Math.round(state.savingsYearly / 12)
                        ).toLocaleString('ja-JP')}
                        {state.savingsMode === 'monthly' ? ' / 年' : ' / 月'}
                      </span>
                    </div>
                  )}

                  <MiniPreview state={state} label="確定後の1日予算" />

                  <div className="flex justify-between mt-4">
                    <motion.button
                      className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold"
                      style={{ background: D.surface, color: D.text }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goPrev}
                      transition={SPRING.SNAP}
                    >
                      <ChevronLeft size={15} />
                      戻る
                    </motion.button>
                    <motion.button
                      className="flex items-center gap-1.5 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                      style={{ background: D.brand, boxShadow: `0 4px 14px ${D.brand}40` }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goNext}
                      transition={SPRING.SNAP}
                    >
                      次へ
                      <ChevronRight size={15} />
                    </motion.button>
                  </div>
                </div>
              )}

              {/* ── ステップ 4: 確認・保存 ── */}
              {step === 4 && (
                <div
                  className="rounded-2xl p-5"
                  style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                >
                  <h2 className="text-lg font-extrabold mb-1" style={{ color: D.text }}>
                    設定の確認
                  </h2>
                  <p className="text-[12px] mb-5" style={{ color: D.muted }}>
                    内容を確認して保存してください
                  </p>

                  {/* 1日予算（大） */}
                  <div
                    className="relative rounded-2xl p-5 mb-4 overflow-hidden text-center"
                    style={{ background: D.surface }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: `radial-gradient(circle at 50% 0%, ${budgetColor}18 0%, transparent 70%)` }}
                    />
                    <div className="relative">
                      <div className="text-[11px] font-semibold mb-1" style={{ color: D.muted }}>1日予算</div>
                      <motion.div
                        className="text-[44px] font-extrabold tabular-nums leading-none"
                        style={{ color: budgetColor, letterSpacing: '-0.02em' }}
                        key={dailyBudget}
                        initial={{ scale: 0.92 }}
                        animate={{ scale: 1 }}
                        transition={SPRING.QUICK}
                        aria-live="polite"
                        aria-atomic="true"
                      >
                        ¥{dailyBudget.toLocaleString('ja-JP')}
                      </motion.div>
                      <div className="text-[11px] mt-1" style={{ color: D.muted }}>/ 日</div>
                    </div>
                  </div>

                  {/* サマリー一覧 */}
                  <div className="space-y-2 text-[12px]" style={{ color: D.text }}>
                    {/* 収入 */}
                    <div
                      className="rounded-xl p-3 space-y-1.5"
                      style={{ background: D.surface }}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: D.muted }}>収入</div>
                      <div className="flex justify-between">
                        <span style={{ color: D.muted }}>月収（手取り）</span>
                        <span className="font-extrabold tabular-nums">¥{state.monthlyIncome.toLocaleString('ja-JP')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: D.muted }}>給料日</span>
                        <span className="font-extrabold">毎月 {state.salaryDay} 日</span>
                      </div>
                    </div>

                    {/* 固定費 */}
                    <div
                      className="rounded-xl p-3 space-y-1.5"
                      style={{ background: D.surface }}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: D.muted }}>固定費</div>
                        <span className="font-extrabold tabular-nums text-xs" style={{ color: D.danger }}>
                          合計 ¥{totalFixed.toLocaleString('ja-JP')}
                        </span>
                      </div>
                      {(Object.entries(state.fixedCosts) as [FixedKey, State['fixedCosts'][FixedKey]][]).map(([key, cfg]) => (
                        <div key={key} className="flex justify-between">
                          <span style={{ color: D.muted }}>{cfg.label}</span>
                          <span className="font-bold tabular-nums">¥{cfg.value.toLocaleString('ja-JP')}</span>
                        </div>
                      ))}
                    </div>

                    {/* 残高 */}
                    <div
                      className="rounded-xl p-3"
                      style={{ background: D.surface }}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: D.muted }}>残高</div>
                      <div className="flex justify-between">
                        <span style={{ color: D.muted }}>口座残高</span>
                        <span className="font-extrabold tabular-nums">¥{state.currentBalance.toLocaleString('ja-JP')}</span>
                      </div>
                    </div>

                    {/* 貯蓄目標 */}
                    <div
                      className="rounded-xl p-3 space-y-1.5"
                      style={{ background: D.surface }}
                    >
                      <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: D.muted }}>貯蓄目標</div>
                      <div className="flex justify-between">
                        <span style={{ color: D.muted }}>月間貯蓄</span>
                        <span className="font-extrabold tabular-nums" style={{ color: D.income }}>
                          ¥{monthlySavings.toLocaleString('ja-JP')} / 月
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-5">
                    <motion.button
                      className="flex items-center gap-1.5 px-5 py-3 rounded-xl text-sm font-bold"
                      style={{ background: D.surface, color: D.text }}
                      whileTap={{ scale: 0.96 }}
                      onClick={goPrev}
                      transition={SPRING.SNAP}
                    >
                      <ChevronLeft size={15} />
                      戻る
                    </motion.button>
                    <motion.button
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-extrabold text-white"
                      style={{ background: D.brand, boxShadow: `0 4px 20px ${D.brand}45` }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleSave}
                      transition={SPRING.SNAP}
                    >
                      <Check size={16} />
                      保存する
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* ─── モバイルボトムナビ ──────────────────────────────────────── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 lg:hidden"
        style={{
          background:     'rgba(255,253,245,0.92)',
          backdropFilter: 'blur(16px)',
          borderTop:      `1px solid ${D.border}`,
          paddingBottom:  'env(safe-area-inset-bottom, 0px)',
        }}
        aria-label="メインメニュー"
      >
        <div className="grid grid-cols-4 h-14">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              aria-current={item.active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-0.5"
              style={{ color: item.active ? D.brand : 'rgba(28,20,16,0.40)', textDecoration: 'none' }}
            >
              <item.icon size={20} strokeWidth={item.active ? 2.4 : 2} aria-hidden />
              <span className="text-[10px] font-bold leading-none">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <Toast visible={saved} />
    </div>
  )
}
