"use client";

import type { CSSProperties } from "react";
import { NumericFormat } from "react-number-format";

type Props = {
  value: number;
  onChange: (v: number) => void;
  /** 下限（blur 時に丸める）。既定 0 */
  min?: number;
  /** 上限（入力中もブロックする）。未指定なら無制限 */
  max?: number;
  /** false で桁区切りなし（給料日など整数フィールド向け） */
  thousandSeparator?: boolean;
  /** value が 0 のとき空欄表示し placeholder を見せる（ウィザード等） */
  blankWhenZero?: boolean;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  /** アクセシブル名（a11y / E2E セレクタ用） */
  label?: string;
  onFocus?: () => void;
  onBlur?: () => void;
};

/**
 * 金額・数値入力の共通プリミティブ（react-number-format ラッパー）。
 *
 * 桁区切り・先頭ゼロ除去・符号/小数の排除・キャレット制御をライブラリへ委譲し、
 * 手書きの raw 状態や正規表現による後始末を不要にする。
 * ステッパー付き入力（AmountField）と plain な入力（初回設定ウィザード）の共通基盤。
 */
export function MoneyInput({
  value,
  onChange,
  min = 0,
  max,
  thousandSeparator = true,
  blankWhenZero = false,
  className,
  style,
  placeholder,
  label,
  onFocus,
  onBlur,
}: Props) {
  return (
    <NumericFormat
      aria-label={label}
      className={className}
      style={style}
      placeholder={placeholder}
      inputMode="numeric"
      // blankWhenZero 時は 0 を空欄表示（プレースホルダを見せる）
      value={blankWhenZero && value === 0 ? "" : value}
      thousandSeparator={thousandSeparator ? "," : undefined}
      decimalScale={0}
      allowNegative={false}
      // 上限は入力段階でブロックする（例: 給料日 ≤ 31）
      isAllowed={(values) =>
        max == null || values.floatValue == null || values.floatValue <= max
      }
      onFocus={onFocus}
      onBlur={() => {
        // 下限は blur で丸める（入力途中の空欄を許容するため）
        if (value < min) onChange(min);
        onBlur?.();
      }}
      onValueChange={(v) => onChange(v.floatValue ?? 0)}
    />
  );
}
