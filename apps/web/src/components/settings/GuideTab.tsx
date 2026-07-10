"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, ChevronDown, Lightbulb, Settings, TrendingUp } from "lucide-react";
import { SPRING } from "@/lib/motion";
import { SectionCard } from "./SettingsClient";

/**
 * 設定画面のガイドタブ（#551 / sandbox PersonalSettingsPrototype 承認済みデザイン）
 * - 使い方ガイドの導線カード（ツアー本体は未実装のため「近日公開」プレースホルダ）
 * - 「投資余力診断のしくみ」常設トグル（#545 の設計決定。「ちなみに」トーンの補足）
 */
export function GuideTab() {
  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={SPRING.smooth}
    >
      <SectionCard title="使い方ガイド">
        <div>
          <GuideRow
            icon={BookOpen}
            title="ホーム画面ガイド"
            description="ホーム画面の使い方を案内します"
          />
          <div className="border-t" style={{ borderColor: "var(--border-default)" }}>
            <GuideRow
              icon={Settings}
              title="管理設定ガイド"
              description="設定画面の使い方を案内します"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="診断のしくみ">
        <MechanismToggle />
      </SectionCard>
    </motion.div>
  );
}

/** ガイド導線の行（ツアー実装までは近日公開のプレースホルダ） */
function GuideRow({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex cursor-not-allowed select-none items-center gap-3 px-4 py-3.5 opacity-50">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
        style={{ background: "var(--color-surface-subtle)" }}
      >
        <Icon size={16} style={{ color: "var(--foreground)", opacity: 0.5 }} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
          {title}
        </div>
        <div className="mt-0.5 text-[11px]" style={{ color: "var(--foreground)", opacity: 0.5 }}>
          {description}
        </div>
      </div>
      <span
        className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
        style={{
          background: "var(--color-surface-subtle)",
          color: "var(--foreground)",
          opacity: 0.7,
        }}
      >
        近日公開
      </span>
    </div>
  );
}

/**
 * 投資余力診断のしくみ（タップで開閉する「ちなみに」トーンの補足）。
 * ガイドツアー実装後も、いつでも読み返せる常設導線として残す。
 */
function MechanismToggle() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
          style={{ background: "var(--color-surface-subtle)" }}
        >
          <TrendingUp size={16} style={{ color: "var(--color-brand-primary)" }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold" style={{ color: "var(--foreground)" }}>
            投資余力診断のしくみ
          </div>
          <div className="mt-0.5 text-[11px]" style={{ color: "var(--foreground)", opacity: 0.5 }}>
            「今月の上限」がどう決まるかの補足です
          </div>
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={SPRING.quick}
          style={{ flexShrink: 0 }}
          aria-hidden
        >
          <ChevronDown size={14} style={{ color: "var(--foreground)", opacity: 0.5 }} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={SPRING.quick}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {/* 「ちなみに」トーンの補足: 読まなくても困らない、脚注のような佇まい */}
              <div
                className="rounded-xl px-3.5 py-3"
                style={{ background: "rgba(28,20,16,0.04)" }}
              >
                <p
                  className="flex items-center gap-1.5 text-xs font-bold"
                  style={{ color: "var(--foreground)", opacity: 0.75 }}
                >
                  <Lightbulb size={13} style={{ color: "var(--color-brand-primary)" }} aria-hidden />
                  ちなみに、どう計算している？
                </p>
                <ul
                  className="mt-2 space-y-1.5 text-[11px] leading-relaxed"
                  style={{ color: "var(--foreground)", opacity: 0.6 }}
                >
                  <li>・まず「生活費 6 ヶ月分の備え」を最優先。備えが目標に届くまで、投資はおすすめしません</li>
                  <li>・上限は毎月の黒字の半分まで。残りの半分は現金で手元に残す想定です</li>
                  <li>・家計にゆとりがあるほどリスク許容度が上がり、検証ツールで比べられる戦略の幅が広がります</li>
                  <li>・検証ツールに渡すのは「リスク許容度」と「上限額」の 2 つだけ。名前や記録の中身は渡しません</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
