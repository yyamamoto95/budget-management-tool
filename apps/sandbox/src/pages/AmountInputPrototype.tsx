/**
 * AmountInputPrototype — 金額入力 UX 改善（先頭ゼロ問題の根治）
 *
 * 課題:
 *   現行 AmountField は編集中の文字列を手書きで捌いており、
 *   「0」に数字を打つと「05000」のように先頭ゼロが残る／消せない不具合が出る。
 *   parseAmountInput の正規表現は対症療法。
 *
 * 方針（確定）:
 *   - react-number-format（masked currency input のデファクト）で共通化し、
 *     桁区切り・先頭ゼロ除去・キャレット制御をライブラリに委譲する。
 *   - 設定画面は「保存済みの状態」なので 0 は ¥0 を実値表示。
 *     数字を打つと先頭ゼロが構造的に発生しない（ライブラリが正規化）。
 *
 * このページで新旧を並べて挙動を確認する。
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { NumericFormat } from 'react-number-format'
import { ChevronLeft, Minus, Plus, Check, X } from 'lucide-react'
import { D } from '../components/designTokens'

const SPRING = { type: 'spring', stiffness: 600, damping: 35 } as const

// ═══════════════════════════════════════════════════════════════════════════
// NEW: react-number-format ベースの共通 AmountField
// ═══════════════════════════════════════════════════════════════════════════
function AmountFieldNew({
  value,
  onChange,
  step = 1000,
  min = 0,
  max,
  prefix = '¥',
  suffix,
  thousandSeparator = true,
  label,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
  min?: number
  max?: number
  prefix?: string
  suffix?: string
  /** 給料日など桁区切り不要なフィールドは false */
  thousandSeparator?: boolean
  label?: string
}) {
  const [focused, setFocused] = useState(false)
  const clamp = (n: number) => Math.max(min, max != null ? Math.min(n, max) : n)
  const atMin = value <= min
  const atMax = max != null && value >= max

  // 非活性時は淡色化＋カーソルで「これ以上押せない」ことを明示する
  const stepperStyle = (disabled: boolean) => ({
    background: D.surface,
    color: D.muted,
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  })

  return (
    <div className="flex items-center gap-1">
      <motion.button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md select-none transition-opacity"
        style={stepperStyle(atMin)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(clamp(value - step))}
        disabled={atMin}
        whileTap={atMin ? undefined : { scale: 0.85 }}
        transition={SPRING}
        aria-label={`${step.toLocaleString('ja-JP')}減らす`}
      >
        <Minus size={16} />
      </motion.button>

      <div
        className="flex flex-1 items-center gap-1.5 rounded-md border px-3 py-2 transition-colors"
        style={{
          borderColor: focused ? D.brand : D.border,
          background: focused ? D.brandLight : D.surface,
        }}
      >
        {prefix && (
          <span className="shrink-0 text-xs font-semibold" style={{ color: D.muted }}>
            {prefix}
          </span>
        )}
        <NumericFormat
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold tabular-nums outline-none"
          style={{ color: D.text }}
          value={value}
          // 桁区切り表示。decimalScale=0 で整数のみ。allowNegative=false で符号禁止。
          thousandSeparator={thousandSeparator ? ',' : undefined}
          decimalScale={0}
          allowNegative={false}
          // allowLeadingZeros 未指定（=false）でライブラリが先頭ゼロを正規化する
          inputMode="numeric"
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            onChange(clamp(value)) // 範囲外の手入力を blur で丸める
          }}
          onValueChange={(v) => {
            // floatValue は空のとき undefined。空欄は 0 扱い。
            onChange(v.floatValue ?? 0)
          }}
        />
        {suffix && (
          <span className="shrink-0 text-xs font-medium" style={{ color: D.muted }}>
            {suffix}
          </span>
        )}
      </div>

      <motion.button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md select-none transition-opacity"
        style={stepperStyle(atMax)}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(clamp(value + step))}
        disabled={atMax}
        whileTap={atMax ? undefined : { scale: 0.85 }}
        transition={SPRING}
        aria-label={`${step.toLocaleString('ja-JP')}増やす`}
      >
        <Plus size={16} />
      </motion.button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// OLD: 現行の手書き AmountField（先頭ゼロ不具合あり・比較用にそのまま再現）
// ═══════════════════════════════════════════════════════════════════════════
function AmountFieldOld({
  value,
  onChange,
  step = 1000,
}: {
  value: number
  onChange: (v: number) => void
  step?: number
}) {
  const [focused, setFocused] = useState(false)
  const [raw, setRaw] = useState('')

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md select-none"
        style={{ background: D.surface, color: D.muted }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(Math.max(0, value - step))}
      >
        <Minus size={16} />
      </button>
      <div
        className="flex flex-1 items-center gap-1.5 rounded-md border px-3 py-2"
        style={{
          borderColor: focused ? D.brand : D.border,
          background: focused ? D.brandLight : D.surface,
        }}
      >
        <span className="shrink-0 text-xs font-semibold" style={{ color: D.muted }}>¥</span>
        <input
          type="text"
          inputMode="numeric"
          className="min-w-0 flex-1 bg-transparent text-right text-sm font-bold tabular-nums outline-none"
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
      </div>
      <button
        type="button"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md select-none"
        style={{ background: D.surface, color: D.muted }}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => onChange(value + step)}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}

