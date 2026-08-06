import type { HotFeedResponse, HotSourceResult } from "@/lib/types";
import { fetchAiHot, fetchAiHotBriefing } from "./aihot";
import { fetchArxiv } from "./arxiv";
import { fetchGithub } from "./github";
import { fetchHackerNews } from "./hackernews";
import { fetchRssFeed, resolveFeeds } from "./rss";
import { dedupeAndRank } from "./util";

const CACHE_TTL_MS = Number(process.env.HOT_CACHE_TTL_MS ?? 5 * 60 * 1000);

let cache: { at: number; payload: HotFeedResponse } | null = null;

function collectors(): Array<() => Promise<HotSourceResult>> {
  return [
    fetchAiHot,
    fetchHackerNews,
    fetchGithub,
    fetchArxiv,
    ...resolveFeeds().map((feed) => () => fetchRssFeed(feed)),
  ];
}

/**
 * 并行拉取所有数据源。单个源失败不影响整体 —— 它的 error 会带回前端展示，
 * 其余源照常出结果。
 */
export async function getHotFeed(force = false): Promise<HotFeedResponse> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return { ...cache.payload, cached: true };
  }

  const [results, briefing] = await Promise.all([
    Promise.all(
      collectors().map(async (run) => {
        try {
          return await run();
        } catch (err) {
          return {
            source: "unknown",
            sourceLabel: "未知数据源",
            items: [],
            error: err instanceof Error ? err.message : String(err),
          } satisfies HotSourceResult;
        }
      }),
    ),
    fetchAiHotBriefing().catch(() => null),
  ]);

  const payload: HotFeedResponse = {
    items: dedupeAndRank(results.flatMap((r) => r.items)),
    sources: results.map((r) => ({
      source: r.source,
      sourceLabel: r.sourceLabel,
      count: r.items.length,
      error: r.error,
    })),
    briefing,
    fetchedAt: new Date().toISOString(),
    cached: false,
  };

  cache = { at: Date.now(), payload };
  return payload;
}
