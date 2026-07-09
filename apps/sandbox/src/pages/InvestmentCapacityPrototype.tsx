/**
 * InvestmentCapacityPrototype — 投資余力診断カード（#543）
 *
 * ホーム画面（生活余力カードの下）に追加する「投資余力」カードのプロトタイプ。
 * 仕様: .github/spec/investment-business-basics.md「MVP スコープ 1: 投資余力診断」
 *
 * - 数字が主役・事実のみのトーン（生活余力カードと同系）
 * - 「今月は投資を控える」も正しい結果として肯定的に表示する（急かさない・煽らない）
 * - 投資可能額があるときのみ investment-analysis-tool へのディープリンク CTA を出す
 *   （渡すのは risk_tolerance と monthly_limit のみ。PII は渡さない）
 *
 * 算出ロジックは packages/common/src/utils/investmentCapacity.ts（実装済み）。
 * sandbox は common 非依存のため、ここでは同じ式をデモ用に再掲している。
 * ホバー依存の UI は使わない（スマホレビュー前提。タップのみで全操作できる）。
 */

import { useState } from 'react'
import {
  TrendingUp,
  PiggyBank,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronRight,
  Lightbulb,
  Bell,
  Tags,
  Wallet,
} from 'lucide-react'

const D = {
  bg: '#fffdf5',
  card: '#ffffff',
  text: '#1c1410',
  muted: 'rgba(28,20,16,0.42)',
  border: 'rgba(28,20,16,0.08)',
  brand: '#f18840',
  brandLight: '#fff6ee',
  income: '#4caf82',
  incomeLight: '#f0fdf6',
  caution: '#e8927c',
} as const

// ---- 算出ロジック（本番: @budget/common calculateInvestmentCapacity）----
// 初期仮設定: 防衛資金目標 6 ヶ月分 / 黒字の 50% を投資余力 / 充足率 2.0↑ mid・3.0↑ high
const TARGET_MONTHS = 6
const SURPLUS_RATIO = 0.5

type RiskTolerance = 'low' | 'mid' | 'high'

type Diagnosis = {
  monthlyLimitJpy: number
  riskTolerance: RiskTolerance
  emergencyFundRatio: number
  emergencyFundTargetJpy: number
  shouldHold: boolean
}

function diagnose(totalAssets: number, monthlyIncome: number, avgDailyExpense: number): Diagnosis {
  const monthlyExpense = avgDailyExpense * 30
  const target = monthlyExpense * TARGET_MONTHS
  const ratio = totalAssets / target
  if (ratio < 1.0) {
    return {
      monthlyLimitJpy: 0,
      riskTolerance: 'low',
      emergencyFundRatio: ratio,
      emergencyFundTargetJpy: target,
      shouldHold: true,
    }
  }
  const surplus = Math.max(0, monthlyIncome - monthlyExpense) * SURPLUS_RATIO
  const limit = Math.floor(surplus / 1000) * 1000
  const tolerance: RiskTolerance = ratio >= 3.0 ? 'high' : ratio >= 2.0 ? 'mid' : 'low'
  return {
    monthlyLimitJpy: limit,
    riskTolerance: tolerance,
    emergencyFundRatio: ratio,
    emergencyFundTargetJpy: target,
    shouldHold: limit <= 0,
  }
}

const TOLERANCE_LABELS: Record<RiskTolerance, string> = {
  low: '低（安定重視）',
  mid: '中（バランス）',
  high: '高（変動を許容）',
}

// ---- デモ用シナリオ ----
type Preset = {
  name: string
  emoji: string
  note: string
  totalAssets: number
  monthlyIncome: number
  avgDailyExpense: number
}

const PRESETS: Preset[] = [
  {
    name: '余裕のある家計',
    emoji: '🌱',
    note: '備え 2 倍・月 6 万円の黒字 → 投資上限が表示される',
    totalAssets: 2_880_000,
    monthlyIncome: 300_000,
    avgDailyExpense: 8_000,
  },
  {
    name: '備えがまだ途中の家計',
    emoji: '🛡️',
    note: '黒字はあるが備えが目標の 83% → 「控える月」になる',
    totalAssets: 1_200_000,
    monthlyIncome: 300_000,
    avgDailyExpense: 8_000,
  },
  {
    name: '今月が赤字の家計',
    emoji: '📉',
    note: '備えは十分だが支出超過 → 「控える月」になる',
    totalAssets: 2_880_000,
    monthlyIncome: 200_000,
    avgDailyExpense: 8_000,
  },
]

