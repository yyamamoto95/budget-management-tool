/**
 * categoryTokens.ts — カテゴリ カラー & アイコン SSOT
 *
 * ルール:
 *   - このファイルを唯一の真実の源 (SSOT) とする
 *   - 各ページで色を直書きせず、必ずこのトークンを参照する
 *   - トークンキーはセマンティクな英語名（日本語名と紐付けた lookup を使う）
 *   - color = アイコン/テキスト前景色、bg = バッジ/ボタン背景色
 *
 * 設計方針:
 *   支出: 食事(暖色), 生活インフラ(ティール), 移動(青), デジタル(バイオレット),
 *         健康(ローズ/ピンク), 日用雑貨(パープル), 趣味(エメラルド), その他(スレート)
 *   収入: 全体をグリーン/ティール系で統一し、分類ごとにトーンを変える
 */

import type { ElementType } from 'react'
import {
  CircleDashed,
  ShoppingBasket,
  Utensils,
  Car,
  Zap,
  Smartphone,
  Building2,
  Heart,
  Shield,
  ShoppingBag,
  Shirt,
  Music,
  Tag,
  Banknote,
  Gift,
  Briefcase,
  Users,
  Landmark,
  GraduationCap,
  Scissors,
  TrendingUp,
  Wallet,
} from 'lucide-react'

// ── 型定義 ───────────────────────────────────────────────────────────────────

export type CategoryToken = {
  /** セマンティクキー（英語）*/
  key: string
  /** 表示名（日本語）*/
  name: string
  /** アイコン / テキスト前景色 */
  color: string
  /** バッジ / ボタン背景色 */
  bg: string
  /** lucide-react アイコン */
  icon: ElementType
}

// ── 支出カテゴリ ─────────────────────────────────────────────────────────────
//
// 設計2軸:
//   軸A) 必要経費か / 削減可能か
//     - 義務的固定費（削れない）→ muted gray 系: 色が暗く・彩度が低い = 「重い・避けられない」
//     - 必要変動費（必要だが量を制御可能）→ ドメイン直感色（vivid だが機能的）
//     - 裁量費（削減可能・意思決定余地あり）→ 表現系の色（選択する楽しさ）
//   軸B) 関連属性（ドメイン）
//     食系 / 移動系 / インフラ系 / 健康系 / 生活雑貨 / ライフスタイル / 中立
//
// 【義務的固定費 / gray-stone-zinc 系】
//   housing(stone)  → 建物・物理的な重さ。warm stone で「場所・空間」感
//   utility(slate)  → 電気・水道・ガス。blue-gray で「社会インフラ」感
//   telecom(zinc)   → 通信・デジタル。cool zinc で「抽象的・インビジブル」感
//   ※ 3色とも彩度を落とし「選択の余地がない出費」を視覚的に表現する
//
// 【必要変動費 / domain vivid 系】
//   food(orange)    → 食べ物の温かさ・ブランドカラーと同系統（必需だが量をコントロール可能）
//   transport(blue) → 移動・地図・ナビゲーション連想（通信費と切り離し）
//   medical(rose)   → 緊急・健康注意（突発的必要経費）
//   insurance(pink) → 保護・安心（固定寄りだが見直し可能）
//   daily(sky)      → 日常雑貨・生活必需。violet と混同しないよう sky 系
//
// 【裁量費 / expressive 系】
//   dining(deepOrange) → 外食は食系だが「選択的支出」→ food より深い色で区別
//   clothing(indigo)   → ファッション・スタイル（ライフスタイル系 indigo/violet に統一）
//   leisure(violet)    → 趣味・余暇。green は収入色なので禁止。indigo/violet 系に統一
//
// 【中立・システム状態】
//   other(slate)         → ユーザーが意図的に「上記に該当しない」と選んだ確定カテゴリ
//   unclassified(slate)  → システムが自動付与する「未処理」状態。ユーザーが後から割り当てる前提。
//                          ※ 「その他」と「未分類」は別概念: other=確定, unclassified=一時的状態

