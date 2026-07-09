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
 */

import { useState } from 'react'
import { TrendingUp, PiggyBank, ExternalLink } from 'lucide-react'

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

// ---- デモ用プリセット ----
type Preset = {
  name: string
  note: string
  totalAssets: number
  monthlyIncome: number
  avgDailyExpense: number
}

const PRESETS: Preset[] = [
  {
    name: '投資余力あり',
    note: '防衛資金 2.0 倍・月 6 万円の黒字',
    totalAssets: 2_880_000,
    monthlyIncome: 300_000,
    avgDailyExpense: 8_000,
  },
  {
    name: '投資を控える（防衛資金が未達）',
    note: '黒字はあるが備えが目標の 83%',
    totalAssets: 1_200_000,
    monthlyIncome: 300_000,
    avgDailyExpense: 8_000,
  },
  {
    name: '投資を控える（月次赤字）',
    note: '備えは十分だが今月は赤字ペース',
    totalAssets: 2_880_000,
    monthlyIncome: 200_000,
    avgDailyExpense: 8_000,
  },
]

function yen(value: number): string {
  return `¥${value.toLocaleString()}`
}

/** ホームカードのモック（LivingMarginCard と同じシェルトーン） */
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
      <div className="mb-1 flex items-center justify-between">
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
          <p className="mt-1.5 text-xs" style={{ color: D.muted }}>
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
          <p className="mt-1.5 text-xs font-semibold" style={{ color: D.income }}>
            リスク許容度: {TOLERANCE_LABELS[diagnosis.riskTolerance]}
          </p>
        </>
      )}

      {/* 生活防衛資金の充足バー（事実のみ。色は良好=income / 注意=caution） */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px]" style={{ color: D.muted }}>
          <span>生活の備え（生活費 {TARGET_MONTHS} ヶ月分が目安）</span>
          <span className="tabular-nums">{Math.round(diagnosis.emergencyFundRatio * 100)}%</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: D.border }}>
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
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold"
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

export function InvestmentCapacityPrototype() {
  const [preset, setPreset] = useState<Preset>(PRESETS[0])
  const diagnosis = diagnose(preset.totalAssets, preset.monthlyIncome, preset.avgDailyExpense)

  return (
    <div className="min-h-screen p-6" style={{ background: D.bg }}>
      <div className="max-w-lg">
        <div className="mb-6">
          <h1 className="flex items-center gap-2 text-xl font-extrabold" style={{ color: D.text }}>
            <PiggyBank size={20} style={{ color: D.brand }} />
            投資余力診断カード（#543）
          </h1>
          <p className="mt-1 text-xs" style={{ color: D.muted }}>
            ホームの生活余力カードの下に追加する想定。「投資を控える」も正しい結果として表示する。
            CTA は investment-analysis-tool へのディープリンク（risk_tolerance と monthly_limit のみ。PII なし）。
          </p>
        </div>

        {/* シナリオ切替 */}
        <div className="mb-4 flex flex-col gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.name}
              onClick={() => setPreset(p)}
              className="rounded-xl border px-3 py-2 text-left text-xs font-bold transition-colors"
              style={{
                borderColor: preset.name === p.name ? D.brand : D.border,
                background: preset.name === p.name ? D.brandLight : D.card,
                color: D.text,
              }}
            >
              {p.name}
              <span className="ml-2 font-normal" style={{ color: D.muted }}>
                {p.note}
              </span>
            </button>
          ))}
        </div>

        <CapacityCard diagnosis={diagnosis} />

        {/* 入力条件の内訳（デモ用） */}
        <div
          className="mt-4 rounded-xl border p-3 text-[11px] leading-relaxed"
          style={{ borderColor: D.border, background: D.card, color: D.muted }}
        >
          <p className="font-bold" style={{ color: D.text }}>
            この診断の入力（既存の生活余力と同じデータ）
          </p>
          <p>
            総資産 {yen(preset.totalAssets)} / 月次固定収入 {yen(preset.monthlyIncome)} / 日次平均支出{' '}
            {yen(preset.avgDailyExpense)}（月換算 {yen(preset.avgDailyExpense * 30)}）
          </p>
          <p className="mt-1">
            初期仮設定: 生活の備え目標 = 生活費 {TARGET_MONTHS} ヶ月分 / 投資上限 = 月次黒字 ×{' '}
            {SURPLUS_RATIO * 100}%（千円単位切り捨て） / 許容度 = 備え {'≥'}2 倍で中・{'≥'}3 倍で高
          </p>
        </div>
      </div>
    </div>
  )
}
