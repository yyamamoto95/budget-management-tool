"use server";

import { serverFetch, ApiError } from "../api/client";

/** 取り込み候補（API レスポンス。@budget/common の ImportCandidate + duplicateSuspect） */
export type ImportCandidateRow = {
  date: string;
  amount: number;
  balanceType: 0 | 1;
  content: string;
  categoryId: number;
  confidence: "high" | "low";
  raw: string;
  duplicateSuspect: boolean;
};

export type AnalyzeImportActionResult =
  | {
      status: "success";
      candidates: ImportCandidateRow[];
      skippedRows: number;
      source: "claude-cli" | "claude-api";
    }
  | { status: "error"; message: string };

export type CommitImportActionResult =
  | { status: "success"; registered: number }
  | { status: "error"; message: string };

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"] as const;
/** API 側の受領上限（base64 で約10M文字 ≒ 元画像 約7MB）に合わせる */
const MAX_FILE_BYTES = 7 * 1024 * 1024;

type AnalyzeResponse = {
  candidates: ImportCandidateRow[];
  skippedRows: number;
  source: "claude-cli" | "claude-api";
};

/** 明細一覧スクショを解析 API へ転送する（候補の抽出のみ。登録はしない） */
export async function analyzeImportAction(formData: FormData): Promise<AnalyzeImportActionResult> {
  const file = formData.get("statement");
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
    const result = await serverFetch<AnalyzeResponse>("/api/imports/analyze", {
      method: "POST",
      body: JSON.stringify({ image: imageBase64, mimeType: file.type }),
    });
    return { status: "success", ...result };
  } catch (e) {
    const message =
      e instanceof ApiError ? e.message : "スクショの解析に失敗しました。時間をおいて再試行してください";
    return { status: "error", message };
  }
}

export type CommitImportRowInput = {
  date: string;
  amount: number;
  balanceType: 0 | 1;
  categoryId: number;
  content: string;
};

/** 選択・編集済みの候補を一括登録する */
export async function commitImportAction(
  rows: CommitImportRowInput[],
): Promise<CommitImportActionResult> {
  try {
    const result = await serverFetch<{ registered: number }>("/api/imports/commit", {
      method: "POST",
      body: JSON.stringify({ rows }),
    });
    return { status: "success", registered: result.registered };
  } catch (e) {
    const message = e instanceof ApiError ? e.message : "登録に失敗しました。時間をおいて再試行してください";
    return { status: "error", message };
  }
}
