/**
 * ImportReviewPrototype — スクショ一括取り込みの確認・編集画面（#565 / #559 PBI③前半）
 *
 * マネーツリー等のスクショを解析（#563 エンジン）した後の
 * 「取り込み候補一覧 → 選択/編集 → 一括登録」フローのプロトタイプ。
 *
 * - 断定しないトーン（推定・候補・要確認）。低信頼行は要確認マーク
 * - 既存明細と同日同額の行は「登録済みの可能性」で初期選択オフ（含め直し可能）
 * - 行タップで編集シート（金額・カテゴリ・日付）
 * - ホバー依存なし（タップのみで全操作）
 */

import { useMemo, useState } from 'react'
import { Camera, Check, ChevronDown, CircleAlert, CircleCheck, Pencil } from 'lucide-react'

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
  cautionLight: '#fdf1ec',
} as const

// ─── モック候補（実スクショ由来のデータ。本番は #563 エンジンの出力）──────────
type Candidate = {
  id: number
  date: string
  content: string
  amount: number
  balanceType: 0 | 1
  category: string
  confidence: 'high' | 'low'
  duplicate?: boolean
}

const BASE_CANDIDATES: Candidate[] = [
  { id: 1, date: '2026-06-29', content: 'ニホンガクセイシエンキ', amount: 17504, balanceType: 0, category: '教育・こども', confidence: 'high' },
  { id: 2, date: '2026-06-26', content: 'DF.AUジブン', amount: 40000, balanceType: 0, category: 'その他・不明', confidence: 'low' },
  { id: 3, date: '2026-06-25', content: 'ヤマモト ユウダイ', amount: 300000, balanceType: 1, category: '給料', confidence: 'high' },
  { id: 4, date: '2026-06-25', content: 'ヤマモト ケイ', amount: 180000, balanceType: 0, category: 'その他・不明', confidence: 'low' },
  { id: 5, date: '2026-06-12', content: '東京ディズニーリゾート モバイルオーダー', amount: 900, balanceType: 0, category: '外食・カフェ', confidence: 'high' },
  { id: 6, date: '2026-06-02', content: 'イオンフィナンシャルサービス', amount: 8924, balanceType: 0, category: 'その他・不明', confidence: 'low' },
]

const OUTGO_CATEGORY_NAMES = [
  '食費・スーパー', '外食・カフェ', '日用品', '住居・光熱費', '通信・サブスク',
  '教育・こども', '美容・衣類', 'クルマ・交通', '医療・保険', 'その他・不明',
]

type Scenario = 'normal' | 'duplicate' | 'partial'

const SCENARIOS: { key: Scenario; name: string; note: string }[] = [
  { key: 'normal', name: '正常（6件読み取り）', note: '全行が候補になり初期は全選択' },
  { key: 'duplicate', name: '重複あり', note: '固定費の自動登録と同日同額 → 初期選択オフ' },
  { key: 'partial', name: '部分失敗', note: '読み取れなかった行があることを明示' },
]

function yen(value: number): string {
  return `¥${value.toLocaleString()}`
}

/** ステップ見出し */
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
        <p className="text-sm font-extrabold" style={{ color: D.text }}>{title}</p>
        {note && <p className="text-[11px]" style={{ color: D.muted }}>{note}</p>}
      </div>
    </div>
  )
}

