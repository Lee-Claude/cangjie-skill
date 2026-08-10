import type { HotSourceResult } from "@/lib/types";
import {
  applyRecencyDecay,
  asArray,
  fetchWithTimeout,
  idFromUrl,
  parseXml,
  stripHtml,
  textOf,
} from "./util";

const SOURCE = "arxiv";
const LABEL = "arXiv";

type AtomEntry = {
  id?: unknown;
  title?: unknown;
  summary?: unknown;
  published?: unknown;
  updated?: unknown;
  author?: unknown;
  link?: unknown;
};

/** cs.AI / cs.LG / cs.CL 最新提交。arXiv 没有热度指标，用"新" 当热度。 */
export async function fetchArxiv(): Promise<HotSourceResult> {
  const url =
    "http://export.arxiv.org/api/query?" +
    "search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL" +
    "&sortBy=submittedDate&sortOrder=descending&max_results=25";

  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parseXml(await res.text());
    const feed = (parsed.feed ?? {}) as Record<string, unknown>;
    const entries = asArray(feed.entry as AtomEntry | AtomEntry[] | undefined);

    const items = entries.map((entry, index) => {
      const link = textOf(entry.id) || `https://arxiv.org/abs/unknown-${index}`;
      const published = textOf(entry.published) || textOf(entry.updated) || undefined;
      const authors = asArray(entry.author as unknown)
        .map((a) =>
          a && typeof a === "object" && "name" in a
            ? String((a as Record<string, unknown>).name)
            : "",
        )
        .filter(Boolean);

      // 榜首 80 分递减到 30 分，再叠加时间衰减
      const base = Math.max(30, 80 - index * 2);
      return {
        id: idFromUrl(link),
        title: stripHtml(textOf(entry.title), 200),
        url: link,
        source: SOURCE,
        sourceLabel: LABEL,
        score: applyRecencyDecay(base, published),
        rawScoreLabel: "新论文",
        publishedAt: published,
        author: authors.slice(0, 3).join(", "),
        summary: stripHtml(textOf(entry.summary)),
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
