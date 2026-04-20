import { NextResponse } from "next/server";

/** ECS ヘルスチェック用エンドポイント（認証不要・軽量） */
export function GET() {
  return NextResponse.json({ status: "ok" });
}