export function ImportReviewPrototype() {
  const [scenario, setScenario] = useState<Scenario>('normal')
  const candidates = useMemo(() => {
    if (scenario === 'duplicate') {
      return BASE_CANDIDATES.map((c) =>
        c.id === 1 ? { ...c, duplicate: true } : c
      )
    }
    if (scenario === 'partial') {
      return BASE_CANDIDATES.slice(0, 4)
    }
    return BASE_CANDIDATES
  }, [scenario])

  const [edits, setEdits] = useState<Record<number, Partial<Candidate>>>({})
  const [selected, setSelected] = useState<Record<number, boolean>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [committed, setCommitted] = useState(false)

  // シナリオ切替でリセット（重複行は初期オフ）
  const switchScenario = (next: Scenario) => {
    setScenario(next)
    setEdits({})
    setSelected({})
    setEditingId(null)
    setCommitted(false)
  }

  const rowOf = (c: Candidate): Candidate => ({ ...c, ...edits[c.id] })
  const isSelected = (c: Candidate) => selected[c.id] ?? !c.duplicate
  const selectedRows = candidates.filter((c) => isSelected(c)).map(rowOf)
  const totalOut = selectedRows.filter((r) => r.balanceType === 0).reduce((s, r) => s + r.amount, 0)
  const totalIn = selectedRows.filter((r) => r.balanceType === 1).reduce((s, r) => s + r.amount, 0)
  const editing = editingId !== null ? rowOf(candidates.find((c) => c.id === editingId) as Candidate) : null

  return (
    <div className="min-h-screen p-5 pb-32" style={{ background: D.bg }}>
      <div className="mx-auto flex max-w-lg flex-col gap-6">
        <header>
          <h1 className="flex items-center gap-2 text-xl font-extrabold" style={{ color: D.text }}>
            <Camera size={20} style={{ color: D.brand }} />
            スクショ一括取り込み — 確認画面
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed" style={{ color: D.muted }}>
            マネーツリー等のスクショ解析後に表示される確認・編集画面の試作です（#565）。
            内容は推定のため、選択・修正してから登録します。
          </p>
        </header>

        {/* ① シナリオ */}
        <section className="flex flex-col gap-3">
          <StepHeading step={1} title="シナリオを選ぶ" note="タップすると下の確認画面が切り替わります" />
          <div className="flex flex-col gap-2">
            {SCENARIOS.map((s) => {
              const active = scenario === s.key
              return (
                <button
                  key={s.key}
                  onClick={() => switchScenario(s.key)}
                  className="flex items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left"
                  style={{ borderColor: active ? D.brand : D.border, background: active ? D.brandLight : D.card }}
                >
                  <span className="flex-1">
                    <span className="block text-sm font-extrabold" style={{ color: D.text }}>{s.name}</span>
                    <span className="mt-0.5 block text-[11px]" style={{ color: D.muted }}>{s.note}</span>
                  </span>
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{ background: active ? D.brand : D.border, color: active ? '#fff' : 'transparent' }}
                    aria-hidden
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* ② 確認画面イメージ */}
        <section className="flex flex-col gap-3">
          <StepHeading step={2} title="読み取り結果の確認" note="行タップで編集・チェックで取り込み対象を選択" />

          <div className="overflow-hidden rounded-2xl border" style={{ borderColor: D.border, background: D.card }}>
            <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: D.border }}>
              <span className="text-sm font-extrabold" style={{ color: D.text }}>
                読み取り結果 {candidates.length} 件
              </span>
              <span className="text-[11px]" style={{ color: D.muted }}>三菱UFJ銀行のスクショ（推定）</span>
            </div>

            {scenario === 'partial' && (
              <div
                className="flex items-start gap-2 border-b px-4 py-2.5 text-[11px] leading-relaxed"
                style={{ borderColor: D.border, background: D.cautionLight, color: D.text }}
              >
                <CircleAlert size={13} style={{ color: D.caution, flexShrink: 0, marginTop: 1 }} />
                読み取れなかった行が 3 行あります。不足分は画像を撮り直すか手入力で追加してください。
              </div>
            )}

            {candidates.map(rowOf).map((row) => {
              const checked = isSelected(row)
              return (
                <div
                  key={row.id}
                  className="flex items-center gap-3 border-b px-4 py-3"
                  style={{ borderColor: D.border, opacity: checked ? 1 : 0.5 }}
                >
                  {/* 選択チェック */}
                  <button
                    onClick={() => setSelected((s) => ({ ...s, [row.id]: !checked }))}
                    aria-label={`${row.content} を${checked ? '除外' : '含める'}`}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border"
                    style={{
                      borderColor: checked ? D.brand : D.border,
                      background: checked ? D.brand : D.card,
                      color: '#fff',
                    }}
                  >
                    {checked && <Check size={14} strokeWidth={3} />}
                  </button>

                  {/* 内容（タップで編集） */}
                  <button className="min-w-0 flex-1 text-left" onClick={() => setEditingId(row.id)}>
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-[13px] font-bold" style={{ color: D.text }}>
                        {row.content}
                      </span>
                      <Pencil size={11} style={{ color: D.muted, flexShrink: 0 }} aria-hidden />
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span style={{ color: D.muted }}>{row.date.replaceAll('-', '/')}</span>
                      <span
                        className="rounded-full px-1.5 py-0.5 font-bold"
                        style={{ background: D.brandLight, color: D.brand }}
                      >
                        {row.category}
                      </span>
                      {row.confidence === 'low' && (
                        <span
                          className="rounded-full px-1.5 py-0.5 font-bold"
                          style={{ background: D.cautionLight, color: D.caution }}
                        >
                          要確認
                        </span>
                      )}
                      {row.duplicate && (
                        <span
                          className="rounded-full px-1.5 py-0.5 font-bold"
                          style={{ background: 'rgba(28,20,16,0.06)', color: D.muted }}
                        >
                          登録済みの可能性
                        </span>
                      )}
                    </div>
                  </button>

                  <span
                    className="shrink-0 text-sm font-extrabold tabular-nums"
                    style={{ color: row.balanceType === 1 ? D.income : D.text }}
                  >
                    {row.balanceType === 1 ? '+' : '−'}{yen(row.amount)}
                  </span>
                </div>
              )
            })}

            {/* フッター: 一括登録 */}
            <div className="px-4 py-3.5">
              {committed ? (
                <div
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold"
                  style={{ background: D.incomeLight, color: D.income }}
                >
                  <CircleCheck size={16} />
                  {selectedRows.length} 件を登録しました
                </div>
              ) : (
                <button
                  onClick={() => setCommitted(true)}
                  disabled={selectedRows.length === 0}
                  className="w-full rounded-xl py-3 text-sm font-extrabold text-white disabled:opacity-40"
                  style={{ background: D.brand, boxShadow: '0 4px 12px rgba(241,136,64,0.3)' }}
                >
                  {selectedRows.length} 件を登録する（支出 −{yen(totalOut)}
                  {totalIn > 0 ? ` / 収入 +${yen(totalIn)}` : ''}）
                </button>
              )}
              <p className="mt-2 text-center text-[10px]" style={{ color: D.muted }}>
                登録後は通常の明細として編集・削除できます。画像は保存されません。
              </p>
            </div>
          </div>
        </section>

        {/* レビュー観点 */}
        <section
          className="rounded-2xl border px-4 py-3 text-[11px] leading-relaxed"
          style={{ borderColor: D.border, background: D.incomeLight, color: D.muted }}
        >
          <p className="text-xs font-bold" style={{ color: D.text }}>レビューで見てほしいポイント</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            <li>1行の情報量（日付・カテゴリ・要確認・金額）はスマホで読み切れるか</li>
            <li>「登録済みの可能性」の初期オフ + 薄表示で意図が伝わるか</li>
            <li>編集シート（行タップ）の項目はこれで足りるか</li>
            <li>登録ボタンの合計表示（支出/収入の併記）はわかりやすいか</li>
          </ul>
        </section>
      </div>

      {/* 編集シート（行タップで開く） */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/30" onClick={() => setEditingId(null)}>
          <div
            className="w-full rounded-t-3xl border-t p-5 pb-8"
            style={{ background: D.card, borderColor: D.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex max-w-lg flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold" style={{ color: D.text }}>候補を修正</span>
                <button
                  onClick={() => setEditingId(null)}
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: 'rgba(28,20,16,0.06)', color: D.text }}
                >
                  <ChevronDown size={14} className="inline" aria-hidden /> 閉じる
                </button>
              </div>

              {/* 金額（±ステッパーの簡易モック。本番はテンキー共通 UI を転用） */}
              <div className="flex items-center justify-between rounded-2xl border px-4 py-3" style={{ borderColor: D.border }}>
                <span className="text-xs font-semibold" style={{ color: D.muted }}>金額</span>
                <div className="flex items-center gap-3">
                  <button
                    className="h-9 w-9 rounded-xl text-lg font-bold"
                    style={{ background: D.brandLight, color: D.text }}
                    onClick={() =>
                      setEdits((e) => ({
                        ...e,
                        [editing.id]: { ...e[editing.id], amount: Math.max(1, editing.amount - 100) },
                      }))
                    }
                  >
                    −
                  </button>
                  <span className="w-28 text-center text-lg font-extrabold tabular-nums" style={{ color: D.text }}>
                    {yen(editing.amount)}
                  </span>
                  <button
                    className="h-9 w-9 rounded-xl text-lg font-bold"
                    style={{ background: D.brandLight, color: D.text }}
                    onClick={() =>
                      setEdits((e) => ({
                        ...e,
                        [editing.id]: { ...e[editing.id], amount: editing.amount + 100 },
                      }))
                    }
                  >
                    ＋
                  </button>
                </div>
              </div>

              {/* カテゴリ（支出のみタイル表示。収入行は本番で収入カテゴリに切替） */}
              {editing.balanceType === 0 && (
                <div className="rounded-2xl border px-4 py-3" style={{ borderColor: D.border }}>
                  <span className="text-xs font-semibold" style={{ color: D.muted }}>カテゴリ</span>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {OUTGO_CATEGORY_NAMES.map((name) => {
                      const active = editing.category === name
                      return (
                        <button
                          key={name}
                          onClick={() =>
                            setEdits((e) => ({
                              ...e,
                              [editing.id]: { ...e[editing.id], category: name, confidence: 'high' },
                            }))
                          }
                          className="rounded-full border px-2.5 py-1.5 text-[11px] font-bold"
                          style={{
                            borderColor: active ? D.brand : D.border,
                            background: active ? D.brandLight : D.card,
                            color: active ? D.brand : D.text,
                          }}
                        >
                          {name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              <p className="text-[10px]" style={{ color: D.muted }}>
                読み取り原文: {editing.content}（{editing.date}） — 修正内容は一覧へ即時反映されます
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
