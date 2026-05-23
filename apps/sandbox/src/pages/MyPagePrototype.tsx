/**
 * MyPagePrototype — マイページ（名前・パスワード編集）
 *
 * - ユーザー名のインライン編集
 * - パスワード変更フォーム（現在のPW確認 + 新しいPW + 確認）
 * - フィールドバリデーション・エラー表示
 * - 保存成功トースト
 * - PC: 2カラムレイアウト（左: アカウント情報 / 右: パスワード変更）
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Pencil,
  User,
  Lock,
  KeyRound,
  ShieldCheck,
  X,
} from 'lucide-react'

// ─── Spring プリセット ───────────────────────────────────────────────────
const SPRING = {
  SNAP:   { type: 'spring', stiffness: 600, damping: 35 },
  QUICK:  { type: 'spring', stiffness: 400, damping: 30 },
  BASE:   { type: 'spring', stiffness: 300, damping: 28 },
  SMOOTH: { type: 'spring', stiffness: 200, damping: 26 },
} as const

// ─── デザイントークン ─────────────────────────────────────────────────────
const D = {
  bg:      '#f5f3ef',
  card:    '#ffffff',
  text:    '#1c1410',
  muted:   'rgba(28,20,16,0.45)',
  border:  '#e8ddd5',
  shadow:  '0 2px 12px rgba(28,20,16,0.08), 0 0 0 1px rgba(28,20,16,0.06)',
  brand:   '#f18840',
  brandD:  '#e8622a',
  brandL:  '#fff6ee',
  income:  '#35b5a2',
  danger:  '#f43f5e',
  caution: '#f59e0b',
} as const

// ─── 定数 ──────────────────────────────────────────────────────────────────
const MOCK_USER_ID      = 'yamamoto'
const CORRECT_CURRENT_PW = 'password123' // モック用
const MIN_PW_LENGTH     = 8

// ─── パスワード強度計算 ────────────────────────────────────────────────────
function pwStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' }
  const hasLetter = /[a-zA-Z]/.test(pw)
  const hasNumber = /[0-9]/.test(pw)
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw)
  if (pw.length < MIN_PW_LENGTH) return { level: 1, label: '弱い', color: D.danger }
  if (pw.length >= 12 && hasLetter && hasNumber && hasSymbol)
    return { level: 3, label: '強い', color: D.income }
  if ((hasLetter && hasNumber) || pw.length >= 12)
    return { level: 2, label: 'ふつう', color: D.caution }
  return { level: 1, label: '弱い', color: D.danger }
}

// ─── セクション ───────────────────────────────────────────────────────────
function Section({
  title,
  delay = 0,
  children,
}: {
  title: string
  delay?: number
  children: React.ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING.SMOOTH, delay }}
    >
      <div className="mb-2 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: D.muted }}>
          {title}
        </span>
      </div>
      <div
        className="rounded-2xl border overflow-hidden"
        style={{ background: D.card, borderColor: D.border, boxShadow: D.shadow }}
      >
        {children}
      </div>
    </motion.div>
  )
}

// ─── パスワード入力フィールド（カード型） ──────────────────────────────────
function PasswordInput({
  label,
  value,
  onChange,
  error,
  placeholder,
  icon: Icon,
  strengthBar,
  matchValue,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  placeholder?: string
  icon: React.ElementType
  strengthBar?: boolean  // 新しいパスワード用の強度バー
  matchValue?: string    // 確認用: これと一致するか
}) {
  const [show, setShow] = useState(false)
  const [focused, setFocused] = useState(false)

  const strength = strengthBar ? pwStrength(value) : null
  const isMatch  = matchValue !== undefined && value.length > 0 && value === matchValue

  const borderColor = error
    ? D.danger
    : focused
      ? D.brand
      : value
        ? 'rgba(241,136,64,0.35)'
        : D.border

  return (
    <div className="space-y-1.5">
      {/* ラベル */}
      <div className="flex items-center justify-between px-0.5">
        <label className="text-xs font-semibold" style={{ color: D.muted }}>{label}</label>
        {/* 確認フィールドの一致インジケーター */}
        {matchValue !== undefined && value.length > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-0.5 text-[11px] font-semibold"
            style={{ color: isMatch ? D.income : D.danger }}
          >
            {isMatch
              ? <><Check size={11} strokeWidth={2.5} /> 一致</>
              : <><X size={11} /> 不一致</>
            }
          </motion.span>
        )}
      </div>

      {/* 入力ボックス */}
      <motion.div
        animate={{
          borderColor,
          backgroundColor: focused ? '#fffaf5' : D.card,
          boxShadow: focused
            ? `0 0 0 3px rgba(241,136,64,0.12), 0 1px 4px rgba(28,20,16,0.06)`
            : '0 1px 3px rgba(28,20,16,0.05)',
        }}
        transition={{ duration: 0.15 }}
        className="flex items-center gap-3 rounded-xl border px-3.5 py-3"
        style={{ borderColor, borderWidth: '1.5px' }}
      >
        {/* アイコン */}
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: focused ? D.brandL : D.bg,
            transition: 'background 0.15s',
          }}
        >
          <Icon size={15} style={{ color: focused ? D.brand : D.muted }} />
        </div>

        {/* 入力 */}
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder ?? ''}
          className="flex-1 min-w-0 bg-transparent outline-none font-semibold"
          style={{
            fontSize: '16px',
            color: D.text,
          }}
        />

        {/* 表示トグル */}
        <motion.button
          type="button"
          onClick={() => setShow((p) => !p)}
          whileTap={{ scale: 0.82 }}
          transition={SPRING.SNAP}
          className="shrink-0 flex items-center justify-center rounded-lg p-1.5"
          style={{
            color:      show ? D.brand : D.muted,
            background: show ? D.brandL : 'transparent',
            transition: 'color 0.15s, background 0.15s',
          }}
          aria-label={show ? 'パスワードを隠す' : 'パスワードを表示'}
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </motion.button>
      </motion.div>

      {/* 強度バー（新しいパスワードフィールドのみ） */}
      {strengthBar && value && strength && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="px-0.5"
        >
          <div className="flex items-center gap-1.5 mt-1">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="h-1 flex-1 rounded-full"
                  animate={{ background: strength.level >= i ? strength.color : D.border }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>
            <span className="text-[10px] font-bold shrink-0" style={{ color: strength.color }}>
              {strength.label}
            </span>
          </div>
        </motion.div>
      )}

      {/* エラー */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING.QUICK}
            className="flex items-center gap-1 text-[11px] font-medium overflow-hidden px-0.5"
            style={{ color: D.danger }}
          >
            <AlertCircle size={11} />
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── トースト ─────────────────────────────────────────────────────────────
function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold text-white z-50 whitespace-nowrap"
          style={{ background: D.income, boxShadow: `0 8px 24px ${D.income}50` }}
          initial={{ opacity: 0, y: 20, scale: 0.88 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{ opacity: 0, y: 8, scale: 0.94 }}
          transition={SPRING.SNAP}
        >
          <Check size={16} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── メインページ ─────────────────────────────────────────────────────────
export function MyPagePrototype() {
  // ── ユーザー名 ─────────────────────────────────────────────────────────
  const [displayName, setDisplayName] = useState('山本 太郎')
  const [nameEditing, setNameEditing] = useState(false)
  const [nameDraft,   setNameDraft]   = useState('')
  const [nameSaved,   setNameSaved]   = useState(false)
  const [nameError,   setNameError]   = useState('')

  // ── パスワード ─────────────────────────────────────────────────────────
  const [currentPw,      setCurrentPw]      = useState('')
  const [newPw,          setNewPw]          = useState('')
  const [confirmPw,      setConfirmPw]      = useState('')
  const [currentPwError, setCurrentPwError] = useState('')
  const [newPwError,     setNewPwError]     = useState('')
  const [confirmPwError, setConfirmPwError] = useState('')
  const [pwSaved,        setPwSaved]        = useState(false)

  // ── ユーザー名ハンドラ ─────────────────────────────────────────────────
  function startNameEdit() {
    setNameDraft(displayName)
    setNameError('')
    setNameEditing(true)
  }

  function cancelNameEdit() {
    setNameEditing(false)
    setNameError('')
  }

  function saveNameEdit() {
    const trimmed = nameDraft.trim()
    if (!trimmed) { setNameError('名前を入力してください'); return }
    if (trimmed.length > 30) { setNameError('30文字以内で入力してください'); return }
    setDisplayName(trimmed)
    setNameEditing(false)
    setNameError('')
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2500)
  }

  // ── パスワードハンドラ ─────────────────────────────────────────────────
  function validateAndSavePassword() {
    let hasError = false

    if (!currentPw) {
      setCurrentPwError('現在のパスワードを入力してください'); hasError = true
    } else if (currentPw !== CORRECT_CURRENT_PW) {
      setCurrentPwError('現在のパスワードが正しくありません'); hasError = true
    } else {
      setCurrentPwError('')
    }

    if (!newPw) {
      setNewPwError('新しいパスワードを入力してください'); hasError = true
    } else if (newPw.length < MIN_PW_LENGTH) {
      setNewPwError(`${MIN_PW_LENGTH}文字以上で入力してください`); hasError = true
    } else if (newPw === currentPw) {
      setNewPwError('現在のパスワードと同じです'); hasError = true
    } else {
      setNewPwError('')
    }

    if (!confirmPw) {
      setConfirmPwError('確認用パスワードを入力してください'); hasError = true
    } else if (newPw && confirmPw !== newPw) {
      setConfirmPwError('新しいパスワードと一致しません'); hasError = true
    } else {
      setConfirmPwError('')
    }

    if (hasError) return

    setCurrentPw(''); setNewPw(''); setConfirmPw('')
    setPwSaved(true)
    setTimeout(() => setPwSaved(false), 2500)
  }

  const initials = displayName.trim().slice(0, 1)

  return (
    <div className="min-h-screen pb-24" style={{ background: D.bg }}>

      {/* ─── ヘッダー ─────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 flex h-12 items-center gap-3 border-b px-4 md:px-8"
        style={{ background: `${D.bg}ee`, backdropFilter: 'blur(12px)', borderColor: 'rgba(28,20,16,0.10)' }}
      >
        <Link
          to="/"
          className="flex items-center gap-1 text-xs font-semibold"
          style={{ color: D.brand }}
        >
          <ChevronLeft size={14} />ギャラリー
        </Link>
        <span className="text-sm font-extrabold" style={{ color: D.text }}>マイページ</span>
      </div>

      {/* ─── コンテンツ: PC=max-w-3xl / モバイル=max-w-md ────────────────── */}
      <div className="mx-auto max-w-3xl px-4 py-6 md:px-8">

        {/* アバター + 表示名（中央、常時） */}
        <motion.div
          className="flex flex-col items-center gap-3 pb-8"
          initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0,  filter: 'blur(0px)' }}
          transition={SPRING.SMOOTH}
        >
          <div
            className="flex h-24 w-24 items-center justify-center text-3xl font-extrabold text-white"
            style={{
              background:   `linear-gradient(135deg, ${D.brand}, ${D.brandD})`,
              borderRadius: '9999px',
              boxShadow:    `0 8px 28px ${D.brand}40`,
            }}
          >
            {initials}
          </div>
          <div className="text-center">
            <p className="text-xl font-extrabold" style={{ color: D.text }}>{displayName}</p>
            <p className="text-xs mt-0.5" style={{ color: D.muted }}>@{MOCK_USER_ID}</p>
          </div>
        </motion.div>

        {/* PC: 2カラムグリッド / モバイル: シングルカラム */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">

          {/* ── 左カラム: アカウント情報 ─────────────────────────────────── */}
          <Section title="アカウント情報" delay={0.06}>
            {/* ユーザー名 */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: D.bg }}
                >
                  <User size={17} style={{ color: D.brand }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold mb-0.5" style={{ color: D.muted }}>名前</div>
                  <AnimatePresence mode="wait">
                    {nameEditing ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SPRING.QUICK}
                        className="flex items-center gap-2"
                      >
                        <input
                          autoFocus
                          type="text"
                          value={nameDraft}
                          onChange={(e) => { setNameDraft(e.target.value); setNameError('') }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveNameEdit()
                            if (e.key === 'Escape') cancelNameEdit()
                          }}
                          className="flex-1 font-bold outline-none min-w-0"
                          style={{
                            fontSize:      '16px',
                            color:         D.text,
                            background:    'transparent',
                            borderBottom:  `1.5px solid ${nameError ? D.danger : D.brand}`,
                            paddingBottom: '2px',
                          }}
                          maxLength={30}
                        />
                        <motion.button
                          type="button"
                          onClick={cancelNameEdit}
                          whileTap={{ scale: 0.82 }}
                          transition={SPRING.SNAP}
                          style={{ color: D.muted }}
                          aria-label="キャンセル"
                        >
                          <X size={15} />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.p
                        key="display"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={SPRING.QUICK}
                        className="text-sm font-extrabold truncate"
                        style={{ color: D.text }}
                      >
                        {displayName}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <AnimatePresence>
                    {nameError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={SPRING.QUICK}
                        className="flex items-center gap-1 mt-1 text-[11px] font-medium overflow-hidden"
                        style={{ color: D.danger }}
                      >
                        <AlertCircle size={11} />
                        {nameError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* 編集 / 保存ボタン */}
                <AnimatePresence mode="wait">
                  {nameEditing ? (
                    <motion.button
                      key="save"
                      type="button"
                      onClick={saveNameEdit}
                      whileTap={{ scale: 0.88 }}
                      transition={SPRING.SNAP}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1,   opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
                      style={{ background: D.brand }}
                      aria-label="名前を保存"
                    >
                      <Check size={15} strokeWidth={2.5} />
                    </motion.button>
                  ) : (
                    <motion.button
                      key="edit"
                      type="button"
                      onClick={startNameEdit}
                      whileTap={{ scale: 0.88 }}
                      transition={SPRING.SNAP}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1,   opacity: 1 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: D.bg, color: D.muted }}
                      aria-label="名前を編集"
                    >
                      <Pencil size={15} />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ユーザーID（読み取り専用） */}
            <div className="flex items-center gap-3 border-t px-5 py-4" style={{ borderColor: D.border }}>
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: D.bg }}
              >
                <span className="text-[14px] font-extrabold" style={{ color: D.brand }}>@</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold mb-0.5" style={{ color: D.muted }}>
                  ユーザーID
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                    style={{ background: D.bg, color: D.muted }}
                  >
                    変更不可
                  </span>
                </div>
                <p className="text-sm font-bold" style={{ color: 'rgba(28,20,16,0.38)' }}>
                  {MOCK_USER_ID}
                </p>
              </div>
            </div>
          </Section>

          {/* ── 右カラム: パスワード変更 ──────────────────────────────────── */}
          <Section title="パスワード変更" delay={0.10}>
            <div className="px-5 py-4 space-y-4">

              <PasswordInput
                label="現在のパスワード"
                value={currentPw}
                onChange={(v) => { setCurrentPw(v); setCurrentPwError('') }}
                error={currentPwError}
                placeholder="現在のパスワードを入力"
                icon={Lock}
              />

              <PasswordInput
                label="新しいパスワード"
                value={newPw}
                onChange={(v) => { setNewPw(v); setNewPwError('') }}
                error={newPwError}
                placeholder={`${MIN_PW_LENGTH}文字以上`}
                icon={KeyRound}
                strengthBar
              />

              <PasswordInput
                label="新しいパスワード（確認）"
                value={confirmPw}
                onChange={(v) => { setConfirmPw(v); setConfirmPwError('') }}
                error={confirmPwError}
                placeholder="もう一度入力"
                icon={ShieldCheck}
                matchValue={newPw}
              />

              {/* 変更ボタン */}
              <motion.button
                type="button"
                onClick={validateAndSavePassword}
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: 1.01 }}
                transition={SPRING.SNAP}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2"
                style={{
                  background: `linear-gradient(135deg, ${D.brand}, ${D.brandD})`,
                  boxShadow:  `0 4px 20px ${D.brand}38`,
                  marginTop:  '4px',
                }}
              >
                <Lock size={15} strokeWidth={2.5} />
                パスワードを変更する
              </motion.button>
            </div>
          </Section>
        </div>

        {/* ログアウト */}
        <div className="mt-4">
          <button
            type="button"
            className="w-full rounded-2xl border py-3 text-sm font-bold transition-colors hover:opacity-80"
            style={{ borderColor: 'rgba(244,63,94,0.25)', color: D.danger, background: 'rgba(244,63,94,0.04)' }}
          >
            ログアウト
          </button>
        </div>

        {/* ナビリンク */}
        <div className="mt-6 text-center text-xs" style={{ color: D.muted }}>
          <Link to="/home" style={{ color: D.brand }} className="font-semibold hover:underline">
            ← ホーム
          </Link>
          <span className="mx-2 opacity-30">·</span>
          <Link to="/personal-settings" style={{ color: D.brand }} className="font-semibold hover:underline">
            個人設定 →
          </Link>
        </div>
      </div>

      <Toast message="名前を変更しました"       visible={nameSaved} />
      <Toast message="パスワードを変更しました" visible={pwSaved}   />
    </div>
  )
}
