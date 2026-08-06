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

export type RssFeedConfig = { label: string; url: string };

/** 默认订阅的中文 AI 媒体。用 HOT_RSS_FEEDS 环境变量覆盖。 */
const DEFAULT_FEEDS: RssFeedConfig[] = [
  { label: "量子位", url: "https://www.qbitai.com/feed" },
  { label: "机器之心", url: "https://www.jiqizhixin.com/rss" },
];

/** 解析 `HOT_RSS_FEEDS="量子位|https://…,机器之心|https://…"`。 */
export function resolveFeeds(): RssFeedConfig[] {
  const raw = process.env.HOT_RSS_FEEDS?.trim();
  if (!raw) return DEFAULT_FEEDS;
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const sep = entry.indexOf("|");
      if (sep === -1) return { label: new URL(entry).hostname, url: entry };
      return { label: entry.slice(0, sep).trim(), url: entry.slice(sep + 1).trim() };
    });
}

type FeedItem = Record<string, unknown>;

function extractAuthor(item: FeedItem): string | undefined {
  // RSS 2.0 是文本节点；Atom 是 <author><name>…</name></author>
  const raw = item.author ?? item["dc:creator"];
  if (typeof raw === "string") return raw.trim() || undefined;
  const first = Array.isArray(raw) ? raw[0] : raw;
  if (first && typeof first === "object") {
    const name = (first as Record<string, unknown>).name;
    const text = textOf(name) || textOf(first);
    return text.trim() || undefined;
  }
  return undefined;
}

function extractLink(item: FeedItem): string {
  // RSS 2.0: <link>text</link>；Atom: <link href="..."/>
  const link = item.link;
  if (typeof link === "string") return link;
  if (Array.isArray(link)) {
    for (const candidate of link) {
      const href = (candidate as Record<string, unknown>)?.["@_href"];
      if (typeof href === "string") return href;
    }
  }
  if (link && typeof link === "object") {
    const href = (link as Record<string, unknown>)["@_href"];
    if (typeof href === "string") return href;
    return textOf(link);
  }
  return textOf(item.guid);
}

export async function fetchRssFeed(feed: RssFeedConfig): Promise<HotSourceResult> {
  const source = `rss:${feed.label}`;

  try {
    const res = await fetchWithTimeout(feed.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const parsed = parseXml(await res.text());

    // RSS 2.0 走 rss.channel.item，Atom 走 feed.entry
    const channel = (parsed.rss as Record<string, unknown> | undefined)?.channel as
      | Record<string, unknown>
      | undefined;
    const atomFeed = parsed.feed as Record<string, unknown> | undefined;
    const rawItems = asArray<FeedItem>(
      (channel?.item ?? atomFeed?.entry) as FeedItem | FeedItem[] | undefined,
    );

    const items = rawItems.slice(0, 20).map((item, index) => {
      const link = extractLink(item) || `${feed.url}#${index}`;
      const published =
        textOf(item.pubDate) || textOf(item.published) || textOf(item.updated) || undefined;
      const publishedIso = published
        ? new Date(published).toString() === "Invalid Date"
          ? undefined
          : new Date(published).toISOString()
        : undefined;

      // RSS 没有热度字段，用榜位近似：越靠前越新越热
      const base = Math.max(35, 75 - index * 2);
      return {
        id: idFromUrl(link),
        title: stripHtml(textOf(item.title), 200),
        url: link,
        source,
        sourceLabel: feed.label,
        score: applyRecencyDecay(base, publishedIso),
        rawScoreLabel: "媒体报道",
        publishedAt: publishedIso,
        author: extractAuthor(item),
        summary: stripHtml(
          textOf(item.description) || textOf(item.summary) || textOf(item.content),
        ),
      };
    });

    return { source, sourceLabel: feed.label, items };
  } catch (err) {
    return {
      source,
      sourceLabel: feed.label,
      items: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
