/**
 * homeTourSteps.ts — ホーム画面ツアー ステップ定義 (SSOT)
 *
 * 各ステップは data-tour="[key]" 属性が付いた DOM 要素を参照する。
 * ナビ位置・ルートが変わっても data-tour 属性の移動だけで対応できる。
 *
 * ステップ順: ユーザーが実際に使う順序に沿って構成
 *   0. ウェルカム
 *   1. 支出を記録する（毎日の起点）
 *   2. 今日の状況（記録後に確認）
 *   3. 今週の記録（習慣トラッキング）
 *   4. 最近の記録（入力確認）
 *   5. 明細（全件閲覧・検索）
 *   6. 今月の貯蓄予測（週次チェック）
 *   7. 今月のサマリー（月次振り返り）
 *   8. 投資余力（月次チェック・診断のしくみ）
 *   9. レポート（カテゴリ分析・傾向把握）
 *  10. 設定（目標・予算の管理）
 */

import type { ElementType } from 'react'
import {
  BookOpen,
  Sun,
  CalendarDays,
  TrendingUp,
  BarChart2,
  PenLine,
  PiggyBank,
  Receipt,
  Settings,
  List,
  PieChart,
} from 'lucide-react'

export type TourStepDef = {
  /** data-tour 属性セレクタ。未指定の場合はスポットライトなし（全体暗転） */
  selector?: string
  icon: ElementType
  iconBg: string
  iconColor: string
  title: string
  description: string
  /** ステップヘッダーに表示する確認頻度ラベル */
  freq?: string
  /** ポップオーバーをターゲット要素のどちら側に表示するか */
  side?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  /** PC（lg以上）での表示側。未指定の場合は side を使用 */
  sidePC?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

export const HOME_TOUR_STEPS: TourStepDef[] = [
  // ── 0: ウェルカム（要素なし・全体暗転）─────────────────────────────────────
  {
    icon: BookOpen,
    iconBg: '#fef5ee',
    iconColor: '#f18840',
    title: '使い方ガイド',
    description:
      'ホーム画面の見方と、毎日の活用方法を約1分でご紹介します。\n各機能をどのタイミングで使えばよいかも解説します。',
    side: 'center',
  },

  // ── 1: 支出を記録する（毎日の起点）────────────────────────────────────────
  {
    selector: '[data-tour="quick-entry"]',
    icon: PenLine,
    iconBg: '#fef5ee',
    iconColor: '#f18840',
    title: '支出を記録する',
    freq: '毎日使う',
    description:
      'カテゴリを選んで金額を入力するだけで記録できます。\nすべての予測・分析はここで入力したデータが元になります。その日のうちに記録する習慣をつけましょう。',
    side: 'top',
  },

  // ── 2: 今日の状況（記録後に確認）──────────────────────────────────────────
  {
    selector: '[data-tour="block-today"]',
    icon: Sun,
    iconBg: '#ecfdf5',
    iconColor: '#35b5a2',
    title: '今日の状況',
    freq: '毎日確認',
    description:
      '今日いくら使ったかと残り予算をひと目で把握できます。\nバーの色が緑→ピンク→赤に変わったら支出ペースを見直すサインです。',
    side: 'bottom',
  },

  // ── 3: 今週の記録（習慣トラッキング）──────────────────────────────────────
  {
    selector: '[data-tour="block-streak"]',
    icon: CalendarDays,
    iconBg: '#ecfdf5',
    iconColor: '#35b5a2',
    title: '今週の記録',
    freq: '毎日確認',
    description:
      '直近7日の記録状況と節約達成をひと目で確認できます。\nアイコンをタップすると各日の支出明細が見られます。毎日記録するほど予測の精度が上がります。',
    side: 'bottom',
    sidePC: 'left',   // PC では右カラムのため左側に表示
  },

  // ── 4: 最近の記録（入力内容の確認）────────────────────────────────────────
  {
    selector: '[data-tour="recent-records"]',
    icon: Receipt,
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
    title: '最近の記録',
    freq: '記録後に確認',
    description:
      '直近3日分の記録を確認・修正できます。\n金額の誤りや抜け漏れがないかここでチェックしてください。',
    side: 'top',
  },

  // ── 5: 明細（全件閲覧・検索）──────────────────────────────────────────────
  {
    selector: '[data-tour="nav-meisai"]',
    icon: List,
    iconBg: '#eff6ff',
    iconColor: '#3b82f6',
    title: '明細',
    freq: '週1〜2回確認',
    description:
      '全期間の支出記録を一覧・検索できます。\n期間フィルタやカテゴリ絞り込みで「あの出費はいくらだったか」をすぐに調べられます。',
    side: 'top',
    sidePC: 'right',  // PC では左サイドバーのため右側に表示
  },

  // ── 6: 今月の貯蓄予測（週次チェック）──────────────────────────────────────
  {
    selector: '[data-tour="block-savings-forecast"]',
    icon: TrendingUp,
    iconBg: '#fef5ee',
    iconColor: '#f18840',
    title: '今月の貯蓄予測',
    freq: '週1〜2回確認',
    description:
      '今のペースで月末まで過ごした場合の貯蓄額を予測します。\nバーの縦線が貯蓄目標ライン。実績バーが目標より左にあれば達成見込みです。',
    side: 'bottom',
  },

  // ── 7: 今月のサマリー（月次振り返り）──────────────────────────────────────
  {
    selector: '[data-tour="block-summary"]',
    icon: BarChart2,
    iconBg: '#f0f4ff',
    iconColor: '#6366f1',
    title: '今月のサマリー',
    freq: '月1〜2回確認',
    description:
      '収入・支出・貯蓄率など今月の家計全体をまとめて確認できます。\n先月比と貯蓄率を月末の振り返りに活用してください。',
    side: 'bottom',
    sidePC: 'left',   // PC では右カラムのため左側に表示
  },

  // ── 8: 投資余力（月次チェック・診断のしくみ）──────────────────────────────
  {
    selector: '[data-tour="block-capacity"]',
    icon: PiggyBank,
    iconBg: '#ecfdf5',
    iconColor: '#35b5a2',
    title: '投資余力',
    freq: '月1回確認',
    description:
      '家計に無理のない「今月投資に回せる上限」を診断します。まず生活費6ヶ月分の備えを最優先し、満たすまでは「投資を控える月」と表示します。\n上限は毎月の黒字の半分まで。検証ツールに渡すのはリスク許容度と上限額の2つだけで、名前や記録の中身は渡しません。',
    side: 'bottom',
    sidePC: 'right',  // PC では左カラム（Block 5）のため右側に表示
  },

  // ── 9: レポート（カテゴリ分析・傾向把握）────────────────────────────────
  {
    selector: '[data-tour="nav-report"]',
    icon: PieChart,
    iconBg: '#fdf4ff',
    iconColor: '#a855f7',
    title: 'レポート',
    freq: '月1回確認',
    description:
      '食費・交際費・日用品など、カテゴリ別の支出分析を確認できます。\nどのカテゴリで使いすぎているか傾向を把握し、翌月の予算調整に役立てましょう。',
    side: 'top',
    sidePC: 'right',  // PC では左サイドバーのため右側に表示
  },

  // ── 10: 設定（目標・予算の管理）───────────────────────────────────────────
  {
    selector: '[data-tour="nav-settings"]',
    icon: Settings,
    iconBg: '#f5f5f5',
    iconColor: '#71717a',
    title: '設定で目標を調整',
    description:
      '収入・月予算・貯蓄目標などの基本設定はここから変更できます。\n収入が変わったときや貯蓄目標を見直したいときに設定を更新してください。',
    side: 'top',
    sidePC: 'right',  // PC では左サイドバーのため右側に表示
  },
]
