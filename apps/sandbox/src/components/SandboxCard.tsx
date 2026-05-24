/**
 * SandboxCard — サンドボックス共通カードコンポーネント
 */

import type { CSSProperties, ReactNode } from 'react'
import { D } from './designTokens'

export { D } from './designTokens'

const CARD_RADIUS = 'rounded-md'

export function SandboxCard({
  children,
  className = '',
  noclip = false,
  style,
}: {
  children: ReactNode
  className?: string
  /** overflow:hidden を無効化する（ドロップダウン等が枠外に出る場合） */
  noclip?: boolean
  style?: CSSProperties
}) {
  return (
    <div
      className={`${CARD_RADIUS} border ${noclip ? '' : 'overflow-hidden'} ${className}`}
      style={{
        background:  D.card,
        borderColor: D.border,
        boxShadow:   D.shadow,
        ...style,
      }}
    >
      {children}
    </div>
  )
}
