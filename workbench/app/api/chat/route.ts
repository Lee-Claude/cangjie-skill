import { NextResponse } from "next/server";
import { MissingApiKeyError, streamChat } from "@/lib/llm";
import { buildSystemPrompt } from "@/lib/prompt";
import type { ChatRequestBody, ChatStreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 40;
const MAX_CONTEXT_ITEMS = 10;

function sse(event: ChatStreamEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const messages = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && m.content.trim(),
  );
  if (messages.length === 0) {
    return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
  }

  const system = buildSystemPrompt(
    (body.context ?? []).slice(0, MAX_CONTEXT_ITEMS),
    body.template,
  );

  let result;
  try {
    result = await streamChat({
      system,
      // 只带最近若干轮，避免上下文无限增长
      messages: messages.slice(-MAX_MESSAGES),
      signal: request.signal,
    });
  } catch (err) {
    const status = err instanceof MissingApiKeyError ? 428 : 502;
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "调用模型失败" },
      { status },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of result.text) {
          controller.enqueue(encoder.encode(sse({ type: "delta", text: chunk })));
        }
        const usage = await result.usage().catch(() => undefined);
        controller.enqueue(encoder.encode(sse({ type: "done", usage })));
      } catch (err) {
        // 用户中断（前端 abort）不算错误，静默收尾
        const aborted = err instanceof Error && err.name === "AbortError";
        if (!aborted) {
          const message = err instanceof Error ? err.message : "流式输出中断";
          controller.enqueue(encoder.encode(sse({ type: "error", message })));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // 关掉 nginx 之类反代的缓冲，否则流会被攒成一坨再发
      "x-accel-buffering": "no",
    },
  });
}
