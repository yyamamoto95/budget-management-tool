"use client";

import { useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SPRING } from "@/lib/motion";

/** スワイプ判定のしきい値（px）。これ未満のドラッグはスライドを切り替えない */
const SWIPE_THRESHOLD_PX = 40;

export type CarouselSlide = {
  key: string;
  /** インジケーターの aria-label に使う名称 */
  label: string;
  node: React.ReactNode;
};

/** スライドの出入りアニメーション（sandbox HomePrototype と同パターン） */
const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%", opacity: 0 }),
  center: {
    x: 0,
    opacity: 1,
    transition: { type: "spring" as const, stiffness: 320, damping: 30 },
  },
  exit: (dir: number) => ({
    x: dir > 0 ? "-100%" : "100%",
    opacity: 0,
    transition: { duration: 0.14 },
  }),
};

/**
 * SP ホームのスワイプカルーセル（#550 / sandbox HomePrototype 承認済みデザイン）
 * ドラッグスワイプとインジケーター（＜ ドット ＞）でスライドを切り替える。
 * スライドの中身は既存のダッシュボードカードをそのまま受け取る（DOM順 = 表示順）。
 */
export function DashboardCarousel({ slides }: { slides: CarouselSlide[] }) {
  const [rawIndex, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  // データ更新でスライド数が減った場合（例: 投資余力が算出不能になった）に
  // 範囲外参照でクラッシュしないよう末尾へクランプする
  const index = Math.min(rawIndex, Math.max(0, slides.length - 1));

  const go = (next: number) => {
    if (next < 0 || next >= slides.length || next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD_PX) go(index + 1);
    else if (info.offset.x > SWIPE_THRESHOLD_PX) go(index - 1);
  };

  if (slides.length === 0) return null;

  return (
    <div data-testid="dashboard-carousel">
      {/* スワイプ可能エリア。横方向の入れ替えアニメーションのためはみ出しを隠す */}
      <motion.div
        className="overflow-hidden"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.04}
        onDragEnd={handleDragEnd}
        style={{ touchAction: "pan-y" }}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={slides[index].key}
            custom={direction}
            variants={SLIDE_VARIANTS}
            initial="enter"
            animate="center"
            exit="exit"
          >
            {slides[index].node}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* インジケーター行: ＜ ドット ＞ */}
      <div className="flex items-center justify-center gap-2 px-4 py-2">
        <motion.button
          type="button"
          onClick={() => go(index - 1)}
          disabled={index === 0}
          whileTap={{ scale: 0.85 }}
          transition={SPRING.snap}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-opacity disabled:opacity-25"
          style={{ color: "var(--color-brand-primary)" }}
          aria-label="前のカード"
        >
          <ChevronLeft size={15} strokeWidth={2.5} />
        </motion.button>
        {slides.map((slide, i) => (
          <motion.button
            key={slide.key}
            type="button"
            onClick={() => go(i)}
            aria-label={slide.label}
            aria-current={i === index ? "true" : undefined}
            animate={{
              width: i === index ? 20 : 6,
              background:
                i === index ? "var(--color-brand-primary)" : "rgba(28,20,16,0.18)",
            }}
            transition={SPRING.quick}
            style={{ height: 6, borderRadius: 9999 }}
          />
        ))}
        <motion.button
          type="button"
          onClick={() => go(index + 1)}
          disabled={index === slides.length - 1}
          whileTap={{ scale: 0.85 }}
          transition={SPRING.snap}
          className="flex h-7 w-7 items-center justify-center rounded-full transition-opacity disabled:opacity-25"
          style={{ color: "var(--color-brand-primary)" }}
          aria-label="次のカード"
        >
          <ChevronRight size={15} strokeWidth={2.5} />
        </motion.button>
      </div>
    </div>
  );
}
