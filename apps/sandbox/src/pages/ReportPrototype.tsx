/**
 * ReportPrototype — レポートページ試作（刷新版）
 *
 * 責務: 収支サマリー + カテゴリ別分析のみ。記録一覧なし。
 */

import { Link } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Receipt, BarChart2, Settings,
  Bell, ArrowRight,
} from 'lucide-react'
import { EXPENSE_CATEGORY_TOKENS as ET } from '../tokens/categoryTokens'

// ── Design tokens ──────────────────────────────────────────────────────────────
const D = {
  bg:         '#fffdf5',
  card:       '#ffffff',
  text:       '#1c1410',
  muted:      'rgba(28,20,16,0.45)',
  border:     'rgba(28,20,16,0.08)',
  shadow:     '0 2px 12px rgba(28,20,16,0.08), 0 0 0 1px rgba(28,20,16,0.06)',
  brand:      '#f18840',
  brandDeep:  '#e8622a',
  brandLight: '#fff6ee',
  income:     '#35b5a2',
  danger:     '#f43f5e',
  surface:    '#f5f3ef',
} as const

const SPRING = {
  SNAP:   { type: 'spring', stiffness: 600, damping: 35 },
  QUICK:  { type: 'spring', stiffness: 400, damping: 30 },
  BASE:   { type: 'spring', stiffness: 300, damping: 28 },
  SMOOTH: { type: 'spring', stiffness: 200, damping: 26 },
} as const

// ── Nav ────────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { label: 'ホーム',   icon: Home,     to: '/home',              active: false },
  { label: '明細',     icon: Receipt,  to: '/meisai',            active: false },
  { label: 'レポート', icon: BarChart2, to: '/report',            active: true  },
  { label: '設定',     icon: Settings, to: '/personal-settings', active: false },
] as const

// ── Mock data ──────────────────────────────────────────────────────────────────
type Period = 'week' | 'month' | 'lastMonth'

// 直近→過去 の順で表示
const PERIOD_ORDER: Period[] = ['week', 'month', 'lastMonth']

const PERIOD_LABELS: Record<Period, string> = {
  week:      '直近7日',
  month:     '今月',
  lastMonth: '先月',
}

const SUMMARY: Record<Period, { income: number; expense: number }> = {
  month:     { income: 252600, expense: 131200 },
  lastMonth: { income: 252600, expense: 142800 },
  week:      { income:   2000, expense:  45600  },
}

type CategoryData = { label: string; amount: number; color: string }

