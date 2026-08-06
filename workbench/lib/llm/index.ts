import { hasAnthropicKey, streamAnthropic } from "./anthropic";
import { hasOpenAIKey, streamOpenAICompatible } from "./openai";
import type { ProviderName, StreamChatOptions, StreamChatResult } from "./types";

export type { StreamChatOptions, StreamChatResult, ProviderName };

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "还没配置 API key。在 workbench/.env.local 里设置 ANTHROPIC_API_KEY（推荐），" +
        "或者设置 OPENAI_API_KEY + OPENAI_BASE_URL 用兼容 OpenAI 协议的模型。",
    );
    this.name = "MissingApiKeyError";
  }
}

/** LLM_PROVIDER 显式指定，否则谁有 key 用谁，Claude 优先。 */
export function resolveProvider(): ProviderName | null {
  const explicit = process.env.LLM_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic") return hasAnthropicKey() ? "anthropic" : null;
  if (explicit === "openai") return hasOpenAIKey() ? "openai" : null;
  if (hasAnthropicKey()) return "anthropic";
  if (hasOpenAIKey()) return "openai";
  return null;
}

export async function streamChat(options: StreamChatOptions): Promise<StreamChatResult> {
  const provider = resolveProvider();
  if (!provider) throw new MissingApiKeyError();
  return provider === "anthropic"
    ? streamAnthropic(options)
    : streamOpenAICompatible(options);
}
