"use client";

import { useState } from "react";

type ExportFormat = "json" | "csv";

export function DataExportSection() {
  const [format, setFormat] = useState<ExportFormat>("json");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/export/expenses?format=${format}`, {
        headers: { Accept: format === "csv" ? "text/csv" : "application/json" },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ message: "エクスポートに失敗しました" }));
        throw new Error((body as { message?: string }).message ?? "エクスポートに失敗しました");
      }

      const blob = await res.blob();
      const contentDisposition = res.headers.get("Content-Disposition") ?? "";
      const match = contentDisposition.match(/filename="(.+?)"/);
      const filename = match?.[1] ?? `expenses.${format}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エクスポートに失敗しました");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border p-5 space-y-4"
      style={{
        background: "var(--color-surface-default)",
        borderColor: "var(--border-default)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div>
        <h2
          className="text-[13px] font-extrabold"
          style={{ color: "var(--foreground)" }}
        >
          全データのバックアップ
        </h2>
        <p
          className="mt-1 text-[11px] font-medium"
          style={{ color: "var(--foreground)", opacity: 0.5 }}
        >
          いつでもデータを持ち出し可能です。サービスへの依存を気にせずご利用いただけます。
        </p>
      </div>

      {/* フォーマット選択 */}
      <div className="flex gap-3">
        {(["json", "csv"] as ExportFormat[]).map((f) => (
          <label key={f} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              name="exportFormat"
              value={f}
              checked={format === f}
              onChange={() => setFormat(f)}
              className="accent-[var(--color-brand-primary)]"
            />
            <span
              className="text-sm font-bold uppercase font-mono"
              style={{ color: "var(--foreground)" }}
            >
              {f}
            </span>
          </label>
        ))}
      </div>

      <div
        className="rounded-xl border px-3 py-2 text-xs font-medium"
        style={{
          background: "var(--color-surface-subtle)",
          borderColor: "var(--border-default)",
          color: "var(--foreground)",
          opacity: 0.7,
        }}
      >
        {format === "json" && <p>JSON 形式: 構造化データ。他ツールへのインポートやプログラムでの加工に最適</p>}
        {format === "csv" && <p>CSV 形式: Excel / Google スプレッドシートで直接開けます</p>}
      </div>

      {error && (
        <p
          className="rounded-xl border px-3 py-2 text-sm font-medium"
          style={{
            background: "var(--color-danger-light)",
            borderColor: "var(--color-danger)",
            color: "var(--foreground)",
          }}
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={isLoading}
        className="w-full rounded-xl py-3 text-[13px] font-bold transition-colors disabled:opacity-50"
        style={{
          background: "var(--color-surface-subtle)",
          color: "var(--color-brand-primary)",
          border: "1px solid var(--border-default)",
        }}
      >
        {isLoading ? "準備中..." : `${format.toUpperCase()} でダウンロード`}
      </button>
    </div>
  );
}
