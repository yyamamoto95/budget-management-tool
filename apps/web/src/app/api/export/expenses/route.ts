import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

const INTERNAL_API_URL = process.env.INTERNAL_API_URL ?? "http://localhost:5000";

/**
 * 支出データエクスポート（認証必須）。
 * ブラウザからのファイルダウンロードリクエストを受け取り、
 * JWT を付与して内部 API へ転送する Route Handler。
 */
export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") ?? "json";

  const res = await fetch(
    `${INTERNAL_API_URL}/api/export/expenses?format=${encodeURIComponent(format)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: format === "csv" ? "text/csv" : "application/json",
      },
    },
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: "エクスポートに失敗しました" }));
    return NextResponse.json(body, { status: res.status });
  }

  // レスポンスヘッダー（Content-Disposition 等）をそのまま転送
  const headers = new Headers();
  const contentType = res.headers.get("Content-Type");
  const contentDisposition = res.headers.get("Content-Disposition");
  if (contentType) headers.set("Content-Type", contentType);
  if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

  return new NextResponse(res.body, { status: res.status, headers });
}
