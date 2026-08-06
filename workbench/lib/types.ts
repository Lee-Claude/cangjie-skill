export type HotItem = {
  /** 稳定的去重 ID，一般由 url 派生 */
  id: string;
  title: string;
  url: string;
  /** 数据源 key，例如 hackernews / github / arxiv / aihot / rss:机器之心 */
  source: string;
  /** 展示用的数据源名称 */
  sourceLabel: string;
  /** 归一化到 0-100 的热度分 */
  score: number;
  /** 原始热度值（点赞数 / star 数 / 平台热度），用于展示 */
  rawScore?: number;
  rawScoreLabel?: string;
  /** ISO 时间字符串 */
  publishedAt?: string;
  summary?: string;
  author?: string;
  tags?: string[];
};

export type HotSourceResult = {
  source: string;
  sourceLabel: string;
  items: HotItem[];
  error?: string;
};

export type HotFeedResponse = {
  items: HotItem[];
  sources: { source: string; sourceLabel: string; count: number; error?: string }[];
  fetchedAt: string;
  cached: boolean;
};

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  /** 仅前端使用：这条消息是否还在流式输出中 */
  streaming?: boolean;
  error?: string;
};

export type ChatRequestBody = {
  messages: { role: ChatRole; content: string }[];
  /** 被"投喂"给 AI 的热点条目，会拼进 system prompt */
  context?: HotItem[];
  /** 创作模板 key，见 lib/templates.ts */
  template?: string;
};

/** SSE 事件：服务端 -> 前端 */
export type ChatStreamEvent =
  | { type: "delta"; text: string }
  | { type: "done"; usage?: { input: number; output: number } }
  | { type: "error"; message: string };
