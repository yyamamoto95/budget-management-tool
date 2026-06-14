"use client";

import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="ja">
      <body style={{ margin: 0, backgroundColor: "#fdf8f5", fontFamily: "sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100svh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              borderRadius: "16px",
              border: "1px solid rgba(28,20,16,0.08)",
              backgroundColor: "white",
              padding: "32px",
              textAlign: "center",
              boxShadow: "0 1px 4px rgba(28,20,16,0.08)",
            }}
          >
            <p style={{ fontSize: "48px", fontWeight: 900, color: "#f18840", margin: 0 }}>
              Error
            </p>
            <h1 style={{ marginTop: "12px", fontSize: "18px", fontWeight: 800, color: "#1c1410" }}>
              アプリで問題が発生しました
            </h1>
            <p style={{ marginTop: "8px", fontSize: "14px", color: "rgba(28,20,16,0.5)" }}>
              ページをリロードして再試行してください。
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "24px",
                width: "100%",
                borderRadius: "12px",
                backgroundColor: "#f18840",
                padding: "10px 24px",
                fontSize: "14px",
                fontWeight: 700,
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              再試行する
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
