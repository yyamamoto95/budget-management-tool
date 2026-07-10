/**
 * フロー定義のスキーマ。
 * 「1つの JSON 定義 → 1つの静的 HTML」を原則とし、
 * 非エンジニアが読み書きできる語彙のみで構成する。
 */

/** すべての UI 部品が共通で持てる属性 */
interface ElementBase {
  /** 画面下部の注釈リストに①②…として表示される補足 */
  note?: string;
}

/** 画面上部の見出し */
export interface HeaderElement extends ElementBase {
  type: "header";
  label: string;
}

/** 説明文・本文 */
export interface TextElement extends ElementBase {
  type: "text";
  label: string;
  /** true のとき補足文として薄く表示する */
  muted?: boolean;
}

/** 入力欄 */
export interface InputElement extends ElementBase {
  type: "input";
  label: string;
  placeholder?: string;
  /** パスワード等の伏せ字入力 */
  secret?: boolean;
}

/** ボタン。goto に画面 ID を指定するとクリックで遷移できるホットスポットになる */
export interface ButtonElement extends ElementBase {
  type: "button";
  label: string;
  goto?: string;
  variant?: "primary" | "secondary" | "danger";
}

/** テキストリンク。goto はボタンと同様 */
export interface LinkElement extends ElementBase {
  type: "link";
  label: string;
  goto?: string;
}

/** 箇条書き・明細リスト */
export interface ListElement extends ElementBase {
  type: "list";
  label?: string;
  items: string[];
}

/** 数値やステータスを見せるカード */
export interface CardElement extends ElementBase {
  type: "card";
  label: string;
  /** カードの主役となる値（例: "¥1,280"、"3.2ヶ月分"） */
  value?: string;
  caption?: string;
}

/** グラフのプレースホルダ */
export interface ChartElement extends ElementBase {
  type: "chart";
  label?: string;
  kind?: "bar" | "line" | "donut";
}

/** 画像・イラストのプレースホルダ */
export interface ImageElement extends ElementBase {
  type: "image";
  label?: string;
}

/** 状態を表す小さなラベル */
export interface BadgeElement extends ElementBase {
  type: "badge";
  label: string;
  tone?: "good" | "caution" | "neutral";
}

/** 選択肢（タブ・ラジオ・セグメント） */
export interface ChoiceElement extends ElementBase {
  type: "choice";
  label?: string;
  items: string[];
  /** 選択中にする項目（items 内の文字列） */
  selected?: string;
}

/** 画面下部のナビゲーションバー */
export interface NavElement extends ElementBase {
  type: "nav";
  items: string[];
  selected?: string;
}

/** 区切り線 */
export interface DividerElement extends ElementBase {
  type: "divider";
}

export type ScreenElement =
  | HeaderElement
  | TextElement
  | InputElement
  | ButtonElement
  | LinkElement
  | ListElement
  | CardElement
  | ChartElement
  | ImageElement
  | BadgeElement
  | ChoiceElement
  | NavElement
  | DividerElement;

/** 1つの画面（ワイヤーフレーム） */
export interface Screen {
  /** フロー・goto から参照される一意な ID（半角英数字とハイフン推奨） */
  id: string;
  name: string;
  /** 画面の目的や状態の説明 */
  note?: string;
  elements: ScreenElement[];
}

/** Gherkin 形式のシナリオ（BDD との対応付け） */
export interface Scenario {
  given: string[];
  when: string[];
  then: string[];
}

/** フローの 1 ステップ */
export interface FlowStep {
  /** 表示する画面の ID */
  screen: string;
  /** この画面でユーザーが行う操作（次のステップへの矢印ラベル） */
  action?: string;
  /** 操作に対するシステムの応答・特記事項 */
  result?: string;
}

/** 業務フロー（ユーザーストーリー単位） */
export interface Flow {
  /** トレーサビリティ ID（例: "US-301"） */
  id: string;
  name: string;
  /** フローの主体（例: "利用者"、"管理者"） */
  actor?: string;
  description?: string;
  scenario?: Scenario;
  steps: FlowStep[];
}

/** フロー定義全体 */
export interface FlowDefinition {
  title: string;
  description?: string;
  /** 定義自体のバージョン。出力 HTML に表示される */
  version?: string;
  /** アクセントカラー（CSS カラー値）。省略時は既定のインクブルー */
  accent?: string;
  screens: Screen[];
  flows: Flow[];
}

/** レンダリングオプション */
export interface RenderOptions {
  /**
   * 出力フッターに埋め込む生成情報。
   * 既定では何も埋め込まない（同じ定義から常に同じ HTML を出力する＝再現性を優先）。
   */
  generatedAt?: string;
}
