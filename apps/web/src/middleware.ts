import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { importSPKI, jwtVerify } from "jose";

const ALGORITHM = "RS256";
const PUBLIC_KEY_PEM =
  process.env.JWT_PUBLIC_KEY?.replace(/\\n/g, "\n") ?? "";

/** 公開鍵を一度だけインポートしてキャッシュする */
let cachedPublicKey: CryptoKey | null = null;
async function getPublicKey(): Promise<CryptoKey | null> {
  if (!PUBLIC_KEY_PEM) return null;
  if (!cachedPublicKey) {
    cachedPublicKey = await importSPKI(PUBLIC_KEY_PEM, ALGORITHM);
  }
  return cachedPublicKey;
}

/** 初回設定をスキップしてよいルート（設定・初回設定自身） */
const SETUP_EXEMPT_PATHS = ["/setup", "/settings"];

/** 認証済みユーザーに対して初回設定未完了チェックを行い、必要ならリダイレクトを返す */
function getSetupRedirect(request: NextRequest): NextResponse | null {
  const isCompleted = request.cookies.has("setup_completed");
  if (isCompleted) return null;
  const isExempt = SETUP_EXEMPT_PATHS.some((p) =>
    request.nextUrl.pathname.startsWith(p),
  );
  if (isExempt) return null;
  return NextResponse.redirect(new URL("/setup", request.url));
}

export async function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;

  const publicKey = await getPublicKey();

  // アクセストークンが有効なら通過（オンボーディング未完了チェック付き）
  if (accessToken && publicKey) {
    try {
      await jwtVerify(accessToken, publicKey, { algorithms: [ALGORITHM] });
      return getSetupRedirect(request) ?? NextResponse.next();
    } catch {
      // 期限切れ等 → リフレッシュを試みる
    }
  }

  // リフレッシュトークンがあれば /api/refresh を試みる
  if (refreshToken) {
    try {
      const apiBase = process.env.INTERNAL_API_URL ?? "http://localhost:5000";
      const refreshRes = await fetch(`${apiBase}/api/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (refreshRes.ok) {
        const { accessToken: newAccess, refreshToken: newRefresh } =
          (await refreshRes.json()) as {
            accessToken: string;
            refreshToken: string;
          };

        const secure = process.env.NODE_ENV === "production";
        const response = getSetupRedirect(request) ?? NextResponse.next();

        response.cookies.set("access_token", newAccess, {
          httpOnly: true,
          secure,
          sameSite: "strict",
          maxAge: 15 * 60,
          path: "/",
        });
        response.cookies.set("refresh_token", newRefresh, {
          httpOnly: true,
          secure,
          sameSite: "strict",
          maxAge: 7 * 24 * 60 * 60,
          path: "/",
        });

        return response;
      }
    } catch {
      // リフレッシュ失敗 → ログイン画面へ
    }
  }

  // トークンなし / 無効 → ログイン画面へ。
  // トークンを持っていた（= セッションが切れた）場合のみ expired=1 を付与し、
  // 初回訪問やログアウト後にセッション切れトーストが出ないようにする（#549）
  const loginUrl = new URL("/login", request.url);
  if (accessToken || refreshToken) {
    loginUrl.searchParams.set("expired", "1");
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // /register, /forgot-password は公開ルートのため除外
  // /setup は認証が必要なため含める
  matcher: ["/", "/calendar", "/records", "/records/:path*", "/expenses/:path*", "/imports", "/report", "/report/:path*", "/settings", "/settings/:path*", "/setup", "/my-page"],
};
