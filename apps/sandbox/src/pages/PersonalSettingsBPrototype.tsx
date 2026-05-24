/**
 * PersonalSettingsBPrototype — ウィザード型初期設定
 * 5ステップのリニアウィザード形式。
 * ステップ: 0=給与, 1=固定費, 2=残高, 3=貯蓄目標, 4=確認・保存
 * ステップ間はframer-motionでスライドアニメーション。
 * 保存完了後はホーム画面 (/home) へ遷移する。
 */

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Check,
  TrendingUp,
  Home,
  Zap,
  Car,
  ShoppingBag,
  Wallet,
  Heart,
  Calendar,
  PiggyBank,
} from 'lucide-react'
import { SandboxLayout } from '../components/SandboxLayout'
import { D } from '../components/SandboxCard'

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

// ─── AmountField — 常時編集可能な金額入力（± ステッパー付き） ────────────
function AmountField({
  value, onChange, step = 1000, suffix,
}: {
  value: number; onChange: (v: number) => void; step?: number; suffix?: string
}) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw]         = useState('')

  return (
    <div className="flex items-center gap-1">
      {/* − ボタン */}
      <motion.button
        type="button"
        className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-base font-bold select-none"
        style={{ background: D.surface, color: D.muted }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(Math.max(0, value - step))}
        whileTap={{ scale: 0.85 }}
        transition={SPRING.SNAP}
        aria-label={`${step.toLocaleString('ja-JP')}円減らす`}
      >
        −
      </motion.button>

      {/* 入力フィールド */}
      <div
        className="flex flex-1 items-center gap-1.5 rounded-md border px-3 py-2 transition-colors"
        style={{
          borderColor: focused ? D.brand : D.border,
          background:  focused ? D.brandLight : D.surface,
        }}
      >
        <span className="text-xs font-semibold shrink-0" style={{ color: D.muted }}>¥</span>
        <input
          type="text"
          inputMode="numeric"
          className="min-w-0 flex-1 text-right text-sm font-bold tabular-nums bg-transparent outline-none"
          style={{ color: D.text }}
          value={focused ? raw : value.toLocaleString('ja-JP')}
          onFocus={() => { setFocused(true); setRaw(value.toString()) }}
          onBlur={() => {
            setFocused(false)
            const n = parseInt(raw, 10)
            if (!isNaN(n) && n >= 0) onChange(n)
          }}
          onChange={(e) => setRaw(e.target.value.replace(/[^0-9]/g, ''))}
        />
        {suffix && (
          <span className="text-xs font-medium shrink-0" style={{ color: D.muted }}>{suffix}</span>
        )}
      </div>

      {/* + ボタン */}
      <motion.button
        type="button"
        className="h-9 w-9 shrink-0 rounded-md flex items-center justify-center text-base font-bold select-none"
        style={{ background: D.surface, color: D.muted }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(value + step)}
        whileTap={{ scale: 0.85 }}
        transition={SPRING.SNAP}
        aria-label={`${step.toLocaleString('ja-JP')}円増やす`}
      >
        +
      </motion.button>
    </div>
  )
}

// ─── FieldRow — アイコン + ラベル + AmountField ────────────────────────────
function FieldRow({ icon: Icon, label, value, onChange, step }: {
  icon: React.ElementType; label: string
  value: number; onChange: (v: number) => void; step?: number
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: D.surface }}>
          <Icon size={12} style={{ color: D.brand }} />
        </div>
        <span className="text-xs font-medium" style={{ color: 'rgba(28,20,16,0.72)' }}>{label}</span>
      </div>
      <AmountField value={value} onChange={onChange} step={step} />
    </div>
  )
}

// ─── SalaryDayPicker ─────────────────────────────────────────────────────────
const COMMON_DAYS = [1, 5, 10, 15, 20, 21, 25, 28, 31] as const
const DAY_CELLS   = Array.from({ length: 35 }, (_, i) => (i < 31 ? i + 1 : null))

function SalaryDayPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen] = useState(false)
  const [pos,  setPos]  = useState({ top: 0, right: 0 })
  const pickerRef       = useRef<HTMLDivElement>(null)
  const triggerRef      = useRef<HTMLButtonElement>(null)

  // クリック外で閉じる
  useEffect(() => {
    if (!open) return
    function onClickOutside(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  // トリガーボタンの位置を取得してドロップダウンを fixed 配置
  function handleToggle() {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
    }
    setOpen(v => !v)
  }

  const prevCommon = COMMON_DAYS.filter(d => d < value)
  const nextCommon = COMMON_DAYS.filter(d => d > value)
  const canPrev    = prevCommon.length > 0
  const canNext    = nextCommon.length > 0

  return (
    <div className="flex flex-col gap-2">
      {/* 行1: ラベル + よくある日チップ */}
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: D.surface }}>
          <Calendar size={14} style={{ color: D.brand }} />
        </div>
        <span className="text-xs font-medium shrink-0" style={{ color: 'rgba(28,20,16,0.72)' }}>給料日</span>
        <div className="flex-1 flex items-center justify-end gap-1.5 overflow-x-auto">
          {COMMON_DAYS.map(d => (
            <motion.button key={d} type="button"
              className="h-9 w-9 rounded-md text-sm font-bold shrink-0"
              style={{
                background: value === d ? D.brand   : D.surface,
                color:      value === d ? '#ffffff' : D.text,
                boxShadow:  value === d ? `0 3px 8px ${D.brand}40` : 'none',
              }}
              onClick={() => onChange(d)}
              whileTap={{ scale: 0.88 }}
              transition={SPRING.SNAP}
              aria-pressed={value === d}
            >
              {d}
            </motion.button>
          ))}
          <span className="text-xs shrink-0 ml-0.5" style={{ color: D.muted }}>日</span>
        </div>
      </div>

      {/* 行2: 任意の日付ピッカー */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[11px] font-medium shrink-0" style={{ color: D.muted }}>他の日付</span>
        <div ref={pickerRef} className="flex items-center gap-1 shrink-0">
          <motion.button type="button"
            whileTap={{ scale: 0.82 }} transition={SPRING.SNAP}
            onClick={() => canPrev && onChange(prevCommon[prevCommon.length - 1])}
            disabled={!canPrev}
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: D.surface, color: canPrev ? D.muted : D.border }}
            aria-label="前のよくある給料日"
          >
            <ChevronLeft size={14} />
          </motion.button>

          <button ref={triggerRef} type="button"
            onClick={handleToggle}
            className="flex items-center gap-1 rounded-md px-2.5 py-1.5 font-bold text-sm tabular-nums"
            style={{
              background:     open ? D.brandLight : D.surface,
              border:         `1.5px solid ${open ? D.brand : 'transparent'}`,
              color:          open ? D.brand : D.text,
              minWidth:       58,
              justifyContent: 'center',
            }}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            {value}日
            <ChevronDown size={11} style={{
              transform:  open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
              opacity:    0.5,
            }} />
          </button>

          <motion.button type="button"
            whileTap={{ scale: 0.82 }} transition={SPRING.SNAP}
            onClick={() => canNext && onChange(nextCommon[0])}
            disabled={!canNext}
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: D.surface, color: canNext ? D.muted : D.border }}
            aria-label="次のよくある給料日"
          >
            <ChevronRight size={14} />
          </motion.button>

          {/* 1〜31 グリッドドロップダウン */}
          <AnimatePresence>
            {open && (
              <motion.div
                style={{
                  position:     'fixed',
                  top:          pos.top,
                  right:        pos.right,
                  zIndex:       9999,
                  background:   D.card,
                  border:       `1px solid ${D.border}`,
                  boxShadow:    '0 8px 24px rgba(28,20,16,0.14)',
                  minWidth:     228,
                  borderRadius: 16,
                  padding:      8,
                }}
                initial={{ opacity: 0, scale: 0.94, y: -6 }}
                animate={{ opacity: 1, scale: 1,    y:  0 }}
                exit={{    opacity: 0, scale: 0.94, y: -6 }}
                transition={SPRING.SNAP}
                role="listbox"
                aria-label="給料日を選択"
              >
                <p className="px-1 pb-1.5 text-[10px] font-bold" style={{ color: 'rgba(28,20,16,0.3)' }}>
                  日付を選択（1〜31日）
                </p>
                <div className="grid grid-cols-7 gap-0.5">
                  {DAY_CELLS.map((d, i) =>
                    d === null ? (
                      <div key={`empty-${i}`} className="h-8 w-8" />
                    ) : (
                      <motion.button
                        key={d}
                        type="button"
                        whileTap={{ scale: 0.85 }}
                        transition={SPRING.SNAP}
                        onClick={() => { onChange(d); setOpen(false) }}
                        role="option"
                        aria-selected={d === value}
                        className="h-8 w-8 rounded-md text-[12px] font-bold flex items-center justify-center transition-colors"
                        style={{
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
                <div className="flex items-center gap-1.5 mt-2 px-1">
                  <span className="h-2 w-2 rounded-sm shrink-0"
                    style={{ background: 'rgba(241,136,64,0.15)' }} />
                  <span className="text-[9px] font-semibold" style={{ color: 'rgba(28,20,16,0.3)' }}>
                    よくある給料日
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
    <div className="flex items-center justify-center gap-0" role="list" aria-label="ステップ進捗">
      {STEP_LABELS.map((label, i) => {
        const isDone    = i < currentStep
        const isCurrent = i === currentStep
        const color     = isDone ? D.income : isCurrent ? D.brand : D.muted

        return (
          <div key={label} className="flex items-center" role="listitem">
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

// ─── ミニプレビュー（バー形式） ──────────────────────────────────────────
function MiniPreview({ state, label = '1日予算（暫定）' }: { state: State; label?: string }) {
  const dailyBudget = calcDailyBudget(state)
  const budgetColor = dailyBudget >= 3000 ? D.income : dailyBudget >= 1000 ? D.caution : D.danger

  return (
    <div
      className="flex items-center justify-between rounded-xl px-4 py-2.5"
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

// ─── ミニプレビュー（PCサイドカード形式） ────────────────────────────────
function PreviewCard({ state }: { state: State }) {
  const dailyBudget    = calcDailyBudget(state)
  const totalFixed     = calcTotalFixed(state)
  const monthlySavings = calcMonthlySavings(state)
  const disposable     = state.monthlyIncome - totalFixed - monthlySavings
  const budgetColor    = dailyBudget >= 3000 ? D.income : dailyBudget >= 1000 ? D.caution : D.danger

  const inc        = state.monthlyIncome || 1
  const fixedPct   = Math.min(100,             (totalFixed     / inc) * 100)
  const savingsPct = Math.min(100 - fixedPct,  (monthlySavings / inc) * 100)
  const freePct    = Math.max(0, 100 - fixedPct - savingsPct)

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-5"
      style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
    >
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 180, height: 180, top: -70, right: -60,
          background: `radial-gradient(circle, ${budgetColor}1f 0%, transparent 70%)`,
        }}
        animate={{ opacity: [0.6, 0.9, 0.6] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="relative">
        <div className="text-[10px] font-semibold mb-1" style={{ color: D.muted }}>設定後の1日予算</div>
        <motion.div
          key={dailyBudget}
          className="text-[44px] font-extrabold leading-none tabular-nums"
          style={{ color: budgetColor, letterSpacing: '-0.02em' }}
          initial={{ scale: 0.96, opacity: 0.7 }}
          animate={{ scale: 1,    opacity: 1   }}
          transition={SPRING.QUICK}
          aria-live="polite"
        >
          ¥{dailyBudget.toLocaleString('ja-JP')}
        </motion.div>
        <div className="text-[10px] mt-1 mb-4" style={{ color: D.muted }}>/ 日</div>

        {/* 配分バー */}
        <div className="mb-4">
          <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
            <motion.div style={{ background: D.danger, opacity: 0.7 }}
              animate={{ width: `${fixedPct}%` }} transition={SPRING.BASE} />
            {savingsPct > 0 && (
              <motion.div style={{ background: D.income, opacity: 0.85 }}
                animate={{ width: `${savingsPct}%` }} transition={SPRING.BASE} />
            )}
            <div className="flex-1 rounded-r-full" style={{ background: D.brand, opacity: 0.85 }} />
          </div>
          <div className="flex justify-between mt-1.5 text-[9px] font-semibold">
            <span style={{ color: D.danger }}>固定費 {fixedPct.toFixed(0)}%</span>
            {savingsPct > 0 && <span style={{ color: D.income }}>貯蓄 {savingsPct.toFixed(0)}%</span>}
            <span style={{ color: D.brand }}>使える {freePct.toFixed(0)}%</span>
          </div>
        </div>

        {/* 内訳 */}
        <div className="rounded-md p-3 space-y-1.5 text-[11px]" style={{ background: D.surface }}>
          {[
            { label: '月収',     value: state.monthlyIncome, color: D.text,      bold: false, hide: false },
            { label: '固定費',   value: -totalFixed,         color: D.danger,    bold: false, hide: false },
            { label: '貯蓄目標', value: -monthlySavings,     color: D.income,    bold: false, hide: monthlySavings === 0 },
            { label: '使える額', value: disposable,           color: budgetColor, bold: true,  hide: false },
          ].filter(r => !r.hide).map((row) => (
            <div key={row.label}
              className={`flex justify-between items-center ${row.bold ? 'pt-1.5 border-t' : ''}`}
              style={{ borderColor: D.border }}>
              <span style={{ color: D.muted, fontWeight: row.bold ? 700 : 500 }}>{row.label}</span>
              <motion.span key={row.value} className="tabular-nums font-bold" style={{ color: row.color }}
                initial={{ opacity: 0.6, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
                transition={SPRING.QUICK}>
                {row.value >= 0 ? '' : '−'}¥{Math.abs(row.value).toLocaleString('ja-JP')}
              </motion.span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── メインページ ─────────────────────────────────────────────────────────
export function PersonalSettingsBPrototype() {
  const navigate = useNavigate()
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
    // トースト表示後にホームへ遷移
    setTimeout(() => navigate('/home'), 1800)
  }

  // 給料日まで何日か（簡易計算）
  const today = new Date()
  const nextSalary = new Date(today.getFullYear(), today.getMonth(), state.salaryDay)
  if (nextSalary <= today) nextSalary.setMonth(nextSalary.getMonth() + 1)
  const daysUntilSalary    = Math.ceil((nextSalary.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const budgetDaysFromBalance = dailyBudget > 0 ? Math.floor(state.currentBalance / dailyBudget) : 0

  // スライドアニメーション設定
  const slideVariants = {
    enter:  (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit:   (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  }

  return (
    <SandboxLayout currentPage="settings">

      {/* ─── メインコンテンツ ─────────────────────────────────────────── */}
      <main className="px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">

          {/* ── PC 左カラム: ステップインジケーター + プレビューカード ─── */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4 lg:sticky lg:top-6">
            {/* タイトル */}
            <div>
              <h1 className="text-xl font-extrabold" style={{ color: D.text }}>初期設定</h1>
              <p className="text-[12px] mt-0.5" style={{ color: D.muted }}>
                5ステップで家計の基本設定を完了しましょう
              </p>
            </div>

            {/* ステップインジケーター */}
            <div
              className="rounded-2xl p-4"
              style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
            >
              <StepIndicator currentStep={step} />
            </div>

            {/* プレビューカード */}
            <PreviewCard state={state} />
          </div>

          {/* ── コンテンツカラム ─────────────────────────────────────── */}
          <div>
            {/* SP: ステップインジケーター */}
            <motion.div
              className="lg:hidden mb-5"
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
                      className="rounded-2xl p-5 space-y-4"
                      style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                    >
                      <div>
                        <h2 className="text-lg font-extrabold" style={{ color: D.text }}>
                          給料日と月収を教えてください
                        </h2>
                        <p className="text-[12px] mt-1" style={{ color: D.muted }}>
                          毎月の給料日と手取り収入を設定します
                        </p>
                      </div>

                      <SalaryDayPicker
                        value={state.salaryDay}
                        onChange={(v) => setState((s) => ({ ...s, salaryDay: v }))}
                      />

                      <div className="border-t pt-4" style={{ borderColor: D.border }}>
                        <FieldRow
                          label="月収（手取り）"
                          icon={TrendingUp}
                          value={state.monthlyIncome}
                          onChange={(v) => setState((s) => ({ ...s, monthlyIncome: v }))}
                          step={10000}
                        />
                      </div>

                      <div className="lg:hidden">
                        <MiniPreview state={state} />
                      </div>

                      <div className="flex justify-end pt-1">
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
                      className="rounded-2xl p-5 space-y-4"
                      style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                    >
                      <div>
                        <h2 className="text-lg font-extrabold" style={{ color: D.text }}>
                          毎月の固定費を入力
                        </h2>
                        <p className="text-[12px] mt-1" style={{ color: D.muted }}>
                          毎月かならず支払う費用を入力してください
                        </p>
                      </div>

                      <div>
                        {(Object.entries(state.fixedCosts) as [FixedKey, State['fixedCosts'][FixedKey]][]).map(
                          ([key, cfg], i, arr) => (
                            <div
                              key={key}
                              className={`py-3 ${i < arr.length - 1 ? 'border-b' : ''}`}
                              style={{ borderColor: D.border }}
                            >
                              <FieldRow
                                label={cfg.label}
                                icon={cfg.icon}
                                value={cfg.value}
                                onChange={(v) => updateFixed(key, v)}
                                step={cfg.step}
                              />
                            </div>
                          ),
                        )}
                        {/* 合計バー */}
                        <div
                          className="flex justify-between items-center py-3 border-t"
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
                      </div>

                      <div className="lg:hidden">
                        <MiniPreview state={state} />
                      </div>

                      <div className="flex justify-between pt-1">
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
                      className="rounded-2xl p-5 space-y-4"
                      style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                    >
                      <div>
                        <h2 className="text-lg font-extrabold" style={{ color: D.text }}>
                          現在の口座残高
                        </h2>
                        <p className="text-[12px] mt-1" style={{ color: D.muted }}>
                          今日時点の口座残高を入力してください
                        </p>
                      </div>

                      <FieldRow
                        label="口座残高"
                        icon={Wallet}
                        value={state.currentBalance}
                        onChange={(v) => setState((s) => ({ ...s, currentBalance: v }))}
                        step={10000}
                      />

                      {/* 残高インサイト */}
                      <div
                        className="rounded-xl p-3 space-y-1.5 text-[11px]"
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

                      <div className="lg:hidden">
                        <MiniPreview state={state} />
                      </div>

                      <div className="flex justify-between pt-1">
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
                      className="rounded-2xl p-5 space-y-4"
                      style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                    >
                      <div>
                        <h2 className="text-lg font-extrabold" style={{ color: D.text }}>
                          毎月・毎年の貯蓄目標
                        </h2>
                        <p className="text-[12px] mt-1" style={{ color: D.muted }}>
                          貯蓄目標を設定すると1日予算に反映されます
                        </p>
                      </div>

                      {/* 月間 / 年間 トグル */}
                      <div
                        className="inline-flex rounded-xl p-1 gap-1"
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
                                background: active ? D.card  : 'transparent',
                                color:      active ? D.brand : D.muted,
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

                      <div className="space-y-2">
                        {state.savingsMode === 'monthly' ? (
                          <FieldRow
                            key="savings-monthly"
                            label="月間貯蓄目標"
                            icon={PiggyBank}
                            value={state.savingsMonthly}
                            onChange={(v) => setState((s) => ({ ...s, savingsMonthly: v }))}
                            step={5000}
                          />
                        ) : (
                          <FieldRow
                            key="savings-yearly"
                            label="年間貯蓄目標"
                            icon={PiggyBank}
                            value={state.savingsYearly}
                            onChange={(v) => setState((s) => ({ ...s, savingsYearly: v }))}
                            step={60000}
                          />
                        )}

                        {/* 換算表示 */}
                        <AnimatePresence>
                          {(state.savingsMode === 'monthly' ? state.savingsMonthly : state.savingsYearly) > 0 && (
                            <motion.div
                              className="flex items-center justify-between rounded-xl px-3 py-2 text-[11px] font-semibold"
                              style={{ background: '#ecfaf8', color: D.income }}
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{    opacity: 0, height: 0 }}
                              transition={SPRING.QUICK}
                            >
                              <span>{state.savingsMode === 'monthly' ? '年間換算' : '月間換算'}</span>
                              <span className="font-extrabold tabular-nums">
                                ≈ ¥{(
                                  state.savingsMode === 'monthly'
                                    ? state.savingsMonthly * 12
                                    : Math.round(state.savingsYearly / 12)
                                ).toLocaleString('ja-JP')}
                                {state.savingsMode === 'monthly' ? ' / 年' : ' / 月'}
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="lg:hidden">
                        <MiniPreview state={state} label="確定後の1日予算" />
                      </div>

                      <div className="flex justify-between pt-1">
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
                      className="rounded-2xl p-5 space-y-4"
                      style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                    >
                      <div>
                        <h2 className="text-lg font-extrabold" style={{ color: D.text }}>
                          設定の確認
                        </h2>
                        <p className="text-[12px] mt-1" style={{ color: D.muted }}>
                          内容を確認して保存してください
                        </p>
                      </div>

                      {/* 1日予算（大） */}
                      <div
                        className="relative rounded-2xl p-5 overflow-hidden text-center"
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
                      <div className="space-y-2 text-[12px]">
                        {/* 収入 */}
                        <div className="rounded-xl p-3 space-y-1.5" style={{ background: D.surface }}>
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
                        <div className="rounded-xl p-3 space-y-1.5" style={{ background: D.surface }}>
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
                        <div className="rounded-xl p-3" style={{ background: D.surface }}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: D.muted }}>残高</div>
                          <div className="flex justify-between">
                            <span style={{ color: D.muted }}>口座残高</span>
                            <span className="font-extrabold tabular-nums">¥{state.currentBalance.toLocaleString('ja-JP')}</span>
                          </div>
                        </div>

                        {/* 貯蓄目標 */}
                        <div className="rounded-xl p-3 space-y-1.5" style={{ background: D.surface }}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: D.muted }}>貯蓄目標</div>
                          <div className="flex justify-between">
                            <span style={{ color: D.muted }}>月間貯蓄</span>
                            <span className="font-extrabold tabular-nums" style={{ color: D.income }}>
                              ¥{monthlySavings.toLocaleString('ja-JP')} / 月
                            </span>
                          </div>
                          {state.savingsMode === 'monthly' && (
                            <div className="flex justify-between">
                              <span style={{ color: D.muted }}>年間換算</span>
                              <span className="font-bold tabular-nums" style={{ color: D.income }}>
                                ¥{(state.savingsMonthly * 12).toLocaleString('ja-JP')} / 年
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between pt-1">
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
                          disabled={saved}
                          transition={SPRING.SNAP}
                        >
                          <Check size={16} />
                          保存してはじめる
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>

      <Toast visible={saved} />
    </SandboxLayout>
  )
}
