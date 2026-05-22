/**
 * HomeTour — framer-motion カスタムオンボーディング
 *
 * - Driver.js を廃止し、React + framer-motion で自前実装
 * - スポットライト（box-shadow クリップ）+ リッチポップオーバー
 * - Cookie で完了状態を管理（本実装ではサーバーが Set-Cookie）
 * - ステップ定義は src/tours/homeTourSteps.ts (SSOT)
 */

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { HOME_TOUR_STEPS, type TourStepDef } from '../tours/homeTourSteps'

// ── Cookie ヘルパー ─────────────────────────────────────────────────────────
// 本実装ではサーバーがログイン時に Set-Cookie するため、
// クライアント側はこの読み取りロジックのみ残る想定
const COOKIE_KEY = 'home_tour_done_v1'

function getCookie(name: string): string | undefined {
  return document.cookie
    .split('; ')
    .find(row => row.startsWith(name + '='))
    ?.split('=')[1]
}

function setCookie(name: string, value: string, maxAgeSeconds = 365 * 24 * 3600) {
  document.cookie = `${name}=${value}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax`
}

// ── スポットライト Rect ──────────────────────────────────────────────────────
type SpotRect = { x: number; y: number; w: number; h: number }

const SPOT_PADDING = 8

function getTargetRect(selector: string): SpotRect | null {
  const el = document.querySelector(selector)
  if (!el) return null
  const r = el.getBoundingClientRect()
  return {
    x: r.left - SPOT_PADDING,
    y: r.top  - SPOT_PADDING,
    w: r.width  + SPOT_PADDING * 2,
    h: r.height + SPOT_PADDING * 2,
  }
}

// ── ポップオーバー位置計算 ────────────────────────────────────────────────────
const POPOVER_W_MAX = 320
const POPOVER_H     = 260   // 概算高さ（スペース不足チェック用）
const POPOVER_GAP   = 14

/** ビューポート幅に応じたポップオーバー幅を返す */
function getPopoverW(): number {
  if (typeof window === 'undefined') return POPOVER_W_MAX
  return Math.min(POPOVER_W_MAX, window.innerWidth - 32)
}

function calcPopoverPos(
  spotRect: SpotRect | null,
  side: TourStepDef['side'],
  popoverW: number,
): { left: number; top: number } {
  const vw = window.innerWidth
  const vh = window.innerHeight

  // ターゲットなし / center → ビューポート中央
  if (!spotRect || side === 'center') {
    return {
      left: Math.max(16, (vw - popoverW) / 2),
      top:  Math.max(16, (vh - POPOVER_H) / 2),
    }
  }

  const { x, y, w, h } = spotRect
  const cx = x + w / 2
  const clampX = (v: number) => Math.max(16, Math.min(vw - popoverW - 16, v))

  // スペース不足のとき自動反転
  const spaceBelow = vh - (y + h)
  const spaceAbove = y
  let preferred = side
  if (side === 'bottom' && spaceBelow < POPOVER_H + POPOVER_GAP && spaceAbove > spaceBelow) {
    preferred = 'top'
  } else if (side === 'top' && spaceAbove < POPOVER_H + POPOVER_GAP && spaceBelow > spaceAbove) {
    preferred = 'bottom'
  }

  if (preferred === 'bottom') {
    return { left: clampX(cx - popoverW / 2), top: y + h + POPOVER_GAP }
  }
  if (preferred === 'top') {
    return { left: clampX(cx - popoverW / 2), top: Math.max(16, y - POPOVER_H - POPOVER_GAP) }
  }
  if (preferred === 'right') {
    return { left: Math.min(vw - popoverW - 16, x + w + POPOVER_GAP), top: Math.max(16, y + h / 2 - POPOVER_H / 2) }
  }
  // left
  return { left: Math.max(16, x - popoverW - POPOVER_GAP), top: Math.max(16, y + h / 2 - POPOVER_H / 2) }
}

