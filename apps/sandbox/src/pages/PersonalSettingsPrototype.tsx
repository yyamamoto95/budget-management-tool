/**
 * PersonalSettingsPrototype — 個人設定画面（刷新版）
 *
 * 改善点:
 * - 常時編集可能な AmountField（クリック→表示→編集の2ステップ不要）
 * - ベントーグリッドで4セクションを一覧できるレイアウト
 * - SP: ヘッダー直下にミニプレビューバー（1日予算 + 配分バー）固定
 * - PC: 右カラムにプレビューカード sticky
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Check, TrendingUp, Zap, Car, ShoppingBag,
  Wallet, Heart, Calendar, Settings, PiggyBank,
  ChevronLeft, ChevronRight, ChevronDown, BookOpen,
} from 'lucide-react'
import { SandboxLayout } from '../components/SandboxLayout'

// ─── Spring ──────────────────────────────────────────────────────────────────
const SPRING = {
  SNAP:   { type: 'spring', stiffness: 600, damping: 35 },
  QUICK:  { type: 'spring', stiffness: 400, damping: 30 },
  BASE:   { type: 'spring', stiffness: 300, damping: 28 },
  SMOOTH: { type: 'spring', stiffness: 200, damping: 26 },
} as const

import { D } from '../components/SandboxCard'

// ─── State ───────────────────────────────────────────────────────────────────
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

// ─── Calculations ─────────────────────────────────────────────────────────────
function calcTotalFixed(s: State) {
  return Object.values(s.fixedCosts).reduce((a, b) => a + b.value, 0)
}
function calcMonthlySavings(s: State) {
  return s.savingsMode === 'monthly' ? s.savingsMonthly : Math.round(s.savingsYearly / 12)
}
function calcDailyBudget(s: State) {
  return Math.max(0, Math.floor(
    (s.monthlyIncome - calcTotalFixed(s) - calcMonthlySavings(s)) / 30
  ))
}

// ─── AmountField — 常時表示・常時編集可能な金額入力（± ステッパー付き） ────
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
        onMouseDown={(e) => e.preventDefault()} // blur を抑止して先にクリックを処理
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
          className="min-w-0 flex-1 text-right font-bold tabular-nums bg-transparent outline-none"
          style={{ color: D.text, fontSize: '14px' }}
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
// モバイル: 縦並び（ラベル小・入力フル幅）  /  md 以上: 横並び
function FieldRow({ icon: Icon, label, value, onChange, step }: {
  icon: React.ElementType; label: string
  value: number; onChange: (v: number) => void; step?: number
}) {
  return (
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3">
      {/* ラベル */}
      <div className="flex items-center gap-1.5 md:flex-1">
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ background: D.surface }}>
          <Icon size={12} style={{ color: D.brand }} />
        </div>
        <span className="text-[11px] font-semibold md:text-sm md:font-medium"
          style={{ color: 'rgba(28,20,16,0.72)' }}>{label}</span>
      </div>
      {/* 入力（モバイルはフル幅） */}
      <AmountField value={value} onChange={onChange} step={step} />
    </div>
  )
}

// ─── SalaryDayPicker ─────────────────────────────────────────────────────────
// レイアウト: [icon] 給料日  [よくある日チップ…] 日 | [< 25日∨ >]
// チップ: よくある日を直接タップで選択
// ピッカー: < > でよくある日をステップ移動、数値クリックで 1〜31 グリッドを表示
const COMMON_DAYS = [1, 5, 10, 15, 20, 21, 25, 28, 31] as const
const DAY_CELLS   = Array.from({ length: 35 }, (_, i) => (i < 31 ? i + 1 : null))

function SalaryDayPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [open, setOpen]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, right: 0 })
  const pickerRef         = useRef<HTMLDivElement>(null)
  const triggerRef        = useRef<HTMLButtonElement>(null)

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
      setPos({
        top:   rect.bottom + 6,
        right: window.innerWidth - rect.right,
      })
    }
    setOpen(v => !v)
  }

  const prevCommon = COMMON_DAYS.filter(d => d < value)
  const nextCommon = COMMON_DAYS.filter(d => d > value)
  const canPrev    = prevCommon.length > 0
  const canNext    = nextCommon.length > 0

  return (
    <div className="flex flex-col gap-2">
      {/* 行1: ラベル + よくある日チップ（メイン選択） */}
      <div className="flex items-center gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
          style={{ background: D.surface }}>
          <Calendar size={14} style={{ color: D.brand }} />
        </div>
        <span className="text-[11px] font-semibold shrink-0" style={{ color: 'rgba(28,20,16,0.72)' }}>給料日</span>
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

      {/* 行2: 任意の日付ピッカー（補助選択・右寄せ） */}
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[11px] font-medium shrink-0" style={{ color: D.muted }}>
          他の日付
        </span>
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
              background: open ? D.brandLight : D.surface,
              border:     `1.5px solid ${open ? D.brand : 'transparent'}`,
              color:      open ? D.brand : D.text,
              minWidth:   58,
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

          {/* 1〜31 グリッド: position:fixed で全 overflow を突き抜けてフロート */}
          <AnimatePresence>
            {open && (
              <motion.div
                style={{
                  position:   'fixed',
                  top:        pos.top,
                  right:      pos.right,
                  zIndex:     9999,
                  background: D.card,
                  border:     `1px solid ${D.border}`,
                  boxShadow:  '0 8px 24px rgba(28,20,16,0.14)',
                  minWidth:   228,
                  borderRadius: 16,
                  padding: 8,
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

// ─── SectionCard ─────────────────────────────────────────────────────────────
function SectionCard({ title, children, delay = 0, noClip = false }: {
  title: string; children: React.ReactNode; delay?: number; noClip?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING.SMOOTH, delay }}
    >
      <div className="mb-1.5 px-0.5">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: D.muted }}>
          {title}
        </span>
      </div>
      <div className="rounded-md border"
        style={{
          background: D.card, borderColor: D.border, boxShadow: D.shadow,
          overflow: noClip ? 'visible' : 'hidden',
        }}>
        {children}
      </div>
    </motion.div>
  )
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-white z-50 whitespace-nowrap"
          style={{ background: D.income, boxShadow: `0 8px 24px ${D.income}50` }}
          initial={{ opacity: 0, y: 20, scale: 0.88 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={   { opacity: 0, y: 8,  scale: 0.94 }}
          transition={SPRING.SNAP}
        >
          <Check size={16} />
          設定を保存しました
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function PersonalSettingsPrototype() {
  const [state, setState] = useState<State>(INITIAL_STATE)
  const [saved, setSaved] = useState(false)
  const [activeMenu, setActiveMenu] = useState<'settings' | 'guide'>('settings')

  const dailyBudget    = calcDailyBudget(state)
  const totalFixed     = calcTotalFixed(state)
  const monthlySavings = calcMonthlySavings(state)
  const disposable     = state.monthlyIncome - totalFixed - monthlySavings
  const budgetColor    = dailyBudget >= 3000 ? D.income : dailyBudget >= 1000 ? D.caution : D.danger

  const inc        = state.monthlyIncome || 1
  const fixedPct   = Math.min(100,            (totalFixed     / inc) * 100)
  const savingsPct = Math.min(100 - fixedPct, (monthlySavings / inc) * 100)
  const freePct    = Math.max(0, 100 - fixedPct - savingsPct)

  function updateFixed(key: FixedKey, value: number) {
    setState((s) => ({
      ...s,
      fixedCosts: { ...s.fixedCosts, [key]: { ...s.fixedCosts[key], value } },
    }))
  }

  function switchSavingsMode(mode: 'monthly' | 'yearly') {
    setState((s) => {
      if (mode === s.savingsMode) return s
      return mode === 'yearly'
        ? { ...s, savingsMode: 'yearly',  savingsYearly:  s.savingsMonthly * 12 }
        : { ...s, savingsMode: 'monthly', savingsMonthly: Math.round(s.savingsYearly / 12) }
    })
  }

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <SandboxLayout currentPage="settings">


        {/* ── Mini Preview Bar (mobile sticky) ────────────────────────────── */}
        <div className="sticky top-0 z-10 lg:hidden border-b"
          style={{ background: 'rgba(255,253,245,0.95)', backdropFilter: 'blur(10px)', borderColor: D.border }}>
          <div className="flex items-center gap-4 px-4 py-2.5">
          <div className="shrink-0">
            <div className="text-[10px] font-semibold" style={{ color: D.muted }}>1日予算</div>
            <motion.div
              key={dailyBudget}
              className="text-lg font-extrabold tabular-nums leading-tight"
              style={{ color: budgetColor }}
              initial={{ scale: 0.95, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={SPRING.QUICK}
              aria-live="polite"
            >
              ¥{dailyBudget.toLocaleString('ja-JP')}
            </motion.div>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
              <motion.div style={{ background: D.danger, opacity: 0.75 }}
                animate={{ width: `${fixedPct}%` }} transition={SPRING.BASE} />
              {savingsPct > 0 && (
                <motion.div style={{ background: D.income }}
                  animate={{ width: `${savingsPct}%` }} transition={SPRING.BASE} />
              )}
              <div className="flex-1 rounded-r-full" style={{ background: D.brand, opacity: 0.85 }} />
            </div>
            <div className="flex justify-between text-[9px] font-semibold">
              <span style={{ color: D.danger }}>固定費 {fixedPct.toFixed(0)}%</span>
              {savingsPct > 0 && <span style={{ color: D.income }}>貯蓄 {savingsPct.toFixed(0)}%</span>}
              <span style={{ color: D.brand }}>使える {freePct.toFixed(0)}%</span>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[10px] font-semibold" style={{ color: D.muted }}>使える額</div>
            <motion.div key={disposable} className="text-xs font-bold tabular-nums" style={{ color: D.text }}
              initial={{ opacity: 0.6 }} animate={{ opacity: 1 }} transition={SPRING.QUICK}>
              ¥{(disposable / 10000).toFixed(1)}万
            </motion.div>
          </div>
        </div>
      </div>

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <main className="px-4 pt-4 pb-4 md:px-6 md:pt-3 md:pb-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-5">

          {/* ── PC 左カラム: メニュー + プレビュー ──────────────────────────── */}
          <div className="hidden lg:flex lg:flex-col lg:gap-4 lg:col-start-1 lg:row-start-1 lg:sticky lg:top-4">

            {/* メニュー */}
            <nav aria-label="設定メニュー">
              <div className="rounded-md border overflow-hidden" style={{ background: D.card, borderColor: D.border, boxShadow: D.shadow }}>
                {([
                  { key: 'settings', label: '設定',   icon: Settings  },
                  { key: 'guide',    label: 'ガイド', icon: BookOpen  },
                ] as const).map((item) => {
                  const active = activeMenu === item.key
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveMenu(item.key)}
                      className="flex w-full items-center gap-3 px-4 py-3.5 text-[13px] font-semibold text-left transition-colors hover:bg-black/[0.03]"
                      style={{
                        background: active ? D.brandLight : 'transparent',
                        color:      active ? D.brandDeep : 'rgba(28,20,16,0.60)',
                        borderLeft: active ? `3px solid ${D.brand}` : '3px solid transparent',
                      }}
                      aria-current={active ? 'page' : undefined}
                    >
                      <item.icon size={16} strokeWidth={active ? 2.3 : 2} />
                      {item.label}
                    </button>
                  )
                })}
                <div className="h-2" />
              </div>
            </nav>

            {/* プレビューカード（設定タブのみ） */}
            <AnimatePresence>
            {activeMenu === 'settings' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{    opacity: 0, y: 8  }}
                transition={{ ...SPRING.SMOOTH, delay: 0.04 }}
              >
            <div className="relative rounded-md overflow-hidden p-5"
              style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}>
              <motion.div className="absolute rounded-full pointer-events-none"
                style={{ width: 200, height: 200, top: -80, right: -70,
                  background: `radial-gradient(circle, ${budgetColor}1f 0%, transparent 70%)` }}
                animate={{ opacity: [0.6, 0.9, 0.6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              />
              <div className="relative">
                {/* プレビューバッジ */}
                <motion.div key={dailyBudget}
                  className="text-[52px] font-extrabold leading-none tabular-nums"
                  style={{ color: budgetColor, letterSpacing: '-0.02em' }}
                  initial={{ scale: 0.96, opacity: 0.7 }}
                  animate={{ scale: 1, opacity: 1 }}
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
                    <motion.div style={{ background: D.income, opacity: 0.85 }}
                      animate={{ width: `${savingsPct}%` }} transition={SPRING.BASE} />
                    <div className="flex-1 rounded-r-full" style={{ background: D.brand, opacity: 0.85 }} />
                  </div>
                  <div className="flex justify-between mt-1.5 text-[9px] font-semibold">
                    <span style={{ color: D.danger }}>固定費 {fixedPct.toFixed(0)}%</span>
                    {monthlySavings > 0 && <span style={{ color: D.income }}>貯蓄 {savingsPct.toFixed(0)}%</span>}
                    <span style={{ color: D.brand }}>使える {freePct.toFixed(0)}%</span>
                  </div>
                </div>

                {/* 内訳（読み取り専用） */}
                <div className="rounded-md p-3 mb-4 space-y-1.5 text-[11px]"
                  style={{ background: D.surface, cursor: 'default', userSelect: 'none' }}>
                  {[
                    { label: '月収',     value: state.monthlyIncome, color: D.text,   bold: false, hide: false },
                    { label: '固定費',   value: -totalFixed,         color: D.danger, bold: false, hide: false },
                    { label: '貯蓄目標', value: -monthlySavings,     color: D.income, bold: false, hide: monthlySavings === 0 },
                    { label: '使える額', value: disposable,           color: budgetColor, bold: true, hide: false },
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

                {/* サマリーチップ（読み取り専用 — 入力フォームとは異なるスタイル） */}
                <div className="grid grid-cols-2 gap-1.5" style={{ cursor: 'default', userSelect: 'none' }}>
                  {[
                    { label: '残高',   value: `¥${(state.currentBalance / 10000).toFixed(0)}万` },
                    { label: '給料日', value: `毎月${state.salaryDay}日` },
                    { label: '固定費', value: `¥${(totalFixed / 10000).toFixed(1)}万` },
                    {
                      label: '貯蓄目標',
                      value: monthlySavings > 0
                        ? (state.savingsMode === 'monthly'
                            ? `¥${(monthlySavings / 10000).toFixed(1)}万/月`
                            : `¥${(state.savingsYearly / 10000).toFixed(0)}万/年`)
                        : '未設定',
                    },
                  ].map((chip, i) => (
                    <motion.div key={chip.label} className="rounded-md p-2"
                      style={{ background: '#f0ede8' }}
                      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ ...SPRING.BASE, delay: 0.1 + i * 0.04 }}>
                      <div className="text-[9px] mb-0.5 font-semibold" style={{ color: 'rgba(28,20,16,0.35)' }}>{chip.label}</div>
                      <div className="text-xs font-extrabold" style={{ color: D.text }}>{chip.value}</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
            </motion.div>
            )}
            </AnimatePresence>

          </div>{/* /左カラム */}

          {/* ── Content column ──────────────────────────────────────────────── */}
          <div className="space-y-4 lg:col-start-2 lg:row-start-1">

            {/* SP top menu tabs */}
            <div
              className="flex rounded-md p-1 gap-1 lg:hidden"
              style={{ background: D.surface }}
              role="tablist"
              aria-label="設定メニュー"
            >
              {([
                { key: 'settings', label: '設定',   icon: Settings  },
                { key: 'guide',    label: 'ガイド', icon: BookOpen  },
              ] as const).map((item) => {
                const active = activeMenu === item.key
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveMenu(item.key)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-[12px] font-bold transition-colors"
                    style={{
                      background: active ? D.card : 'transparent',
                      color:      active ? D.brand : 'rgba(28,20,16,0.45)',
                      boxShadow:  active ? D.shadow : 'none',
                    }}
                  >
                    <item.icon size={13} strokeWidth={active ? 2.3 : 2} />
                    {item.label}
                  </button>
                )
              })}
            </div>

            {activeMenu === 'guide' ? (
              /* ── ガイドタブ ─────────────────────────────────────────────── */
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={SPRING.SMOOTH}
              >
                <SectionCard title="使い方ガイド" delay={0}>
                  <div>
                    {/* ホーム画面ガイド */}
                    <Link
                      to="/home?tour=1"
                      className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#fff6ee]"
                      style={{ textDecoration: 'none' }}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                        style={{ background: D.brandLight }}>
                        <BookOpen size={16} style={{ color: D.brand }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold" style={{ color: D.text }}>ホーム画面ガイド</div>
                        <div className="text-[11px] mt-0.5" style={{ color: D.muted }}>ホーム画面の使い方を案内します</div>
                      </div>
                      <ChevronRight size={14} style={{ color: D.muted, flexShrink: 0 }} />
                    </Link>

                    {/* 管理設定ガイド（近日公開） */}
                    <div className="flex items-center gap-3 px-4 py-3.5 opacity-50 cursor-not-allowed select-none border-t" style={{ borderColor: D.border }}>
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                        style={{ background: D.surface }}>
                        <Settings size={16} style={{ color: D.muted }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold" style={{ color: D.text }}>管理設定ガイド</div>
                        <div className="text-[11px] mt-0.5" style={{ color: D.muted }}>設定画面の使い方を案内します</div>
                      </div>
                      <span
                        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: D.surface, color: D.muted }}
                      >
                        近日公開
                      </span>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            ) : (
              /* ── 設定フォーム ────────────────────────────────────────────── */
              <>

            {/* ── SP: アカウント（マイページ代替） ───────────────────────────── */}
            <div className="lg:hidden rounded-md border overflow-hidden" style={{ background: D.card, borderColor: D.border, boxShadow: D.shadow }}>
              <div className="flex items-center gap-3 px-4 py-4">
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold text-white"
                  style={{ background: `linear-gradient(135deg, ${D.brand}, ${D.brandDeep})`, boxShadow: '0 2px 8px rgba(241,136,64,0.28)' }}
                >
                  Y
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold leading-tight" style={{ color: D.text }}>Yamamoto</div>
                  <div className="text-[11px] mt-0.5" style={{ color: D.muted }}>yamamoto@example.com</div>
                </div>
              </div>
              <div className="border-t px-4 py-3" style={{ borderColor: D.border }}>
                <button
                  type="button"
                  className="text-[13px] font-semibold"
                  style={{ color: D.danger }}
                >
                  ログアウト
                </button>
              </div>
            </div>

            {/* 給与 */}
            <SectionCard title="給与" delay={0.06} noClip>
              <div className="px-4 py-2.5">
                <SalaryDayPicker
                  value={state.salaryDay}
                  onChange={(v) => setState((s) => ({ ...s, salaryDay: v }))}
                />
              </div>
              <div className="px-4 pb-3.5 pt-3 border-t" style={{ borderColor: D.border }}>
                <FieldRow
                  icon={TrendingUp} label="月収（手取り）"
                  value={state.monthlyIncome}
                  onChange={(v) => setState((s) => ({ ...s, monthlyIncome: v }))}
                  step={10000}
                />
              </div>
            </SectionCard>

            {/* 固定費 */}
            <SectionCard title="固定費" delay={0.10}>
              <div className="px-4">
                {(Object.entries(state.fixedCosts) as [FixedKey, State['fixedCosts'][FixedKey]][]).map(
                  ([key, cfg], i, arr) => (
                    <div key={key}
                      className={`py-2.5 ${i < arr.length - 1 ? 'border-b' : ''}`}
                      style={{ borderColor: D.border }}>
                      <FieldRow icon={cfg.icon} label={cfg.label} value={cfg.value}
                        onChange={(v) => updateFixed(key, v)} step={cfg.step} />
                    </div>
                  )
                )}
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 border-t"
                style={{ background: '#fafaf8', borderColor: D.border }}>
                <span className="text-xs font-bold" style={{ color: D.muted }}>合計</span>
                <motion.span key={totalFixed} className="text-sm font-extrabold tabular-nums"
                  style={{ color: D.text }}
                  initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={SPRING.QUICK}>
                  ¥{totalFixed.toLocaleString('ja-JP')}
                </motion.span>
              </div>
            </SectionCard>

            {/* 残高 + 貯蓄目標 — 2-col grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* 残高 */}
              <SectionCard title="残高" delay={0.14}>
                <div className="px-4 py-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="flex h-6 w-6 items-center justify-center rounded-md"
                      style={{ background: D.surface }}>
                      <Wallet size={12} style={{ color: D.brand }} />
                    </div>
                    <span className="text-[11px] font-semibold" style={{ color: 'rgba(28,20,16,0.72)' }}>口座残高</span>
                  </div>
                  <AmountField
                    value={state.currentBalance}
                    onChange={(v) => setState((s) => ({ ...s, currentBalance: v }))}
                    step={10000}
                  />
                </div>
              </SectionCard>

              {/* 貯蓄目標 */}
              <SectionCard title="貯蓄目標" delay={0.16}>
                <div className="px-4 pt-3.5 pb-6 space-y-3">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md"
                      style={{ background: D.surface }}>
                      <PiggyBank size={14} style={{ color: D.brand }} />
                    </div>
                    <div
                      className="inline-flex rounded-md p-0.5 gap-0.5"
                      style={{ background: D.surface }}
                      role="tablist"
                      aria-label="貯蓄目標の期間"
                    >
                      {(['monthly', 'yearly'] as const).map((mode) => {
                        const active = state.savingsMode === mode
                        return (
                          <motion.button key={mode}
                            role="tab" aria-selected={active} type="button"
                            onClick={() => switchSavingsMode(mode)}
                            className="px-3 py-1 rounded-md text-xs font-bold"
                            style={{
                              background: active ? D.card    : 'transparent',
                              color:      active ? D.brand   : D.muted,
                              boxShadow:  active ? D.shadow  : 'none',
                            }}
                            whileTap={{ scale: 0.95 }}
                            transition={SPRING.SNAP}
                          >
                            {mode === 'monthly' ? '月間' : '年間'}
                          </motion.button>
                        )
                      })}
                    </div>
                  </div>

                  <AmountField
                    value={state.savingsMode === 'monthly' ? state.savingsMonthly : state.savingsYearly}
                    onChange={(v) =>
                      setState((s) => ({
                        ...s,
                        [s.savingsMode === 'monthly' ? 'savingsMonthly' : 'savingsYearly']: v,
                      }))
                    }
                    step={state.savingsMode === 'monthly' ? 5000 : 60000}
                    suffix={state.savingsMode === 'monthly' ? '/ 月' : '/ 年'}
                  />

                  <AnimatePresence>
                    {(state.savingsMode === 'monthly' ? state.savingsMonthly : state.savingsYearly) > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{    opacity: 0, height: 0 }}
                        transition={SPRING.QUICK}
                        className="text-[11px] font-semibold"
                        style={{ color: D.income }}
                      >
                        ≈ ¥{(state.savingsMode === 'monthly'
                          ? state.savingsMonthly * 12
                          : Math.round(state.savingsYearly / 12)
                        ).toLocaleString('ja-JP')}
                        {state.savingsMode === 'monthly' ? ' / 年' : ' / 月'}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SectionCard>
            </div>

            {/* 保存 */}
            <motion.button type="button"
              className="w-full py-4 rounded-md text-sm font-extrabold text-white"
              style={{ background: D.brand, boxShadow: `0 4px 20px ${D.brand}40` }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              transition={SPRING.SNAP}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
            >
              設定を保存する
            </motion.button>
              </>
            )}
          </div>

        </div>
        </main>

        <Toast visible={saved} />
    </SandboxLayout>
  )
}