// ─── 部品 ──────────────────────────────────────────────────────────────────
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-5" style={{ background: D.card, borderColor: D.border }}>
      <h2 className="mb-4 text-sm font-bold" style={{ color: D.text }}>{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 text-xs font-semibold" style={{ color: D.muted }}>{label}</div>
      {children}
    </div>
  )
}

// ─── ページ本体 ──────────────────────────────────────────────────────────────
export function AmountInputPrototype() {
  // NEW 側
  const [income, setIncome] = useState(252600)
  const [rent, setRent] = useState(85000)
  const [fixedZero, setFixedZero] = useState(0) // ¥0 の状態表示デモ
  const [payday, setPayday] = useState(25)
  // OLD 側
  const [oldIncome, setOldIncome] = useState(252600)
  const [oldZero, setOldZero] = useState(0)

  return (
    <div className="min-h-screen p-6" style={{ background: D.bg }}>
      <div className="mx-auto max-w-3xl">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1 text-xs font-semibold"
          style={{ color: D.muted, textDecoration: 'none' }}
        >
          <ChevronLeft size={14} /> Gallery へ戻る
        </Link>

        <h1 className="mb-1 text-xl font-extrabold" style={{ color: D.text }}>
          金額入力 UX 改善 — 先頭ゼロ問題の根治
        </h1>
        <p className="mb-6 text-xs leading-relaxed" style={{ color: D.muted }}>
          react-number-format で共通化。桁区切り・先頭ゼロ除去・キャレット制御をライブラリに委譲する。
          設定画面は「保存済みの状態」なので 0 は ¥0 を実値表示し、数字を打つと先頭ゼロが構造的に発生しない。
        </p>

        {/* 新方式 */}
        <div className="mb-5">
          <Card title="✅ 新方式（react-number-format）">
            <Row label="月収（手取り）— ¥ + 桁区切り + 1,000 ステップ">
              <AmountFieldNew value={income} onChange={setIncome} step={1000} label="月収（手取り）" />
            </Row>
            <Row label="家賃 — ¥ + 桁区切り">
              <AmountFieldNew value={rent} onChange={setRent} step={1000} label="家賃" />
            </Row>
            <Row label="その他固定費 — 値が ¥0 のケース（数字を打つと先頭ゼロにならず置換される）">
              <AmountFieldNew value={fixedZero} onChange={setFixedZero} step={500} label="その他固定費" />
            </Row>
            <Row label="給料日 — 桁区切りなし・1〜31 にクランプ・日 サフィックス">
              <AmountFieldNew
                value={payday}
                onChange={setPayday}
                step={1}
                min={1}
                max={31}
                prefix=""
                suffix="日"
                thousandSeparator={false}
                label="給料日"
              />
            </Row>
            <p className="mt-3 text-[11px]" style={{ color: D.muted }}>
              現在値: 月収 {income.toLocaleString('ja-JP')} / 家賃 {rent.toLocaleString('ja-JP')} /
              その他 {fixedZero.toLocaleString('ja-JP')} / 給料日 {payday} 日
            </p>
          </Card>
        </div>

        {/* 旧方式 */}
        <div className="mb-6">
          <Card title="❌ 現行方式（手書き・比較用）">
            <Row label="月収 — フォーカスして全選択→数字、や 0 の先頭ゼロを試すと崩れる">
              <AmountFieldOld value={oldIncome} onChange={setOldIncome} step={1000} />
            </Row>
            <Row label="その他固定費（¥0）— フォーカスすると 0 が出て、数字を打つと 05000 になる">
              <AmountFieldOld value={oldZero} onChange={setOldZero} step={500} />
            </Row>
            <p className="mt-3 text-[11px]" style={{ color: D.muted }}>
              現在値: 月収 {oldIncome.toLocaleString('ja-JP')} / その他 {oldZero.toLocaleString('ja-JP')}
            </p>
          </Card>
        </div>

        {/* 挙動チェックリスト */}
        <Card title="確認ポイント">
          <ul className="space-y-2 text-xs" style={{ color: D.text }}>
            {[
              ['先頭ゼロが発生しない（¥0 に「5000」を打つと 5,000 になる）', true],
              ['桁区切りが入力中も常時表示される', true],
              ['マイナス・小数・全角は弾かれる', true],
              ['± ステッパーで増減でき、min/max を超えない', true],
              ['下限/上限に達した側のボタンは淡色＋not-allowed で非活性化される', true],
              ['給料日は桁区切りなし・31 超で丸まる', true],
              ['対症療法の正規表現 / 手書き raw 状態が不要になる', true],
            ].map(([text, ok]) => (
              <li key={text as string} className="flex items-start gap-2">
                <span
                  className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{ background: ok ? D.income : D.danger, color: '#fff' }}
                >
                  {ok ? <Check size={11} /> : <X size={11} />}
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  )
}
