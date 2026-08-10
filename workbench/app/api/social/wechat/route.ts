import { NextResponse } from "next/server";
import { readWechatData } from "@/lib/social/wechat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await readWechatData();
    return NextResponse.json({ data }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取公众号数据失败" },
      { status: 500 },
    );
  }
}
