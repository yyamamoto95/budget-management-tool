/**
 * SandboxNav — Sandbox 全ページ共通フローティングナビ
 *
 * - ドラッグで自由移動（framer-motion drag）
 * - ギャラリーへ戻る / 前後プロトタイプへ移動
 */

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LayoutGrid, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

const PAGES: { path: string; label: string }[] = [
  { path: '/home',                      label: 'ホーム画面' },
  { path: '/category-ab',              label: '支出カテゴリ TOP A/B' },
  { path: '/personal-settings',        label: '個人設定 — 現行' },
  { path: '/settings-wizard',          label: '個人設定 B — ウィザード' },
  { path: '/meisai',                   label: '明細' },
  { path: '/report',                   label: 'レポート' },
  { path: '/status-color-palette',     label: 'ステータスカラー' },
  { path: '/savings-forecast-palette', label: '貯蓄予測カラー' },
  { path: '/today-status-palette',     label: '今日の状況カラー' },
  { path: '/category-color-palette',   label: 'カテゴリカラー定義' },
  { path: '/my-page',                  label: 'マイページ' },
]

export function SandboxNav() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  // ギャラリー自体では表示しない
  if (pathname === '/') return null

  const currentIdx = PAGES.findIndex((p) => p.path === pathname)
  const current = PAGES[currentIdx]
  const prev = currentIdx > 0 ? PAGES[currentIdx - 1] : null
  const next = currentIdx < PAGES.length - 1 ? PAGES[currentIdx + 1] : null

  return (
    <motion.div
      drag
      dragMomentum={false}
      className="fixed bottom-4 left-3 z-50 flex flex-col items-start gap-1 select-none"
      style={{ touchAction: 'none' }}
      whileDrag={{ scale: 1.04 }}
    >
      {/* ページ一覧ドロップアップ */}
      {open && (
        <div
          className="mb-1 rounded-xl border py-1 shadow-lg"
          style={{
            background: 'rgba(255,253,245,0.97)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(28,20,16,0.10)',
            boxShadow: '0 8px 24px rgba(28,20,16,0.14)',
            maxHeight: '60vh',
            overflowY: 'auto',
            minWidth: 200,
          }}
        >
          {PAGES.map((p) => (
            <Link
              key={p.path}
              to={p.path}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold transition-colors hover:bg-[#fff6ee]"
              style={{
                color: p.path === pathname ? '#f18840' : 'rgba(28,20,16,0.7)',
              }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: p.path === pathname ? '#f18840' : 'transparent' }}
              />
              {p.label}
            </Link>
          ))}
        </div>
      )}

      {/* コントロールバー */}
      <div
        className="flex items-center gap-1 rounded-full px-2 py-1.5 cursor-grab active:cursor-grabbing"
        style={{
          background: 'rgba(28,20,16,0.72)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 8px rgba(28,20,16,0.25)',
        }}
      >
        {/* ギャラリーへ */}
        <Link
          to="/"
          title="ギャラリーへ戻る"
          className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
        >
          <LayoutGrid size={13} className="text-white" />
        </Link>

        <span className="mx-0.5 text-white/20 text-xs" aria-hidden="true">|</span>

        {/* 前へ */}
        {prev ? (
          <Link
            to={prev.path}
            title={prev.label}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
          >
            <ChevronLeft size={13} className="text-white" />
          </Link>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center opacity-20">
            <ChevronLeft size={13} className="text-white" />
          </span>
        )}

        {/* 現在ページ名 + ドロップアップトグル */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 rounded-full px-2 transition-colors hover:bg-white/20"
          style={{ maxWidth: 120 }}
        >
          <span className="truncate text-[11px] font-bold text-white" style={{ maxWidth: 90 }}>
            {current?.label ?? pathname}
          </span>
          {open
            ? <ChevronDown  size={11} className="shrink-0 text-white/70" />
            : <ChevronUp    size={11} className="shrink-0 text-white/70" />
          }
        </button>

        {/* 次へ */}
        {next ? (
          <Link
            to={next.path}
            title={next.label}
            className="flex h-6 w-6 items-center justify-center rounded-full transition-colors hover:bg-white/20"
          >
            <ChevronRight size={13} className="text-white" />
          </Link>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center opacity-20">
            <ChevronRight size={13} className="text-white" />
          </span>
        )}
      </div>
    </motion.div>
  )
}
