/**
 * MeisaiPrototype — 明細ページ試作
 *
 * 責務: 全記録の閲覧・検索。リスト ⇄ カレンダー切替。
 * - 期間フィルタ（全期間/今月/先月/直近7日）
 * - テキスト検索
 * - リストビュー: 日付グループ表示
 * - カレンダービュー: May 2026 固定、記録ドット、選択日の記録表示
 */

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, LayoutList, CalendarDays } from 'lucide-react'
import { D } from '../components/SandboxCard'
import { SandboxLayout } from '../components/SandboxLayout'

const SPRING = {
  SNAP:   { type: 'spring', stiffness: 600, damping: 35 },
  QUICK:  { type: 'spring', stiffness: 400, damping: 30 },
  BASE:   { type: 'spring', stiffness: 300, damping: 28 },
  SMOOTH: { type: 'spring', stiffness: 200, damping: 26 },
} as const

// ── Mock data ──────────────────────────────────────────────────────────────────
type Tx = { id: number; date: string; label: string; category: string; amount: number; color: string }

const ALL_TX: Tx[] = [
  // 5月
  { id:1,  date:'2026-05-16', label:'スーパー',           category:'食費',     amount:-1280,  color:'#f18840' },
  { id:2,  date:'2026-05-16', label:'電車',               category:'交通費',   amount:-550,   color:'#8b7cf8' },
  { id:3,  date:'2026-05-15', label:'Netflix',            category:'サブスク', amount:-990,   color:'#f59e0b' },
  { id:4,  date:'2026-05-15', label:'カフェ',             category:'外食',     amount:-480,   color:'#e8622a' },
  { id:5,  date:'2026-05-14', label:'ドラッグストア',     category:'日用品',   amount:-1580,  color:'#8b7cf8' },
  { id:6,  date:'2026-05-13', label:'ランチ',             category:'外食',     amount:-850,   color:'#e8622a' },
  { id:7,  date:'2026-05-13', label:'ICカードチャージ',   category:'交通費',   amount:-2000,  color:'#8b7cf8' },
  { id:8,  date:'2026-05-12', label:'スーパー',           category:'食費',     amount:-3200,  color:'#f18840' },
  { id:9,  date:'2026-05-11', label:'ドラッグストア',     category:'日用品',   amount:-1200,  color:'#8b7cf8' },
  { id:10, date:'2026-05-10', label:'給与',               category:'収入',     amount:252600, color:'#35b5a2' },
  { id:11, date:'2026-05-10', label:'スーパー',           category:'食費',     amount:-2400,  color:'#f18840' },
  { id:12, date:'2026-05-08', label:'電気代',             category:'光熱費',   amount:-8200,  color:'#35b5a2' },
  { id:13, date:'2026-05-05', label:'家賃',               category:'住居費',   amount:-85000, color:'#35b5a2' },
  { id:14, date:'2026-05-03', label:'保険料',             category:'保険',     amount:-8000,  color:'#f43f5e' },
  { id:15, date:'2026-05-01', label:'サブスク類',         category:'サブスク', amount:-5000,  color:'#f59e0b' },
  // 4月
  { id:16, date:'2026-04-30', label:'スーパー',           category:'食費',     amount:-2800,  color:'#f18840' },
  { id:17, date:'2026-04-25', label:'ガス代',             category:'光熱費',   amount:-4500,  color:'#35b5a2' },
  { id:18, date:'2026-04-20', label:'外食',               category:'外食',     amount:-3200,  color:'#e8622a' },
  { id:19, date:'2026-04-15', label:'ランチ',             category:'外食',     amount:-850,   color:'#e8622a' },
  { id:20, date:'2026-04-10', label:'給与',               category:'収入',     amount:252600, color:'#35b5a2' },
  { id:21, date:'2026-04-10', label:'電気代',             category:'光熱費',   amount:-7800,  color:'#35b5a2' },
  { id:22, date:'2026-04-05', label:'家賃',               category:'住居費',   amount:-85000, color:'#35b5a2' },
  { id:23, date:'2026-04-03', label:'スーパー',           category:'食費',     amount:-3600,  color:'#f18840' },
  { id:24, date:'2026-04-01', label:'サブスク類',         category:'サブスク', amount:-5000,  color:'#f59e0b' },
]

