import type { ChatRole } from "@/lib/types";

export type StreamChatOptions = {
  system: string;
  messages: { role: ChatRole; content: string }[];
  signal?: AbortSignal;
};

export type StreamChatResult = {
  model: string;
  /** 逐块吐出的正文文本 */
  text: AsyncGenerator<string>;
  /** 流消费完之后调用，拿 token 用量；拿不到就返回 undefined */
  usage: () => Promise<{ input: number; output: number } | undefined>;
};

export type ProviderName = "anthropic" | "openai";
