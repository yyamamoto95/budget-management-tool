"use client";

import { Search } from "lucide-react";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function SearchBar({ value, onChange }: Props) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2"
      style={{
        background: "var(--color-surface-subtle)",
        border: "1px solid var(--border-default)",
      }}
    >
      <Search
        size={13}
        style={{ color: "var(--foreground)", opacity: 0.35, flexShrink: 0 }}
      />
      <input
        type="search"
        placeholder="メモ・カテゴリで検索"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent text-[13px] outline-none"
        style={{ color: "var(--foreground)" }}
      />
    </div>
  );
}
