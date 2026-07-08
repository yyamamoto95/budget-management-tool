"use server";

import { serverFetch, ApiError } from "../api/client";

export type ReceiptScanActionResult =
  | {
      status: "success";
      amount: number | null;
      date: string | null;
      content: string | null;
      source: "claude-cli" | "claude-api" | "ocr";
    }
  | { status: "error"; message: string };

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const;
/** API 側の受領上限（base64 で約10M文字 ≒ 元画像 約7MB）に合わせる */
const MAX_FILE_BYTES = 7 * 1024 * 1024;

type ReceiptScanResponse = {
  amount: number | null;
  date: string | null;
  content: string | null;
  source: "claude-cli" | "claude-api" | "ocr";
};

/** レシート画像を解析 API へ転送する（結果はプリフィル用。登録はしない） */
export async function scanReceiptAction(formData: FormData): Promise<ReceiptScanActionResult> {
  const file = formData.get("receipt");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "画像が選択されていません" };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return { status: "error", message: "JPEG または PNG 画像を選択してください" };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { status: "error", message: "画像サイズが大きすぎます（7MB 以下にしてください）" };
  }

  const imageBase64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  try {
    const result = await serverFetch<ReceiptScanResponse>("/api/receipt-scan", {
      method: "POST",
      body: JSON.stringify({ image: imageBase64, mimeType: file.type }),
    });
    return { status: "success", ...result };
  } catch (e) {
    const message =
      e instanceof ApiError ? e.message : "レシートの解析に失敗しました。時間をおいて再試行してください";
    return { status: "error", message };
  }
}