// ラベルは複合表示用（housing と utility をまとめる）、色は主カテゴリの SSOT トークンから取得
const CATEGORIES: Record<Period, CategoryData[]> = {
  month: [
    { label: '住居・光熱費',   amount: 45200, color: ET.housing.color  },
    { label: '食費・スーパー', amount: 32400, color: ET.food.color     },
    { label: '外食・カフェ',   amount: 21600, color: ET.dining.color   },
    { label: '交通費',         amount: 15200, color: ET.transport.color },
    { label: '医療・保険',     amount: 10000, color: ET.medical.color  },
    { label: '通信・サブスク', amount:  6800, color: ET.telecom.color  },
  ],
  lastMonth: [
    { label: '住居・光熱費',   amount: 45200, color: ET.housing.color  },
    { label: '食費・スーパー', amount: 38200, color: ET.food.color     },
    { label: '外食・カフェ',   amount: 25600, color: ET.dining.color   },
    { label: '交通費',         amount: 16200, color: ET.transport.color },
    { label: '医療・保険',     amount: 11200, color: ET.medical.color  },
    { label: '通信・サブスク', amount:  6400, color: ET.telecom.color  },
  ],
  week: [
    { label: '食費・スーパー', amount: 15200, color: ET.food.color     },
    { label: '外食・カフェ',   amount: 12000, color: ET.dining.color   },
    { label: '住居・光熱費',   amount:  9600, color: ET.housing.color  },
    { label: '交通費',         amount:  5200, color: ET.transport.color },
    { label: '医療・保険',     amount:  2100, color: ET.medical.color  },
    { label: '通信・サブスク', amount:  1500, color: ET.telecom.color  },
  ],
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function ReportPrototype() {
  const [period, setPeriod] = useState<Period>('week')

  const summary  = SUMMARY[period]
  const cats     = CATEGORIES[period]
  const balance  = summary.income - summary.expense

  // 先月比（今月のみ）
  const vsLastPct = period === 'month'
    ? Math.round((summary.expense / SUMMARY.lastMonth.expense) * 100)
    : null

  return (
    <>
      {/* ── PC サイドバー ──────────────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-30 w-52 border-r"
        style={{ background: D.card, borderColor: D.border }}
      >
        <div className="flex h-14 shrink-0 items-center gap-2.5 border-b px-4" style={{ borderColor: D.border }}>
          <img src="/logo192.png" alt="家計かんり" className="h-8 w-8 shrink-0" style={{ borderRadius: '10px' }} />
          <span className="text-[15px] font-extrabold tracking-tight" style={{ color: D.text }}>家計かんり</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5" aria-label="メインメニュー">
          {NAV_ITEMS.map((item) => (
            <Link key={item.label} to={item.to}
              aria-current={item.active ? 'page' : undefined}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-[13px] font-semibold"
              style={{
                borderRadius:   '10px',
                background:     item.active ? D.brandLight : 'transparent',
                color:          item.active ? D.brand : 'rgba(28,20,16,0.50)',
                textDecoration: 'none',
              }}
            >
              <item.icon size={17} aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="shrink-0 border-t px-3 py-2.5 flex items-center justify-between" style={{ borderColor: D.border }}>
          <button type="button" className="flex h-8 w-8 items-center justify-center"
            style={{ color: 'rgba(28,20,16,0.45)', borderRadius: '8px' }} aria-label="通知">
            <Bell size={17} />
          </button>
          <Link to="/my-page"
            className="flex h-8 w-8 items-center justify-center text-[12px] font-extrabold text-white"
            style={{
              background: `linear-gradient(135deg, ${D.brand}, ${D.brandDeep})`,
              borderRadius: '9999px',
              boxShadow: '0 2px 8px rgba(241,136,64,0.30)',
              textDecoration: 'none',
            }}
            aria-label="マイページ">Y</Link>
        </div>
      </aside>

      <div className="min-h-screen pb-24 lg:pb-8 lg:pl-52" style={{ background: D.bg }}>

        {/* ── SP: ベル + アバター ─────────────────────────────────────────── */}
        <div className="lg:hidden flex items-center justify-end gap-2 px-4 pt-3 pb-1">
          <button type="button" className="flex h-8 w-8 items-center justify-center"
            style={{ color: 'rgba(28,20,16,0.45)', borderRadius: '8px' }} aria-label="通知">
            <Bell size={17} />
          </button>
          <Link to="/my-page"
            className="flex h-8 w-8 items-center justify-center text-[12px] font-extrabold text-white"
            style={{
              background: `linear-gradient(135deg, ${D.brand}, ${D.brandDeep})`,
              borderRadius: '9999px',
              boxShadow: '0 2px 8px rgba(241,136,64,0.30)',
              textDecoration: 'none',
            }}
            aria-label="マイページ">Y</Link>
        </div>

        {/* ── スティッキー期間タブ ─────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10 border-b"
          style={{
            background:     'rgba(255,253,245,0.96)',
            backdropFilter: 'blur(10px)',
            borderColor:    D.border,
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2 md:px-6">
            <span className="text-[14px] font-extrabold shrink-0" style={{ color: D.text }}>レポート</span>
            <div className="flex gap-1 ml-2">
              {PERIOD_ORDER.map(p => {
                const active = period === p
                return (
                  <motion.button key={p} type="button"
                    onClick={() => setPeriod(p)}
                    className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                    style={{
                      background: active ? D.brand : D.surface,
                      color:      active ? '#fff'  : D.muted,
                    }}
                    whileTap={{ scale: 0.93 }}
                    transition={SPRING.SNAP}
                  >
                    {PERIOD_LABELS[p]}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        <main className="px-4 py-4 md:px-6 space-y-4">
        <AnimatePresence mode="wait">
          <motion.div key={period}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{    opacity: 0, y: -4 }}
            transition={SPRING.QUICK}
            className="space-y-4"
          >

            {/* ── 収支サマリーカード ────────────────────────────────────────── */}
            <div
              className="rounded-2xl p-5"
              style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
            >
              {/* タイトル */}
              <div className="text-[12px] font-bold mb-3" style={{ color: D.muted }}>
                {PERIOD_LABELS[period]}の収支
              </div>

              <div className="flex items-end justify-between gap-4">
                {/* 支出合計（大） */}
                <div>
                  <div className="text-[11px] font-bold mb-1" style={{ color: D.muted }}>支出合計</div>
                  <motion.div
                    key={`expense-${period}`}
                    className="text-[40px] font-extrabold tabular-nums leading-none"
                    style={{ color: D.text }}
                    initial={{ scale: 0.94, opacity: 0.6 }}
                    animate={{ scale: 1,    opacity: 1   }}
                    transition={SPRING.QUICK}
                  >
                    ¥{summary.expense.toLocaleString('ja-JP')}
                  </motion.div>

                  {/* 先月比チップ（今月のみ） */}
                  {vsLastPct !== null && (
                    <motion.div
                      className="mt-2 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                      style={{
                        background: vsLastPct < 100 ? '#ecfaf8' : '#fff1f2',
                        color:      vsLastPct < 100 ? D.income   : D.danger,
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1   }}
                      transition={SPRING.BASE}
                    >
                      {vsLastPct < 100
                        ? `先月比 ▼${100 - vsLastPct}% 節約しています`
                        : `▲ 先月より${vsLastPct - 100}% 増加`}
                    </motion.div>
                  )}
                </div>

                {/* 収入 + 収支差引（右） */}
                <div className="text-right space-y-2 shrink-0">
                  <div>
                    <div className="text-[10px] font-bold" style={{ color: D.muted }}>収入</div>
                    <div className="text-[16px] font-extrabold tabular-nums" style={{ color: D.income }}>
                      +¥{summary.income.toLocaleString('ja-JP')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold" style={{ color: D.muted }}>収支差引</div>
                    <div
                      className="text-[16px] font-extrabold tabular-nums"
                      style={{ color: balance >= 0 ? D.income : D.danger }}
                    >
                      {balance >= 0
                        ? `+¥${balance.toLocaleString('ja-JP')}`
                        : `−¥${Math.abs(balance).toLocaleString('ja-JP')}`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── カテゴリ別支出カード ─────────────────────────────────────── */}
            <div
              className="rounded-2xl p-4"
              style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-[13px] font-extrabold" style={{ color: D.text }}>カテゴリ別支出</span>
                <span className="text-[11px] font-semibold" style={{ color: D.muted }}>
                  合計 ¥{summary.expense.toLocaleString('ja-JP')}
                </span>
              </div>

              {/* 積み上げカラーバー */}
              <div className="flex h-3 rounded-full overflow-hidden gap-px mb-4">
                {cats.map((cat) => (
                  <motion.div
                    key={cat.label}
                    style={{ background: cat.color }}
                    animate={{ width: `${(cat.amount / summary.expense) * 100}%` }}
                    transition={SPRING.BASE}
                  />
                ))}
              </div>

              {/* カテゴリリスト */}
              <div className="space-y-3">
                {cats.map((cat, i) => {
                  const pct = (cat.amount / summary.expense) * 100
                  return (
                    <motion.div key={cat.label}
                      className="flex items-center gap-3"
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ ...SPRING.BASE, delay: i * 0.04 }}
                    >
                      {/* カラードット */}
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: cat.color }}
                      />
                      {/* ラベル */}
                      <span className="w-28 text-[12px] font-semibold truncate shrink-0" style={{ color: D.text }}>
                        {cat.label}
                      </span>
                      {/* プログレスバー */}
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: D.surface }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: cat.color }}
                          animate={{ width: `${pct}%` }}
                          transition={SPRING.BASE}
                        />
                      </div>
                      {/* % */}
                      <span className="text-[10px] font-bold tabular-nums w-8 text-right shrink-0" style={{ color: D.muted }}>
                        {pct.toFixed(0)}%
                      </span>
                      {/* 金額 */}
                      <span className="text-[12px] font-extrabold tabular-nums w-16 text-right shrink-0" style={{ color: D.text }}>
                        ¥{(cat.amount / 10000).toFixed(1)}万
                      </span>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* ── フッター: 明細へのリンク ─────────────────────────────────── */}
            <Link to="/meisai"
              className="flex items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold"
              style={{
                background:     D.brandLight,
                border:         `1.5px solid rgba(241,136,64,0.24)`,
                color:          D.brand,
                textDecoration: 'none',
              }}
            >
              詳細な記録を見る
              <ArrowRight size={14} />
            </Link>

          </motion.div>
        </AnimatePresence>
        </main>

        {/* ── SP モバイルボトムナビ ──────────────────────────────────────────── */}
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
              <Link key={item.label} to={item.to}
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

      </div>
    </>
  )
}
