import { NextResponse } from "next/server";
import { readDouyinData } from "@/lib/social/douyin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await readDouyinData();
    // 没有数据文件是正常状态（还没配置），不是错误 —— 200 + null，
    // 前端渲染引导文案，不走 error 分支
    return NextResponse.json({ data }, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取抖音数据失败" },
      { status: 500 },
    );
  }
}