// ── 期間フィルタ ────────────────────────────────────────────────────────────────
type Period = 'week' | 'month' | 'lastMonth' | 'all'

// 直近→過去→全期間 の順で表示
const PERIOD_ORDER: Period[] = ['week', 'month', 'lastMonth', 'all']

const PERIOD_LABELS: Record<Period, string> = {
  week:      '直近7日',
  month:     '今月',
  lastMonth: '先月',
  all:       '全期間',
}

function filterByPeriod(txs: Tx[], period: Period): Tx[] {
  if (period === 'all') return txs
  if (period === 'month') return txs.filter(t => t.date.startsWith('2026-05'))
  if (period === 'lastMonth') return txs.filter(t => t.date.startsWith('2026-04'))
  // week: 2026-05-10 〜 2026-05-16
  return txs.filter(t => t.date >= '2026-05-10' && t.date <= '2026-05-16')
}

// ── 日付グルーピング ────────────────────────────────────────────────────────────
type DateGroup = { date: string; items: Tx[]; dailyTotal: number }

function groupByDate(txs: Tx[]): DateGroup[] {
  const map = new Map<string, Tx[]>()
  for (const tx of txs) {
    if (!map.has(tx.date)) map.set(tx.date, [])
    map.get(tx.date)!.push(tx)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      items,
      dailyTotal: items.reduce((s, t) => s + t.amount, 0),
    }))
}

function formatDateLabel(dateStr: string): string {
  const TODAY     = '2026-05-16'
  const YESTERDAY = '2026-05-15'
  const [, m, d] = dateStr.split('-')
  const base = `${Number(m)}月${Number(d)}日`
  if (dateStr === TODAY)     return `${base}（今日）`
  if (dateStr === YESTERDAY) return `${base}（昨日）`
  return base
}

// ── カレンダービュー用ユーティリティ ────────────────────────────────────────────
// 記録がある日（5月）の日番号セット
function getDaysWithRecords(txs: Tx[]): Set<number> {
  const days = new Set<number>()
  txs.filter(t => t.date.startsWith('2026-05')).forEach(t => {
    days.add(Number(t.date.split('-')[2]))
  })
  return days
}

// 選択日の記録を取得
function getTxForDay(txs: Tx[], day: number): Tx[] {
  const dateStr = `2026-05-${String(day).padStart(2, '0')}`
  return txs.filter(t => t.date === dateStr)
}

// ── 曜日ヘッダー ─────────────────────────────────────────────────────────────
const WEEK_DAYS = ['日', '月', '火', '水', '木', '金', '土']

// May 2026: 1日 = 金曜（日曜始まり index = 5）、31日間
const MAY_START_IDX = 5 // 金曜
const MAY_DAYS      = 31

// ── カレンダー週定義（6行 × 7列） ──────────────────────────────────────────────
// May 2026: 1日=金曜（日曜始まり idx=5）
const CALENDAR_WEEKS: Array<Array<number | null>> = [
  [null, null, null, null, null, 1,  2 ],
  [3,    4,    5,    6,    7,    8,  9 ],
  [10,   11,   12,   13,   14,   15, 16], // 第3週（今週、5/16=今日）
  [17,   18,   19,   20,   21,   22, 23],
  [24,   25,   26,   27,   28,   29, 30],
  [31,   null, null, null, null, null, null],
]
const WEEK_BUDGET = 26600 // 週予算

