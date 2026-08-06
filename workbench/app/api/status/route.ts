import { NextResponse } from "next/server";
import { DEFAULT_ANTHROPIC_MODEL } from "@/lib/llm/anthropic";
import { resolveProvider } from "@/lib/llm";
import { isAiHotEnabled } from "@/lib/sources/aihot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 前端用它判断要不要显示"还没配 API key"的提示条。 */
export async function GET() {
  const provider = resolveProvider();
  const model =
    provider === "anthropic"
      ? process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL
      : provider === "openai"
        ? process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini"
        : null;

  return NextResponse.json(
    { provider, model, aiHotConnected: isAiHotEnabled() },
    { headers: { "cache-control": "no-store" } },
  );
}
