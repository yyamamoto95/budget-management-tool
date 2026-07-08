/**
 * ReceiptScanPrototype — クイック記録のレシート読取（#521）
 *
 * Web 版 QuickEntryDrawer に追加する「レシート読取」導線のプロトタイプ。
 * モバイルアプリ（#515/#518）で実機検証済みのパターンを Web の UI 言語へ移植する:
 * - 金額入力の上に読取ボタン（ブランドカラーの淡色ピル）
 * - 解析中はスピナー + 所要時間の目安
 * - 結果は必ずトースト通知（成功: 読取内容 / 失敗: 理由 + 手入力の案内）
 * - プリフィルのみで自動登録はしない
 */

import { useState } from 'react'
import { Camera, Loader2, CheckCircle2, XCircle } from 'lucide-react'

const D = {
  bg: '#fffdf5',
  card: '#ffffff',
  text: '#1c1410',
  muted: 'rgba(28,20,16,0.42)',
  border: 'rgba(28,20,16,0.08)',
  brand: '#f18840',
  brandLight: '#fff6ee',
} as const

type Phase = 'idle' | 'scanning' | 'success' | 'failure'

const MOCK_RESULT = { amount: 702, date: '2026-07-09', content: 'ローソン 品川店' }

export function ReceiptScanPrototype() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')

  const runScan = (outcome: 'success' | 'failure') => {
    setPhase('scanning')
    setAmount('')
    setMemo('')
    setTimeout(() => {
      if (outcome === 'success') {
        setAmount(String(MOCK_RESULT.amount))
        setMemo(MOCK_RESULT.content)
      }
      setPhase(outcome)
    }, 1500)
  }

  return (
    <div style={{ minHeight: '100vh', background: D.bg, padding: 24, color: D.text }}>
      <h1 style={{ fontSize: 18, fontWeight: 800 }}>レシート読取 — クイック記録への組み込み</h1>
      <p style={{ fontSize: 12, color: D.muted, marginTop: 4 }}>
        モバイル実機検証済みパターンの Web 移植。ボタンでシナリオを再生できます。
      </p>

      <div style={{ display: 'flex', gap: 8, margin: '16px 0' }}>
        <button
          onClick={() => runScan('success')}
          style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${D.border}`, background: D.card, fontWeight: 700, fontSize: 12 }}
        >
          ▶ 成功シナリオ
        </button>
        <button
          onClick={() => runScan('failure')}
          style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${D.border}`, background: D.card, fontWeight: 700, fontSize: 12 }}
        >
          ▶ 失敗シナリオ
        </button>
      </div>

      {/* ドロワーのモック */}
      <div
        style={{
          maxWidth: 420,
          background: D.card,
          borderRadius: 20,
          border: `1px solid ${D.border}`,
          boxShadow: '0 8px 32px rgba(28,20,16,0.12)',
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 12 }}>クイック記録</div>

        {/* レシート読取ボタン（追加箇所） */}
        <button
          disabled={phase === 'scanning'}
          onClick={() => runScan('success')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '10px 0',
            borderRadius: 12,
            border: `1px solid ${D.brand}`,
            background: D.brandLight,
            color: D.brand,
            fontWeight: 700,
            fontSize: 13,
            marginBottom: 12,
            opacity: phase === 'scanning' ? 0.7 : 1,
          }}
        >
          {phase === 'scanning' ? (
            <>
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
              レシートを解析中…（最大2分ほどかかります）
            </>
          ) : (
            <>
              <Camera size={15} />
              レシートを読み取って自動入力
            </>
          )}
        </button>

        {/* 金額（プリフィル先） */}
        <div style={{ fontSize: 11, color: D.muted, fontWeight: 700 }}>支出金額</div>
        <div
          style={{
            fontSize: 32,
            fontWeight: 800,
            color: D.brand,
            background: D.brandLight,
            borderRadius: 12,
            padding: '10px 14px',
            textAlign: 'right',
            margin: '4px 0 12px',
          }}
        >
          ¥{amount === '' ? '0' : Number(amount).toLocaleString()}
        </div>

        {/* メモ（プリフィル先） */}
        <div style={{ fontSize: 11, color: D.muted, fontWeight: 700 }}>メモ（任意）</div>
        <div
          style={{
            borderRadius: 10,
            border: `1px solid ${D.border}`,
            padding: '10px 12px',
            fontSize: 13,
            color: memo ? D.text : D.muted,
            marginTop: 4,
          }}
        >
          {memo || '店名・用途など'}
        </div>
      </div>

      {/* トースト通知のモック */}
      {phase === 'success' && (
        <div style={toastStyle('#ecfaf8', '#35b5a2')}>
          <CheckCircle2 size={16} color="#35b5a2" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>レシートを読み取りました</div>
            <div style={{ fontSize: 12, color: D.muted, whiteSpace: 'pre-line' }}>
              {`金額: ¥${MOCK_RESULT.amount.toLocaleString()} / 日付: ${MOCK_RESULT.date} / 店名: ${MOCK_RESULT.content}\n内容を確認して登録してください。`}
            </div>
          </div>
        </div>
      )}
      {phase === 'failure' && (
        <div style={toastStyle('#fff1f2', '#f43f5e')}>
          <XCircle size={16} color="#f43f5e" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 13 }}>レシートを解析できませんでした</div>
            <div style={{ fontSize: 12, color: D.muted }}>
              明るい場所で撮り直すか、手入力で登録できます。
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

function toastStyle(bg: string, border: string): React.CSSProperties {
  return {
    display: 'flex',
    gap: 10,
    alignItems: 'flex-start',
    maxWidth: 420,
    marginTop: 16,
    padding: '12px 14px',
    borderRadius: 12,
    background: bg,
    border: `1px solid ${border}`,
  }
}