// ── Main ──────────────────────────────────────────────────────────────────────
export function MeisaiPrototype() {
  const [searchParams] = useSearchParams()
  const initialPeriod = (PERIOD_ORDER.includes(searchParams.get('period') as Period)
    ? searchParams.get('period') as Period
    : 'week')
  const [period, setPeriod]   = useState<Period>(initialPeriod)
  const [view, setView]       = useState<'list' | 'calendar'>('list')
  const [query, setQuery]     = useState('')
  const [selectedDay, setSelectedDay] = useState<number | null>(16)
  const [calView, setCalView] = useState<'month' | 'week'>('month')
  const [weekIdx, setWeekIdx] = useState(2) // 初期値: 第3週（May 10-16）

  // 期間フィルタ → テキスト検索
  const filtered = filterByPeriod(ALL_TX, period).filter(tx => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return tx.label.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q)
  })

  const groups       = groupByDate(filtered)
  const daysWithRecs = getDaysWithRecords(ALL_TX)

  // カレンダー: 6週 × 7 = 42マスのセル配列
  // インデックス 0..4 = 空白（5月は金曜始まり）
  const calendarCells: Array<number | null> = []
  for (let i = 0; i < MAY_START_IDX; i++) calendarCells.push(null)
  for (let d = 1; d <= MAY_DAYS; d++) calendarCells.push(d)
  while (calendarCells.length < 42) calendarCells.push(null)

  const selectedDayTxs = selectedDay !== null ? getTxForDay(ALL_TX, selectedDay) : []

  // 週ビュー: 現在の週の日配列・支出合計
  const currentWeekDays = CALENDAR_WEEKS[weekIdx]
  const weekExpense = currentWeekDays.reduce((sum, day) => {
    if (day === null) return sum
    return sum + ALL_TX
      .filter(t => t.date === `2026-05-${String(day).padStart(2, '0')}` && t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0)
  }, 0)

  // 日別支出合計（週ビューのカードに使用）
  function getDayExpense(day: number): number {
    return ALL_TX
      .filter(t => t.date === `2026-05-${String(day).padStart(2, '0')}` && t.amount < 0)
      .reduce((s, t) => s + Math.abs(t.amount), 0)
  }

  return (
    <SandboxLayout currentPage="meisai" bottomNavVariant="fab">

        {/* ── スティッキーコントロール ──────────────────────────────────────── */}
        <div
          className="sticky top-0 z-10"
          style={{
            background:     'rgba(255,253,245,0.96)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* 行1: 期間フィルタ + リスト/カレンダー切替 */}
          <div className="flex items-center gap-2 px-4 pt-2 pb-1.5 md:px-6">
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {PERIOD_ORDER.map(p => {
              const active = period === p
              return (
                <motion.button key={p} type="button"
                  onClick={() => setPeriod(p)}
                  className="rounded-full px-3 py-1.5 text-[12px] font-bold shrink-0"
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
          {/* リスト / カレンダー切替トグル */}
          <div
            className="flex items-center gap-0.5 rounded-md p-0.5 shrink-0"
            style={{ background: D.surface }}
          >
            {([
              { v: 'list'     as const, Icon: LayoutList  },
              { v: 'calendar' as const, Icon: CalendarDays },
            ]).map(({ v, Icon }) => (
              <motion.button key={v} type="button"
                onClick={() => setView(v)}
                className="flex h-7 w-7 items-center justify-center rounded-md"
                style={{
                  background: view === v ? D.card       : 'transparent',
                  color:      view === v ? D.brand      : D.muted,
                  boxShadow:  view === v ? D.shadow     : 'none',
                }}
                whileTap={{ scale: 0.90 }}
                transition={SPRING.SNAP}
                aria-label={v === 'list' ? 'リスト表示' : 'カレンダー表示'}
              >
                <Icon size={14} />
              </motion.button>
            ))}
          </div>
        </div>

          {/* 行2: 検索バー */}
          <div className="px-4 pb-2 md:px-6">
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2"
              style={{ background: D.surface, border: `1px solid ${D.border}` }}
            >
              <Search size={13} style={{ color: D.muted, flexShrink: 0 }} />
              <input
                type="search"
                placeholder="ラベル・カテゴリで検索"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-[13px] outline-none"
                style={{ color: D.text }}
              />
            </div>
          </div>
        </div>

        <main className="px-4 py-4 md:px-6">
        <AnimatePresence mode="wait">

          {/* ── リストビュー ────────────────────────────────────────────────── */}
          {view === 'list' && (
            <motion.div key="list"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -4 }}
              transition={SPRING.QUICK}
              className="space-y-3"
            >
              {groups.length === 0 && (
                <div className="py-16 text-center text-[13px]" style={{ color: D.muted }}>
                  記録が見つかりません
                </div>
              )}
              {groups.map((g, gi) => (
                <motion.div key={g.date}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...SPRING.BASE, delay: gi * 0.03 }}
                  className="rounded-md overflow-hidden"
                  style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                >
                  {/* グループヘッダー */}
                  <div
                    className="flex items-center justify-between px-4 py-2.5 border-b"
                    style={{ borderColor: D.border, background: D.surface }}
                  >
                    <span className="text-[12px] font-extrabold" style={{ color: D.text }}>
                      {formatDateLabel(g.date)}
                    </span>
                    <span
                      className="text-[11px] font-bold tabular-nums"
                      style={{ color: g.dailyTotal >= 0 ? D.income : D.muted }}
                    >
                      {g.dailyTotal >= 0
                        ? `+¥${g.dailyTotal.toLocaleString('ja-JP')}`
                        : `−¥${Math.abs(g.dailyTotal).toLocaleString('ja-JP')}`}
                    </span>
                  </div>
                  {/* アイテムリスト */}
                  {g.items.map((tx, ti) => (
                    <div key={tx.id}
                      className={`flex items-center gap-3 px-4 py-2.5 ${ti < g.items.length - 1 ? 'border-b' : ''}`}
                      style={{ borderColor: D.border }}
                    >
                      <div
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ background: tx.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-bold truncate" style={{ color: D.text }}>
                          {tx.label}
                        </div>
                        <div className="text-[10px] font-semibold" style={{ color: D.muted }}>
                          {tx.category}
                        </div>
                      </div>
                      <div
                        className="text-[13px] font-extrabold tabular-nums shrink-0"
                        style={{ color: tx.amount >= 0 ? D.income : D.text }}
                      >
                        {tx.amount >= 0
                          ? `+¥${tx.amount.toLocaleString('ja-JP')}`
                          : `−¥${Math.abs(tx.amount).toLocaleString('ja-JP')}`}
                      </div>
                    </div>
                  ))}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── カレンダービュー ─────────────────────────────────────────────── */}
          {view === 'calendar' && (
            <motion.div key="calendar"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{    opacity: 0, y: -4 }}
              transition={SPRING.QUICK}
              className="space-y-4"
            >
              {/* カレンダーカード */}
              <div
                className="rounded-md overflow-hidden"
                style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
              >
                {/* ヘッダー: ナビ + 月/週トグル */}
                <div
                  className="flex items-center justify-between px-4 py-3 border-b"
                  style={{ borderColor: D.border }}
                >
                  {/* 前へ */}
                  <button type="button"
                    onClick={() => {
                      if (calView === 'month') return
                      setWeekIdx(i => Math.max(0, i - 1))
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-bold"
                    style={{
                      background: D.surface,
                      color: (calView === 'week' && weekIdx > 0) ? D.text : D.muted,
                      opacity: calView === 'week' && weekIdx === 0 ? 0.35 : 1,
                    }}
                    aria-label={calView === 'month' ? '前月' : '前の週'}
                  >
                    ‹
                  </button>

                  {/* タイトル */}
                  <span className="text-[14px] font-extrabold" style={{ color: D.text }}>
                    {calView === 'month'
                      ? '2026年5月'
                      : `2026年5月 第${weekIdx + 1}週`}
                  </span>

                  {/* 右側: 次へ + 月/週トグル */}
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => {
                        if (calView === 'month') return
                        setWeekIdx(i => Math.min(CALENDAR_WEEKS.length - 1, i + 1))
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] font-bold"
                      style={{
                        background: D.surface,
                        color: (calView === 'week' && weekIdx < CALENDAR_WEEKS.length - 1) ? D.text : D.muted,
                        opacity: calView === 'week' && weekIdx === CALENDAR_WEEKS.length - 1 ? 0.35 : 1,
                      }}
                      aria-label={calView === 'month' ? '翌月' : '次の週'}
                    >
                      ›
                    </button>

                    {/* 月 / 週 トグル */}
                    <div
                      className="flex items-center rounded-md overflow-hidden"
                      style={{ background: D.surface, padding: '2px' }}
                    >
                      {(['month', 'week'] as const).map(cv => (
                        <button key={cv} type="button"
                          onClick={() => setCalView(cv)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-md transition-colors"
                          style={{
                            background: calView === cv ? D.brand : 'transparent',
                            color:      calView === cv ? '#fff'  : D.muted,
                          }}
                        >
                          {cv === 'month' ? '月' : '週'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── 月ビュー ── */}
                <AnimatePresence mode="wait">
                  {calView === 'month' && (
                    <motion.div key="month-grid"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="px-3 pt-2 pb-3"
                    >
                      {/* 曜日ヘッダー */}
                      <div className="grid grid-cols-7 mb-1">
                        {WEEK_DAYS.map((wd) => (
                          <div key={wd}
                            className="text-center text-[10px] font-bold py-1"
                            style={{ color: D.muted }}
                          >
                            {wd}
                          </div>
                        ))}
                      </div>
                      {/* 日グリッド */}
                      <div className="grid grid-cols-7 gap-y-1">
                        {calendarCells.map((day, idx) => {
                          if (day === null) return <div key={`empty-${idx}`} />
                          const hasRec     = daysWithRecs.has(day)
                          const isSelected = selectedDay === day
                          const isToday    = day === 16
                          return (
                            <button key={day} type="button"
                              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                              className="flex flex-col items-center justify-center gap-0.5 rounded-md py-1.5"
                              style={{
                                background: isSelected ? D.brand : 'transparent',
                                color:      isSelected ? '#fff'  : D.text,
                                outline:    isToday && !isSelected ? `2px solid ${D.brand}` : 'none',
                                outlineOffset: '-2px',
                              }}
                            >
                              <span className="text-[12px] font-bold leading-none">{day}</span>
                              {hasRec ? (
                                <span
                                  className="h-1 w-1 rounded-full"
                                  style={{ background: isSelected ? 'rgba(255,255,255,0.7)' : D.brand }}
                                />
                              ) : (
                                <span className="h-1 w-1" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* ── 週ビュー ── */}
                  {calView === 'week' && (
                    <motion.div key={`week-${weekIdx}`}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                      transition={SPRING.QUICK}
                      className="px-4 pt-3 pb-4 space-y-3"
                    >
                      {/* 週支出プログレスバー */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-semibold" style={{ color: D.muted }}>
                            今週の支出
                          </span>
                          <span className="text-[11px] font-extrabold tabular-nums" style={{ color: D.text }}>
                            ¥{weekExpense.toLocaleString('ja-JP')}
                            <span className="font-semibold" style={{ color: D.muted }}>
                              {' '}/ ¥{WEEK_BUDGET.toLocaleString('ja-JP')}
                            </span>
                          </span>
                        </div>
                        <div
                          className="h-2 w-full rounded-full overflow-hidden"
                          style={{ background: D.surface }}
                        >
                          <motion.div
                            className="h-full rounded-full"
                            style={{
                              background: weekExpense / WEEK_BUDGET > 0.85
                                ? '#f43f5e'
                                : `linear-gradient(90deg, ${D.brand}, ${D.brandDeep})`,
                            }}
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (weekExpense / WEEK_BUDGET) * 100)}%` }}
                            transition={SPRING.SMOOTH}
                          />
                        </div>
                      </div>

                      {/* 7日カード行 */}
                      <div className="grid grid-cols-7 gap-1">
                        {currentWeekDays.map((day, colIdx) => {
                          if (day === null) {
                            return (
                              <div key={`null-${colIdx}`}
                                className="flex flex-col items-center gap-0.5 rounded-md py-2"
                                style={{ background: D.surface, opacity: 0.3 }}
                              >
                                <span className="text-[9px] font-bold" style={{ color: D.muted }}>
                                  {WEEK_DAYS[colIdx]}
                                </span>
                                <span className="text-[13px] font-extrabold" style={{ color: D.muted }}>—</span>
                              </div>
                            )
                          }
                          const isSelected = selectedDay === day
                          const isToday    = day === 16
                          const expense    = getDayExpense(day)
                          return (
                            <motion.button key={day} type="button"
                              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
                              className="flex flex-col items-center gap-0.5 rounded-md py-2"
                              style={{
                                background: isSelected ? D.brand : D.surface,
                                outline:    isToday && !isSelected ? `2px solid ${D.brand}` : 'none',
                                outlineOffset: '-2px',
                              }}
                              whileTap={{ scale: 0.93 }}
                              transition={SPRING.SNAP}
                            >
                              <span
                                className="text-[9px] font-bold"
                                style={{ color: isSelected ? 'rgba(255,255,255,0.75)' : D.muted }}
                              >
                                {WEEK_DAYS[colIdx]}
                              </span>
                              <span
                                className="text-[13px] font-extrabold leading-none"
                                style={{ color: isSelected ? '#fff' : D.text }}
                              >
                                {day}
                              </span>
                              <span
                                className="text-[9px] font-bold tabular-nums leading-none mt-0.5"
                                style={{
                                  color: isSelected
                                    ? 'rgba(255,255,255,0.85)'
                                    : expense > 0 ? D.brand : 'transparent',
                                }}
                              >
                                {expense > 0 ? `¥${(expense / 1000).toFixed(1)}k` : '・'}
                              </span>
                            </motion.button>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* 選択日の記録 */}
              <AnimatePresence mode="wait">
                {selectedDay !== null && (
                  <motion.div
                    key={selectedDay}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{    opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="rounded-md overflow-hidden"
                    style={{ background: D.card, border: `1px solid ${D.border}`, boxShadow: D.shadow }}
                  >
                    <div
                      className="flex items-center justify-between px-4 py-2.5 border-b"
                      style={{
                        borderColor: D.border,
                        background: selectedDay === 16 ? D.brandLight : D.surface,
                      }}
                    >
                      <span className="text-[12px] font-extrabold" style={{ color: selectedDay === 16 ? D.brand : D.text }}>
                        5月{selectedDay}日の記録
                        {selectedDay === 16 && (
                          <span className="ml-1.5 text-[10px] font-bold" style={{ color: D.brand }}>今日</span>
                        )}
                      </span>
                      <span className="text-[11px] font-bold" style={{ color: D.muted }}>
                        {selectedDayTxs.length}件
                      </span>
                    </div>
                    {selectedDayTxs.length === 0 ? (
                      <div className="py-8 text-center text-[12px]" style={{ color: D.muted }}>
                        この日の記録はありません
                      </div>
                    ) : (
                      selectedDayTxs.map((tx, ti) => (
                        <div key={tx.id}
                          className={`flex items-center gap-3 px-4 py-2.5 ${ti < selectedDayTxs.length - 1 ? 'border-b' : ''}`}
                          style={{ borderColor: D.border }}
                        >
                          <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: tx.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-bold truncate" style={{ color: D.text }}>
                              {tx.label}
                            </div>
                            <div className="text-[10px] font-semibold" style={{ color: D.muted }}>
                              {tx.category}
                            </div>
                          </div>
                          <div
                            className="text-[13px] font-extrabold tabular-nums shrink-0"
                            style={{ color: tx.amount >= 0 ? D.income : D.text }}
                          >
                            {tx.amount >= 0
                              ? `+¥${tx.amount.toLocaleString('ja-JP')}`
                              : `−¥${Math.abs(tx.amount).toLocaleString('ja-JP')}`}
                          </div>
                        </div>
                      ))
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

        </AnimatePresence>
        </main>

    </SandboxLayout>
  )
}