export const EXPENSE_CATEGORY_TOKENS: Record<string, CategoryToken> = {
  unclassified: { key: 'unclassified', name: '未分類',  color: '#94a3b8', bg: '#f1f5f9', icon: CircleDashed   },
  food:         { key: 'food',         name: '食費',    color: '#f18840', bg: '#fef5ee', icon: ShoppingBasket },
  dining:       { key: 'dining',       name: '外食',    color: '#e8622a', bg: '#fff3ef', icon: Utensils       },
  transport:    { key: 'transport',    name: '交通費',  color: '#3b82f6', bg: '#eff6ff', icon: Car            },
  utility:      { key: 'utility',      name: '光熱費',  color: '#f59e0b', bg: '#fffbeb', icon: Zap            },
  telecom:      { key: 'telecom',      name: '通信費',  color: '#6366f1', bg: '#eef2ff', icon: Smartphone     },
  housing:      { key: 'housing',      name: '住宅費',  color: '#92400e', bg: '#fff7ed', icon: Building2      },
  tax:          { key: 'tax',          name: '税金',    color: '#475569', bg: '#f8fafc', icon: Landmark       },
  medical:      { key: 'medical',      name: '医療費',  color: '#f43f5e', bg: '#fff1f2', icon: Heart          },
  insurance:    { key: 'insurance',    name: '保険',    color: '#ec4899', bg: '#fdf2f8', icon: Shield         },
  daily:        { key: 'daily',        name: '日用品',  color: '#0ea5e9', bg: '#f0f9ff', icon: ShoppingBag    },
  education:    { key: 'education',    name: '教育費',  color: '#d97706', bg: '#fef9c3', icon: GraduationCap  },
  beauty:       { key: 'beauty',       name: '美容費',  color: '#d946ef', bg: '#fdf4ff', icon: Scissors       },
  clothing:     { key: 'clothing',     name: '衣類',    color: '#6366f1', bg: '#eef2ff', icon: Shirt          },
  leisure:      { key: 'leisure',      name: '趣味',    color: '#8b5cf6', bg: '#f5f3ff', icon: Music          },
  other:        { key: 'other',        name: 'その他',  color: '#94a3b8', bg: '#f8fafc', icon: Tag            },
}

/** 表示順の配列（選択グリッドやパレット表示に使う） */
// 並び順の根拠: 「よく使う順」×「同種グループ」
//   1位〜4位:  高頻度 / 食・日常（毎日〜週複数回記録する）
//   5位〜8位:  月次固定 / インフラ（毎月ほぼ決まって発生）
//   9位〜10位: 健康系（不定期だが重要）
//   11位〜14位: ライフスタイル（月数回〜不定期）
//   15位〜16位: 汎用・システム状態
export const EXPENSE_CATEGORIES: CategoryToken[] = [
  EXPENSE_CATEGORY_TOKENS.food,         // 1: 最高頻度
  EXPENSE_CATEGORY_TOKENS.dining,       // 2: 外食（食系）
  EXPENSE_CATEGORY_TOKENS.transport,    // 3: 毎日の移動
  EXPENSE_CATEGORY_TOKENS.daily,        // 4: 週次消耗品
  EXPENSE_CATEGORY_TOKENS.utility,      // 5: 月次インフラ
  EXPENSE_CATEGORY_TOKENS.telecom,      // 6: 月次インフラ（同種）
  EXPENSE_CATEGORY_TOKENS.housing,      // 7: 月次インフラ（同種）
  EXPENSE_CATEGORY_TOKENS.tax,          // 8: 月次〜年次インフラ（同種）
  EXPENSE_CATEGORY_TOKENS.medical,      // 9: 健康系
  EXPENSE_CATEGORY_TOKENS.insurance,    // 10: 健康系（同種）
  EXPENSE_CATEGORY_TOKENS.clothing,     // 11: ライフスタイル
  EXPENSE_CATEGORY_TOKENS.beauty,       // 12: ライフスタイル（同種）
  EXPENSE_CATEGORY_TOKENS.leisure,      // 13: ライフスタイル（同種）
  EXPENSE_CATEGORY_TOKENS.education,    // 14: 教育（ライフステージ依存）
  EXPENSE_CATEGORY_TOKENS.other,        // 15: 汎用
  EXPENSE_CATEGORY_TOKENS.unclassified, // 16: システム状態（最後尾）
]

// ── 収入カテゴリ ─────────────────────────────────────────────────────────────
//
// 設計方針:
//   全体を teal / green / cyan 系で統一し「プラス方向」を表現する
//   ※ orange（食費）・amber（光熱費）・violet（ライフスタイル）は使用禁止
//   ※ 識別のため hue を分散: teal → cyan → emerald → green → blue-teal の順
//
//   salary(teal)       → アプリの income ブランドカラー（#35b5a2）。主軸収入
//   bonus(emerald-700) → 深い緑で「特別感」を演出。定期給与より濃い
//   sideJob(green-600) → 自分で稼ぐ能動的収入。純粋な緑
//   benefit(cyan-600)  → 会社・制度からの付与。青みが強く「制度的」
//   pension(teal-700)  → 暗めのティール。安定・長期的な制度収入
//   investment(emerald-500) → 資産成長。明るい緑で「増える」感
//   other(slate)       → 上記に当てはまらない収入
//   unclassified       → 未処理状態

export const INCOME_CATEGORY_TOKENS: Record<string, CategoryToken> = {
  unclassified: { key: 'unclassified', name: '未分類',      color: '#94a3b8', bg: '#f1f5f9', icon: CircleDashed     },
  salary:       { key: 'salary',       name: '給料',        color: '#35b5a2', bg: '#ecfaf8', icon: Banknote         },
  bonus:        { key: 'bonus',        name: '賞与',        color: '#047857', bg: '#ecfdf5', icon: Gift             },
  sideJob:      { key: 'sideJob',      name: '副業',        color: '#129038', bg: '#dcfce7', icon: Briefcase        },
  benefit:      { key: 'benefit',      name: '手当',        color: '#077da0', bg: '#ecfeff', icon: Wallet           },
  pension:      { key: 'pension',      name: '年金',        color: '#0f766e', bg: '#f0fdfa', icon: Users            },
  investment:   { key: 'investment',   name: '投資・配当',  color: '#0ea870', bg: '#f0fdf4', icon: TrendingUp       },
  other:        { key: 'other',        name: 'その他',      color: '#94a3b8', bg: '#f8fafc', icon: Tag              },
}

