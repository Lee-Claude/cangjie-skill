import type { StreamChatOptions, StreamChatResult } from "./types";

/**
 * OpenAI 兼容协议的 provider —— DeepSeek、Kimi、通义、本地 vLLM/Ollama 都能用。
 * 只需要设置：
 *   OPENAI_API_KEY=sk-xxx
 *   OPENAI_BASE_URL=https://api.deepseek.com/v1   # 默认 https://api.openai.com/v1
 *   OPENAI_MODEL=deepseek-chat
 */
export function hasOpenAIKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

type ChunkPayload = {
  choices?: { delta?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

export async function streamOpenAICompatible(
  options: StreamChatOptions,
): Promise<StreamChatResult> {
  const baseUrl = (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
    /\/$/,
    "",
  );
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    signal: options.signal,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: "system", content: options.system },
        ...options.messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    }),
  });

  if (!res.ok || !res.body) {
    const detail = await res.text().catch(() => "");
    throw new Error(`上游返回 ${res.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }

  let usage: { input: number; output: number } | undefined;

  async function* text(): AsyncGenerator<string> {
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE 以空行分隔事件；最后一段可能不完整，留在 buffer 里
      const events = buffer.split("\n\n");
      buffer = events.pop() ?? "";

      for (const event of events) {
        for (const line of event.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const data = line.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data) as ChunkPayload;
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
            if (parsed.usage) {
              usage = {
                input: parsed.usage.prompt_tokens ?? 0,
                output: parsed.usage.completion_tokens ?? 0,
              };
            }
          } catch {
            // 单个 chunk 解析失败就跳过，不要让整条流挂掉
          }
        }
      }
    }
  }

  return { model, text: text(), usage: async () => usage };
}
