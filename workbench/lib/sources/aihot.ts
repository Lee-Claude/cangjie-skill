import type { AiHotBriefing, HotSourceResult } from "@/lib/types";
import { applyRecencyDecay, fetchWithTimeout, idFromUrl, normalizeScore, stripHtml } from "./util";

const SOURCE = "aihot";
const LABEL = "AI 热榜";

/**
 * 接入 AI hot（github.com/laolaoshiren/ai-hot）。
 *
 * 这个项目每 6 小时把榜单写回自己仓库的 data/ 目录，所以不需要部署任何东西 ——
 * 直接读 raw.githubusercontent 上的 JSON 就行，开箱即用。
 *
 * 用到两个文件：
 *   data/hot.json      —— 热榜条目（新闻 / 工具 / 项目 / 模型）
 *   data/briefing.json —— 每日 AI 简报（一段话总结当天主线）
 *
 * 想换成自己的 fork 或镜像：
 *   AIHOT_REPO=owner/repo      默认 laolaoshiren/ai-hot
 *   AIHOT_BRANCH=main
 *   AIHOT_BASE_URL=https://…   直接指定放着 hot.json / briefing.json 的目录
 *   AIHOT_ENABLED=false        关掉这个源
 */

const DEFAULT_REPO = "laolaoshiren/ai-hot";

/** hot.json 里单条的结构，字段照抄自真实数据。 */
type AiHotItem = {
  title?: string;
  title_zh?: string;
  name?: string;
  url?: string;
  internal_url?: string;
  type?: string;
  type_label?: string;
  category?: string;
  source?: string;
  score?: number;
  stars?: number;
  time?: string;
  detail?: string;
  description?: string;
  ai_summary?: string;
};

type HotPayload = {
  updated_at?: string;
  total?: number;
  /** 三个键指向同一批数据，取到哪个用哪个 */
  hot_list?: AiHotItem[];
  top_20?: AiHotItem[];
  items?: AiHotItem[];
};

type BriefingPayload = {
  date?: string;
  content?: string;
  emoji?: string;
  news_count?: number;
  sources?: Record<string, number>;
};

export function isAiHotEnabled(): boolean {
  return process.env.AIHOT_ENABLED?.trim().toLowerCase() !== "false";
}

function baseUrl(): string {
  const explicit = process.env.AIHOT_BASE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const repo = process.env.AIHOT_REPO?.trim() || DEFAULT_REPO;
  const branch = process.env.AIHOT_BRANCH?.trim() || "main";
  return `https://raw.githubusercontent.com/${repo}/${branch}/data`;
}

/** hot.json 的 score 是个位数到十几的小整数（实测 6–15），不是百分制。 */
const SCORE_SATURATION = 30;

export async function fetchAiHot(): Promise<HotSourceResult> {
  if (!isAiHotEnabled()) {
    return { source: SOURCE, sourceLabel: LABEL, items: [] };
  }

  try {
    const res = await fetchWithTimeout(`${baseUrl()}/hot.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = (await res.json()) as HotPayload;

    const raw = payload.hot_list ?? payload.items ?? payload.top_20 ?? [];

    const items = raw
      .map((entry) => {
        // 外链是创作者真正要看的东西；没有外链才退回站内页
        const link = entry.url ?? entry.internal_url;
        const title = entry.title_zh ?? entry.title ?? entry.name;
        if (!link || !title) return null;

        // 榜单本身已经是筛过的 top N，所以基准分给得比较高
        const base =
          typeof entry.score === "number"
            ? normalizeScore(entry.score, SCORE_SATURATION)
            : typeof entry.stars === "number"
              ? normalizeScore(entry.stars, 5000)
              : 70;

        const published = entry.time ?? entry.detail;
        const summary = entry.ai_summary ?? entry.description;

        return {
          id: idFromUrl(link),
          title: stripHtml(title, 200),
          url: link,
          source: SOURCE,
          sourceLabel: LABEL,
          score: applyRecencyDecay(base, published),
          rawScore: entry.score,
          rawScoreLabel: entry.type_label ?? entry.category ?? "热榜收录",
          publishedAt: published,
          author: entry.source,
          summary: summary ? stripHtml(summary) : undefined,
          tags: [entry.category, entry.type].filter(
            (t): t is string => typeof t === "string" && t.length > 0,
          ),
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return { source: SOURCE, sourceLabel: LABEL, items };
  } catch (err) {
    return {
      source: SOURCE,
      sourceLabel: LABEL,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/** 每日 AI 简报。拿不到就返回 null —— 它只是锦上添花，不该拖累榜单。 */
export async function fetchAiHotBriefing(): Promise<AiHotBriefing | null> {
  if (!isAiHotEnabled()) return null;

  try {
    const res = await fetchWithTimeout(`${baseUrl()}/briefing.json`);
    if (!res.ok) return null;
    const payload = (await res.json()) as BriefingPayload;
    if (!payload.content) return null;

    return {
      date: payload.date ?? "",
      content: payload.content,
      emoji: payload.emoji,
      newsCount: payload.news_count,
      sources: payload.sources,
    };
  } catch {
    return null;
  }
}
