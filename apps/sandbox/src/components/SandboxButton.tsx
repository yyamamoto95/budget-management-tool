/**
 * SandboxButton — サンドボックス共通ボタンコンポーネント
 *
 * variant:
 *   primary  — ソリッドオレンジ・白文字（メインアクション用）
 *   ghost    — ライトオレンジ背景・オレンジ文字（サブアクション・リンク用）
 *   danger   — 透明背景・赤文字（破壊的アクション用）
 */

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import type { TargetAndTransition, VariantLabels } from 'framer-motion'
import { D } from './designTokens'

const SNAP = { type: 'spring' as const, stiffness: 600, damping: 35 }

const BASE = 'flex items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold w-full select-none'

const VARIANT: Record<Variant, React.CSSProperties> = {
  primary: {
    background: D.brand,
    color: '#ffffff',
    boxShadow: `0 4px 16px ${D.brand}33`,
  },
  ghost: {
    background: D.brandLight,
    color: D.brand,
    border: `1.5px solid rgba(241,136,64,0.22)`,
    textDecoration: 'none',
  },
  danger: {
    background: 'transparent',
    color: D.danger,
  },
}

type Variant = 'primary' | 'ghost' | 'danger'

interface ButtonProps {
  children: ReactNode
  variant?: Variant
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  initial?: TargetAndTransition | VariantLabels | boolean
  animate?: TargetAndTransition | VariantLabels
}

interface LinkButtonProps {
  children: ReactNode
  variant?: Variant
  to: string
  className?: string
}

export function SandboxButton({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  initial,
  animate,
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.97 }}
      transition={SNAP}
      className={`${BASE} ${className}`}
      style={{ ...VARIANT[variant], opacity: disabled ? 0.4 : 1 }}
      initial={initial}
      animate={animate}
    >
      {children}
    </motion.button>
  )
}

export function SandboxLinkButton({
  children,
  variant = 'ghost',
  to,
  className = '',
}: LinkButtonProps) {
  return (
    <motion.div whileTap={{ scale: 0.97 }} transition={SNAP}>
      <Link
        to={to}
        className={`${BASE} ${className}`}
        style={VARIANT[variant]}
      >
        {children}
      </Link>
    </motion.div>
  )
}
