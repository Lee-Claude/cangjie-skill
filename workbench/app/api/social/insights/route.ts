import { NextResponse } from "next/server";
import { readInsights, resolveInsightsRoot } from "@/lib/social/insights";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const notes = await readInsights();
    return NextResponse.json(
      { notes, root: resolveInsightsRoot() },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取社媒洞察失败" },
      { status: 500 },
    );
  }
}
