import { NextResponse } from "next/server";
import { getHotFeed } from "@/lib/sources";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("refresh") === "1";

  try {
    const feed = await getHotFeed(force);
    return NextResponse.json(feed, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "拉取热点失败" },
      { status: 500 },
    );
  }
}
