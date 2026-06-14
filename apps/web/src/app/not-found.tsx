import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#fdf8f5] px-4">
      <div
        className="w-full max-w-sm rounded-2xl border border-[rgba(28,20,16,0.08)] bg-white p-8 text-center"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <p className="text-6xl font-extrabold text-[#f18840]">404</p>
        <h1 className="mt-3 text-xl font-extrabold text-[#1c1410]">
          ページが見つかりません
        </h1>
        <p className="mt-2 text-sm text-[#1c1410]/50">
          URLが正しいか確認してください。
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-[#f18840] px-6 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-80"
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}
