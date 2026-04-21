import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5000";

/**
 * ユーザー名の使用可否確認（認証不要）。
 * ブラウザからの直接 fetch を受け取り、内部 API へ転送する Route Handler。
 * UserNameInput コンポーネントのリアルタイム重複チェックで使用。
 */
export async function GET(request: NextRequest) {
  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ available: false }, { status: 400 });
  }

  const res = await fetch(
    `${INTERNAL_API_URL}/api/register/check-username?userId=${encodeURIComponent(userId)}`,
  );

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