function yen(value: number): string {
  return `¥${value.toLocaleString()}`
}

/** 見出し（ステップ番号つき） */
function StepHeading({ step, title, note }: { step: number; title: string; note?: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
        style={{ background: D.brand }}
      >
        {step}
      </span>
      <div>
        <p className="text-sm font-extrabold" style={{ color: D.text }}>
          {title}
        </p>
        {note && (
          <p className="text-[11px]" style={{ color: D.muted }}>
            {note}
          </p>
        )}
      </div>
    </div>
  )
}

/** ホームの既存カードのダミー（掲載位置を伝えるための飾り） */
function ExistingCardGhost() {
  return (
    <div
      className="rounded-2xl border border-dashed p-4"
      style={{ borderColor: 'rgba(28,20,16,0.18)', background: 'rgba(255,255,255,0.55)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: D.text, opacity: 0.45 }}>
          生活余力
        </span>
        <PiggyBank size={14} aria-hidden style={{ color: D.text, opacity: 0.25 }} />
      </div>
      <p className="mt-1 text-sm font-bold" style={{ color: D.text, opacity: 0.35 }}>
        生活費 4.0 ヶ月分（既存カード）
      </p>
    </div>
  )
}

/** 本命: 投資余力カード（LivingMarginCard と同じシェルトーン） */
function CapacityCard({ diagnosis }: { diagnosis: Diagnosis }) {
  const ratioPct = Math.min(diagnosis.emergencyFundRatio, 1.0) * 100
  const deepLink = diagnosis.shouldHold
    ? null
    : `https://<investment-analysis-tool>/?risk_tolerance=${diagnosis.riskTolerance}&monthly_limit=${diagnosis.monthlyLimitJpy}`
  return (
    <div
      className="rounded-2xl border p-4"
      style={{ background: D.card, borderColor: D.border, boxShadow: '0 1px 4px rgba(28,20,16,0.06)' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-bold" style={{ color: D.text }}>
          投資余力
        </span>
        <TrendingUp size={14} aria-hidden style={{ color: D.text, opacity: 0.42 }} />
      </div>

      {diagnosis.shouldHold ? (
        <>
          <p className="text-lg font-black" style={{ color: D.text }}>
            今月は投資を控える月
          </p>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: D.muted }}>
            {diagnosis.emergencyFundRatio < 1.0
              ? `生活の備え（目標 ${yen(diagnosis.emergencyFundTargetJpy)}）が ${Math.round(
                  diagnosis.emergencyFundRatio * 100
                )}% です。まずは備えを整える段階です。`
              : '今月は支出が収入を上回るペースです。投資より家計の立て直しが先の段階です。'}
          </p>
        </>
      ) : (
        <>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold" style={{ color: D.text, opacity: 0.6 }}>
              今月の上限
            </span>
            <span className="text-3xl font-black tabular-nums" style={{ color: D.text, letterSpacing: '-0.02em' }}>
              {diagnosis.monthlyLimitJpy.toLocaleString()}
            </span>
            <span className="text-sm font-semibold" style={{ color: D.text, opacity: 0.6 }}>
              円
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold" style={{ color: D.income }}>
            リスク許容度: {TOLERANCE_LABELS[diagnosis.riskTolerance]}
          </p>
        </>
      )}

      {/* 生活防衛資金の充足バー（事実のみ。色は良好=income / 注意=caution） */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]" style={{ color: D.muted }}>
          <span>生活の備え（生活費 {TARGET_MONTHS} ヶ月分が目安）</span>
          <span className="tabular-nums">{Math.round(diagnosis.emergencyFundRatio * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: D.border }}>
          <div
            className="h-full rounded-full"
            style={{
              width: `${ratioPct}%`,
              background: diagnosis.emergencyFundRatio >= 1.0 ? D.income : D.caution,
            }}
          />
        </div>
      </div>

      {deepLink && (
        <a
          href={deepLink}
          onClick={(e) => e.preventDefault()}
          className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold"
          style={{ borderColor: D.border, color: D.text, background: D.brandLight }}
        >
          <ExternalLink size={12} aria-hidden />
          この条件で戦略の過去検証を見る
        </a>
      )}

      <p className="mt-3 text-[10px] leading-relaxed" style={{ color: D.muted }}>
        診断は家計の記録に基づく目安であり、投資成果を保証するものではありません。
        投資判断はご自身の責任で行ってください。
      </p>
    </div>
  )
}

/** 設定画面のモック: 「診断のしくみ」は知りたい人だけが開く「ちなみに」トーンの補足 */
function SettingsMock() {
  const [open, setOpen] = useState(true)
  const ghostRows = [
    { icon: Bell, label: '通知' },
    { icon: Tags, label: 'カテゴリ管理' },
    { icon: Wallet, label: '総資産・固定費' },
  ]
  return (
    <div
      className="flex flex-col gap-3 rounded-3xl p-4"
      style={{ background: 'rgba(28,20,16,0.035)' }}
    >
      <div className="overflow-hidden rounded-2xl border" style={{ borderColor: D.border, background: D.card }}>
        {/* 既存の設定行（ダミー） */}
        {ghostRows.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-3 border-b px-4 py-3"
            style={{ borderColor: D.border, opacity: 0.4 }}
          >
            <Icon size={16} style={{ color: D.text }} aria-hidden />
            <span className="flex-1 text-sm font-semibold" style={{ color: D.text }}>
              {label}
            </span>
            <ChevronRight size={14} style={{ color: D.muted }} aria-hidden />
          </div>
        ))}
        {/* 本命: 投資余力診断のしくみ（タップで開閉） */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3 text-left"
        >
          <TrendingUp size={16} style={{ color: D.brand }} aria-hidden />
          <span className="flex-1 text-sm font-semibold" style={{ color: D.text }}>
            投資余力診断のしくみ
          </span>
          <ChevronDown
            size={14}
            style={{ color: D.muted, transform: open ? 'rotate(180deg)' : undefined }}
            aria-hidden
          />
        </button>
        {open && (
          <div className="px-4 pb-4">
            {/* 「ちなみに」トーンの補足カード: 読まなくても困らない、脚注のような佇まい */}
            <div
              className="rounded-xl px-3.5 py-3"
              style={{ background: 'rgba(28,20,16,0.04)' }}
            >
              <p className="flex items-center gap-1.5 text-xs font-bold" style={{ color: D.text, opacity: 0.75 }}>
                <Lightbulb size={13} style={{ color: D.brand }} aria-hidden />
                ちなみに、どう計算している？
              </p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed" style={{ color: D.muted }}>
                <li>・まず「生活費 6 ヶ月分の備え」を最優先。備えが目標に届くまで、投資はおすすめしません</li>
                <li>・上限は毎月の黒字の半分まで。残りの半分は現金で手元に残す想定です</li>
                <li>・家計にゆとりがあるほどリスク許容度が上がり、検証ツールで比べられる戦略の幅が広がります</li>
                <li>・検証ツールに渡すのは「リスク許容度」と「上限額」の 2 つだけ。名前や記録の中身は渡しません</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function InvestmentCapacityPrototype() {
  const [preset, setPreset] = useState<Preset>(PRESETS[0])
  const diagnosis = diagnose(preset.totalAssets, preset.monthlyIncome, preset.avgDailyExpense)

  return (
    <div className="min-h-screen p-5 pb-24" style={{ background: D.bg }}>
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        {/* ヘッダー */}
        <header>
          <h1 className="flex items-center gap-2 text-xl font-extrabold" style={{ color: D.text }}>
            <TrendingUp size={20} style={{ color: D.brand }} />
            投資余力診断カード
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: D.muted }}>
            ホーム画面に追加する新カードの試作です（#543）。家計の状況に応じて
            「今月の投資上限」または「今月は投資を控える月」を表示します。
          </p>
        </header>

        {/* ステップ 1: シナリオを選ぶ */}
        <section className="flex flex-col gap-3">
          <StepHeading
            step={1}
            title="家計のシナリオを選ぶ"
            note="タップするとカードの表示が切り替わります"
          />
          <div className="flex flex-col gap-2">
            {PRESETS.map((p) => {
              const selected = preset.name === p.name
              return (
                <button
                  key={p.name}
                  onClick={() => setPreset(p)}
                  className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left"
                  style={{
                    borderColor: selected ? D.brand : D.border,
                    background: selected ? D.brandLight : D.card,
                  }}
                >
                  <span className="text-xl" aria-hidden>
                    {p.emoji}
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-extrabold" style={{ color: D.text }}>
                      {p.name}
                    </span>
                    <span className="mt-0.5 block text-[11px] leading-relaxed" style={{ color: D.muted }}>
                      {p.note}
                    </span>
                  </span>
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: selected ? D.brand : D.border,
                      color: selected ? '#fff' : 'transparent',
                    }}
                    aria-hidden
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ステップ 2: ホーム掲載イメージ */}
        <section className="flex flex-col gap-3">
          <StepHeading
            step={2}
            title="ホーム掲載イメージ"
            note="生活余力カード（点線＝既存）のすぐ下に並びます"
          />
          <div
            className="flex flex-col gap-3 rounded-3xl p-4"
            style={{ background: 'rgba(28,20,16,0.035)' }}
          >
            <ExistingCardGhost />
            <CapacityCard diagnosis={diagnosis} />
          </div>
        </section>

        {/* ステップ 3: 設定画面イメージ（診断のしくみの置き場所） */}
        <section className="flex flex-col gap-3">
          <StepHeading
            step={3}
            title="設定画面イメージ — 診断のしくみ"
            note="カードには載せず、知りたい人だけが設定から見られる「ちなみに」扱い"
          />
          <SettingsMock />
        </section>

        {/* 詳細（デフォルトは畳んでおき、密度を下げる） */}
        <details className="rounded-2xl border" style={{ borderColor: D.border, background: D.card }}>
          <summary
            className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-xs font-bold"
            style={{ color: D.text }}
          >
            この診断の入力データと計算ルール
            <ChevronDown size={14} style={{ color: D.muted }} />
          </summary>
          <div
            className="border-t px-4 py-3 text-[11px] leading-relaxed"
            style={{ borderColor: D.border, color: D.muted }}
          >
            <p className="font-bold" style={{ color: D.text }}>
              入力（既存の生活余力と同じデータを使用）
            </p>
            <p className="mt-1">
              総資産 {yen(preset.totalAssets)} / 月次固定収入 {yen(preset.monthlyIncome)} / 日次平均支出{' '}
              {yen(preset.avgDailyExpense)}（月換算 {yen(preset.avgDailyExpense * 30)}）
            </p>
            <p className="mt-3 font-bold" style={{ color: D.text }}>
              計算ルール（初期仮設定）
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              <li>生活の備えの目標 = 生活費 {TARGET_MONTHS} ヶ月分。未達なら投資上限 0 円（控える月）</li>
              <li>投資上限 = 月次黒字 × {SURPLUS_RATIO * 100}%（千円単位切り捨て）。赤字なら 0 円</li>
              <li>リスク許容度 = 備えが目標の 2 倍以上で「中」・3 倍以上で「高」</li>
              <li>検証ツールへ渡すのはリスク許容度と上限額のみ（個人情報は渡さない）</li>
            </ul>
          </div>
        </details>

        {/* レビュー観点 */}
        <section
          className="rounded-2xl border px-4 py-3 text-[11px] leading-relaxed"
          style={{ borderColor: D.border, background: D.incomeLight, color: D.muted }}
        >
          <p className="text-xs font-bold" style={{ color: D.text }}>
            レビューで見てほしいポイント
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            <li>「今月は投資を控える月」の文言は納得感があるか（責められた感じがしないか）</li>
            <li>上限額とリスク許容度、どちらを主役にすべきか</li>
            <li>「この条件で戦略の過去検証を見る」ボタンの文言はわかりやすいか</li>
            <li>ホームに常設してよいか、条件を満たしたときだけ出すべきか</li>
            <li>③ 設定の「ちなみに」補足はこの温度感・文量で良いか</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