// 並び順: 「よく使う × 同種」
//   1〜3: 労働収入（高頻度）
//   4〜5: 制度的収入（月次・定期）
//   6:    資産収入
//   7〜8: 汎用・システム
export const INCOME_CATEGORIES: CategoryToken[] = [
  INCOME_CATEGORY_TOKENS.salary,       // 1: 最高頻度
  INCOME_CATEGORY_TOKENS.bonus,        // 2: 労働収入（同種）
  INCOME_CATEGORY_TOKENS.sideJob,      // 3: 労働収入（同種）
  INCOME_CATEGORY_TOKENS.benefit,      // 4: 制度的収入
  INCOME_CATEGORY_TOKENS.pension,      // 5: 制度的収入（同種）
  INCOME_CATEGORY_TOKENS.investment,   // 6: 資産収入
  INCOME_CATEGORY_TOKENS.other,        // 7: 汎用
  INCOME_CATEGORY_TOKENS.unclassified, // 8: システム状態
]

// ── カテゴリ名 → トークン ルックアップ ───────────────────────────────────────

const EXPENSE_NAME_MAP: Record<string, string> = {
  // システム状態
  '未分類':         'unclassified',
  // 義務的固定費
  '住宅費':         'housing',
  '住居費':         'housing',    // 表記揺れ
  '光熱費':         'utility',
  '電気代':         'utility',
  'ガス代':         'utility',
  '水道代':         'utility',
  '通信費':         'telecom',
  'スマホ':         'telecom',
  'サブスク':       'telecom',
  '税金':           'tax',
  '住民税':         'tax',
  '所得税':         'tax',
  '自動車税':       'tax',
  '固定資産税':     'tax',
  '保険':           'insurance',
  // 必要変動費
  '食費':           'food',
  '交通費':         'transport',
  '交通':           'transport',
  'ガソリン':       'transport',
  '医療費':         'medical',
  '医療':           'medical',
  '薬':             'medical',
  '日用品':         'daily',
  '教育費':         'education',
  '教育':           'education',
  '塾':             'education',
  '参考書':         'education',
  // 裁量費
  '外食':           'dining',
  'カフェ':         'dining',
  '衣類':           'clothing',
  '美容費':         'beauty',
  '美容':           'beauty',
  '趣味':           'leisure',
  // 中立
  'その他':         'other',
}

const INCOME_NAME_MAP: Record<string, string> = {
  // システム状態
  '未分類':       'unclassified',
  // 労働収入
  '給料':         'salary',
  '給与':         'salary',
  '月給':         'salary',
  '時給':         'salary',
  '残業代':       'salary',
  '賞与':         'bonus',
  'ボーナス':     'bonus',
  '決算賞与':     'bonus',
  'インセンティブ': 'bonus',
  '副業':         'sideJob',
  'フリーランス': 'sideJob',
  '業務委託':     'sideJob',
  '個人事業':     'sideJob',
  // 制度的収入
  '手当':         'benefit',
  '住宅手当':     'benefit',
  '交通費支給':   'benefit',
  '扶養手当':     'benefit',
  '役職手当':     'benefit',
  '年金':         'pension',
  '老齢年金':     'pension',
  '障害年金':     'pension',
  '遺族年金':     'pension',
  '企業年金':     'pension',
  // 資産収入
  '投資':         'investment',
  '配当':         'investment',
  '配当金':       'investment',
  '分配金':       'investment',
  '家賃収入':     'investment',
  '売却益':       'investment',
  // 汎用
  '収入':         'salary',   // 汎用ラベルは給料にフォールバック
  'その他':       'other',
  'おこづかい':   'other',    // 旧カテゴリ名の後方互換
  '所得':         'other',    // 旧カテゴリ名の後方互換
}

/**
 * 支出カテゴリ名からトークンを取得する。
 * 未知のカテゴリ名は `other` にフォールバック。
 */
export function getExpenseCategoryToken(name: string): CategoryToken {
  const key = EXPENSE_NAME_MAP[name] ?? 'other'
  return EXPENSE_CATEGORY_TOKENS[key] ?? EXPENSE_CATEGORY_TOKENS.other
}

/**
 * 収入カテゴリ名からトークンを取得する。
 * 未知のカテゴリ名は `other` にフォールバック。
 */
export function getIncomeCategoryToken(name: string): CategoryToken {
  const key = INCOME_NAME_MAP[name] ?? 'other'
  return INCOME_CATEGORY_TOKENS[key] ?? INCOME_CATEGORY_TOKENS.other
}
