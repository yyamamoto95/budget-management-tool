"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * OS の prefers-reduced-motion 設定を framer-motion 全体に反映するプロバイダー。
 * reducedMotion="user" により、ユーザーがモーション軽減を有効にしている場合、
 * すべての motion コンポーネントのアニメーションが自動的にスキップされる。
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
}