// ── メインコンポーネント ──────────────────────────────────────────────────────
export function HomeTour() {
  const [active,  setActive]  = useState(false)
  const [stepIdx, setStepIdx] = useState(0)
  const [spotRect, setSpotRect] = useState<SpotRect | null>(null)
  const [dir, setDir] = useState<1 | -1>(1)
  const [searchParams, setSearchParams] = useSearchParams()

  const step  = HOME_TOUR_STEPS[stepIdx]
  const total = HOME_TOUR_STEPS.length

  // ターゲット要素を中央スクロール → 400ms後に Rect 取得
  const updateSpot = useCallback(() => {
    if (!step.selector) { setSpotRect(null); return }
    const rect = getTargetRect(step.selector)
    setSpotRect(rect)
  }, [step.selector])

  useEffect(() => {
    if (!active) return
    if (step.selector) {
      const el = document.querySelector(step.selector)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      const t = setTimeout(updateSpot, 380)
      return () => clearTimeout(t)
    }
    // selector なし（全画面暗転）の場合は非同期でリセット
    const t = setTimeout(() => setSpotRect(null), 0)
    return () => clearTimeout(t)
  }, [active, stepIdx, step.selector, updateSpot])

  useEffect(() => {
    if (!active) return
    window.addEventListener('resize', updateSpot)
    return () => window.removeEventListener('resize', updateSpot)
  }, [active, updateSpot])

  function startTour() {
    setStepIdx(0)
    setDir(1)
    setActive(true)
  }

  function closeTour() {
    // 本実装: ログイン時にサーバーが Set-Cookie する
    // サンドボックス: クライアントで代替
    setCookie(COOKIE_KEY, '1')
    setActive(false)
    setSpotRect(null)
  }

  function next() {
    if (stepIdx < total - 1) { setDir(1); setStepIdx(s => s + 1) }
    else closeTour()
  }

  function prev() {
    if (stepIdx > 0) { setDir(-1); setStepIdx(s => s - 1) }
  }

  // 初回訪問時に自動スタート（Cookie 未設定 = 未完了）
  useEffect(() => {
    if (!getCookie(COOKIE_KEY)) {
      const t = setTimeout(startTour, 800)
      return () => clearTimeout(t)
    }
  }, [])

  // ?tour=1 で設定ページのガイドタブから起動
  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      const t = setTimeout(() => {
        startTour()
        setSearchParams({}, { replace: true })
      }, 600)
      return () => clearTimeout(t)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // スポットライト: ターゲットなし時はビューポート中央に 0×0 → 全体暗転
  const vw = typeof window !== 'undefined' ? window.innerWidth  : 0
  const vh = typeof window !== 'undefined' ? window.innerHeight : 0
  const isLargeScreen = vw >= 1024
  // PC では sidePC を優先、SP では side を使用
  const effectiveSide = (isLargeScreen && step.sidePC) ? step.sidePC : step.side
  // SP ではビューポート幅に収まるよう縮小
  const popoverW   = getPopoverW()
  const animSpot  = spotRect ?? { x: vw / 2, y: vh / 2, w: 0, h: 0 }
  const popoverPos = calcPopoverPos(spotRect, effectiveSide, popoverW)

  const Icon = step.icon

  return (
    <>
      {/* ポータル: オーバーレイ + スポットライト + ポップオーバー */}
      {active && createPortal(
        <AnimatePresence>
          {active && (
            <motion.div
              key="tour-root"
              className="fixed inset-0"
              style={{ zIndex: 9900, pointerEvents: 'none' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* クリックで閉じる透明レイヤー */}
              <div
                className="absolute inset-0"
                style={{ pointerEvents: 'auto' }}
                onClick={closeTour}
              />

              {/*
               * スポットライト:
               * box-shadow が 9999px のシャドウを外側に広げ、
               * div 自体のエリア = ハイライト領域 として機能する
               */}
              <motion.div
                className="absolute rounded-xl"
                style={{
                  pointerEvents: 'none',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.52)',
                  zIndex: 1,
                }}
                animate={{
                  left:   animSpot.x,
                  top:    animSpot.y,
                  width:  animSpot.w,
                  height: animSpot.h,
                }}
                transition={{ type: 'spring', stiffness: 240, damping: 28 }}
              />

              {/* ポップオーバー */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={stepIdx}
                  className="absolute overflow-hidden rounded-2xl bg-white"
                  style={{
                    width:        popoverW,
                    left:         popoverPos.left,
                    top:          popoverPos.top,
                    pointerEvents: 'auto',
                    zIndex:        2,
                    boxShadow:    '0 24px 64px rgba(0,0,0,0.20), 0 0 0 1px rgba(0,0,0,0.06)',
                  }}
                  initial={{ opacity: 0, y: dir > 0 ? 14 : -14, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{    opacity: 0, y: dir > 0 ? -14 : 14, scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* ── ヘッダー ────────────────────────────────────────────── */}
                  <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                    <div className="flex items-start gap-3">
                      {/* アイコン */}
                      <motion.div
                        key={`icon-${stepIdx}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: step.iconBg }}
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 28, delay: 0.06 }}
                      >
                        <Icon size={20} style={{ color: step.iconColor }} strokeWidth={2} />
                      </motion.div>

                      {/* タイトル + 頻度バッジ */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        {step.freq && (
                          <div
                            className="mb-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide"
                            style={{ background: step.iconBg, color: step.iconColor }}
                          >
                            {step.freq}
                          </div>
                        )}
                        <h3 className="text-sm font-bold leading-tight text-[#1c1410]">
                          {step.title}
                        </h3>
                      </div>

                      {/* 閉じるボタン */}
                      <button
                        type="button"
                        onClick={closeTour}
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-[#f5f5f5]"
                        aria-label="ガイドを閉じる"
                      >
                        <X size={13} style={{ color: '#1c1410', opacity: 0.35 }} />
                      </button>
                    </div>

                    {/* 説明文 */}
                    <p className="mt-3 text-xs leading-relaxed text-[#1c1410]/60 whitespace-pre-line">
                      {step.description}
                    </p>
                  </div>

                  {/* ── フッター ─────────────────────────────────────────────── */}
                  <div className="flex items-center justify-between px-5 py-3">
                    {/* ドットインジケーター */}
                    <div className="flex items-center gap-1.5">
                      {HOME_TOUR_STEPS.map((_, i) => (
                        <motion.div
                          key={i}
                          className="h-1.5 rounded-full"
                          animate={{
                            width:      i === stepIdx ? 16 : 5,
                            background: i === stepIdx ? step.iconColor : 'rgba(28,20,16,0.14)',
                          }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      ))}
                    </div>

                    {/* ナビゲーションボタン */}
                    <div className="flex items-center gap-1.5">
                      {stepIdx > 0 && (
                        <button
                          type="button"
                          onClick={prev}
                          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-[#f5f5f5]"
                          aria-label="前へ"
                        >
                          <ChevronLeft size={16} style={{ color: '#1c1410', opacity: 0.45 }} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={next}
                        className="flex h-8 items-center gap-1 rounded-full px-4 text-xs font-bold text-white transition-opacity hover:opacity-85"
                        style={{ background: step.iconColor }}
                      >
                        {stepIdx === 0
                          ? '始める'
                          : stepIdx === total - 1
                            ? '完了'
                            : '次へ'}
                        {stepIdx < total - 1 && <ChevronRight size={13} strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  )
}
