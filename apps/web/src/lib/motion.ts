import type { Transition, Variants } from "framer-motion";

// Spring プリセット（サンドボックスと共通定義）
// SNAP(600) / QUICK(400) / BASE(300) / SMOOTH(200) / BAR(70)
export const SPRING = {
  snap:   { type: "spring", stiffness: 600, damping: 35 } satisfies Transition,
  quick:  { type: "spring", stiffness: 400, damping: 30 } satisfies Transition,
  base:   { type: "spring", stiffness: 300, damping: 28 } satisfies Transition,
  smooth: { type: "spring", stiffness: 200, damping: 26 } satisfies Transition,
  bar:    { type: "spring", stiffness: 70,  damping: 18 } satisfies Transition,
} as const;

// ページコンテンツのフェードイン（stagger ウォーターフォール）
export const PAGE_VARIANTS: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
};

export const PAGE_ITEM_VARIANTS: Variants = {
  hidden:  { opacity: 0, y: 22, filter: "blur(8px)" },
  visible: { opacity: 1, y: 0,  filter: "blur(0px)", transition: SPRING.smooth },
};

// ドロワー・モーダル内コンテンツの stagger
export const DRAWER_VARIANTS: Variants = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.08 } },
};

export const DRAWER_ITEM_VARIANTS: Variants = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: SPRING.quick },
};

// フェードのみ（レイアウト変化なし）
export const FADE_VARIANTS: Variants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: SPRING.smooth },
  exit:    { opacity: 0, transition: SPRING.smooth },
};
