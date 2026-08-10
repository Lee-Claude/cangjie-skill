import type { HotSourceResult } from "@/lib/types";
import {
  applyRecencyDecay,
  fetchWithTimeout,
  idFromUrl,
  normalizeScore,
} from "./util";

const SOURCE = "hackernews";
const LABEL = "Hacker News";

/** HN Algolia 搜索接口，按热度排序，只取最近 3 天内跟 AI 相关的条目。 */
const QUERY_TERMS = [
  "AI",
  "LLM",
  "GPT",
  "Claude",
  "Anthropic",
  "OpenAI",
  "agent",
  "diffusion",
];

type AlgoliaHit = {
  objectID: string;
  title?: string;
  url?: string | null;
  points?: number;
  num_comments?: number;
  author?: string;
  created_at?: string;
  story_text?: string | null;
};

export async function fetchHackerNews(): Promise<HotSourceResult> {
  const since = Math.floor(Date.now() / 1000) - 3 * 24 * 3600;
  const query = encodeURIComponent(QUERY_TERMS.join(" "));
  const url =
    `https://hn.algolia.com/api/v1/search?query=${query}` +
    `&tags=story&numericFilters=created_at_i>${since},points>20&hitsPerPage=40`;

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { hits?: AlgoliaHit[] };

    const items = (data.hits ?? [])
      .filter((hit) => hit.title)
      .map((hit) => {
        const link = hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`;
        const points = hit.points ?? 0;
        // HN 上 500 分已经是头条级别，用它做饱和点
        const base = normalizeScore(points, 500);
        return {
          id: idFromUrl(link),
          title: hit.title!,
          url: link,
          source: SOURCE,
          sourceLabel: LABEL,
          score: applyRecencyDecay(base, hit.created_at),
          rawScore: points,
          rawScoreLabel: `${points} points · ${hit.num_comments ?? 0} comments`,
          publishedAt: hit.created_at,
          author: hit.author,
          summary: hit.story_text ? hit.story_text.slice(0, 240) : undefined,
        };
      });

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
