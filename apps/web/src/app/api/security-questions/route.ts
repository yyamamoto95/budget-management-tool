import { NextResponse } from "next/server";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5000";

/**
 * セキュリティ質問一覧の取得（認証不要）。
 * ブラウザからの直接 fetch を受け取り、内部 API へ転送する Route Handler。
 * RegisterForm コンポーネントの秘密の質問選択で使用。
 */
export async function GET() {
  const res = await fetch(`${INTERNAL_API_URL}/api/security-questions`);
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
