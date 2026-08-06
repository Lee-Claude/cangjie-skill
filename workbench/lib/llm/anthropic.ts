import Anthropic from "@anthropic-ai/sdk";
import type { StreamChatOptions, StreamChatResult } from "./types";

/** 默认用当前最强的 Claude 模型；用 ANTHROPIC_MODEL 覆盖。 */
export const DEFAULT_ANTHROPIC_MODEL = "claude-opus-5";

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

/**
 * 流式调用 Claude Messages API。
 *
 * 注意 Claude Opus 5 默认开启 adaptive thinking，thinking token 和回复正文
 * 共用 max_tokens，所以这里给了比较宽的额度（默认 64000），避免回答被截断。
 * 不要传 temperature / top_p / top_k —— Opus 5 会直接 400。
 */
export async function streamAnthropic(
  options: StreamChatOptions,
): Promise<StreamChatResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_ANTHROPIC_MODEL;
  const maxTokens = Number(process.env.ANTHROPIC_MAX_TOKENS ?? 64_000);

  const stream = client.messages.stream(
    {
      model,
      max_tokens: maxTokens,
      system: options.system,
      thinking: { type: "adaptive" },
      output_config: { effort: (process.env.ANTHROPIC_EFFORT as "high") || "high" },
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    },
    { signal: options.signal },
  );

  async function* text(): AsyncGenerator<string> {
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }

  return {
    model,
    text: text(),
    // finalMessage() 在流被完整消费后 resolve，用来拿 usage
    usage: async () => {
      const final = await stream.finalMessage();
      return { input: final.usage.input_tokens, output: final.usage.output_tokens };
    },
  };
}
