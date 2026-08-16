import Parser from "rss-parser";
import { FEED_SOURCES, REAL_ESTATE_KEYWORDS, type FeedSource } from "./feeds";

export type NewsItem = {
  title: string;
  link: string;
  sourceId: string;
  sourceName: string;
  publishedAt: string | null; // ISO string，拿不到日期就是 null
  snippet: string;
};

export type FeedStatus = {
  sourceId: string;
  sourceName: string;
  ok: boolean;
  itemCount: number;
  error?: string;
};

export type NewsResult = {
  items: NewsItem[];
  feedStatuses: FeedStatus[];
  fetchedAt: string;
};

const parser = new Parser({ timeout: 10_000 });
const FETCH_TIMEOUT_MS = 10_000;

function stripHtml(html: string | undefined): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isRealEstateRelated(title: string, snippet: string): boolean {
  const haystack = `${title} ${snippet}`.toLowerCase();
  return REAL_ESTATE_KEYWORDS.some((kw) => haystack.includes(kw.toLowerCase()));
}

async function fetchOneFeed(
  source: FeedSource,
  opts: { force?: boolean } = {},
): Promise<{ status: FeedStatus; items: NewsItem[] }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let xml: string;
    try {
      const res = await fetch(source.url, {
        signal: controller.signal,
        // 默认 5 分钟 ISR 缓存；点“刷新”走 no-store 强制拿最新内容
        ...(opts.force
          ? { cache: "no-store" as const }
          : { next: { revalidate: 300, tags: ["news", `feed:${source.id}`] } }),
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; GreekRealEstateNewsBot/1.0)",
        },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      xml = await res.text();
    } finally {
      clearTimeout(timer);
    }

    const feed = await parser.parseString(xml);
    const rawItems = feed.items ?? [];

    const items: NewsItem[] = rawItems
      .map((item) => {
        const title = item.title?.trim() ?? "";
        const link = item.link?.trim() ?? "";
        const snippet = stripHtml(item.contentSnippet ?? item.content ?? item.summary);
        const publishedAt = item.isoDate ?? (item.pubDate ? new Date(item.pubDate).toISOString() : null);
        return { title, link, sourceId: source.id, sourceName: source.name, publishedAt, snippet };
      })
      .filter((item) => item.title && item.link)
      .filter((item) => source.dedicated || isRealEstateRelated(item.title, item.snippet));

    return {
      status: { sourceId: source.id, sourceName: source.name, ok: true, itemCount: items.length },
      items,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      status: { sourceId: source.id, sourceName: source.name, ok: false, itemCount: 0, error: message },
      items: [],
    };
  }
}

export async function getNews(opts: { force?: boolean } = {}): Promise<NewsResult> {
  const results = await Promise.all(FEED_SOURCES.map((source) => fetchOneFeed(source, opts)));

  const seenLinks = new Set<string>();
  const items = results
    .flatMap((r) => r.items)
    .filter((item) => {
      if (seenLinks.has(item.link)) return false;
      seenLinks.add(item.link);
      return true;
    })
    .sort((a, b) => {
      const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
      const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
      return bTime - aTime;
    });

  return {
    items,
    feedStatuses: results.map((r) => r.status),
    fetchedAt: new Date().toISOString(),
  };
}
