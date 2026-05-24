/**
 * ReportPrototype — レポートページ試作（刷新版）
 *
 * 責務: 収支サマリー + カテゴリ別分析のみ。記録一覧なし。
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { EXPENSE_CATEGORY_TOKENS as ET } from '../tokens/categoryTokens'
import { D } from '../components/SandboxCard'
import { SandboxLayout } from '../components/SandboxLayout'
import { SandboxLinkButton } from '../components/SandboxButton'

const SPRING = {
  SNAP:   { type: 'spring', stiffness: 600, damping: 35 },
  QUICK:  { type: 'spring', stiffness: 400, damping: 30 },
  BASE:   { type: 'spring', stiffness: 300, damping: 28 },
  SMOOTH: { type: 'spring', stiffness: 200, damping: 26 },
} as const

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
    <SandboxLayout currentPage="report">

        {/* ── スティッキー期間タブ ─────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10"
          style={{
            background:     'rgba(255,253,245,0.96)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className="flex items-center gap-2 px-4 py-2 md:px-6">
            <div className="flex gap-1">
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
              className="rounded-md p-5"
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
              className="rounded-md p-4"
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
            <SandboxLinkButton to="/records" variant="ghost">
              詳細な記録を見る
              <ArrowRight size={14} />
            </SandboxLinkButton>

          </motion.div>
        </AnimatePresence>
        </main>

    </SandboxLayout>
  )
}
