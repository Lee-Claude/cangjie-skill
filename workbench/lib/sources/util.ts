import { createHash } from "crypto";
import { XMLParser } from "fast-xml-parser";
import type { HotItem } from "@/lib/types";

export const DEFAULT_TIMEOUT_MS = 12_000;

export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        "user-agent": "ai-workbench/0.1 (+https://github.com/lee-claude/cangjie-skill)",
        ...(init.headers ?? {}),
      },
      // 数据源自身带缓存层，这里始终取新数据
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

export function idFromUrl(url: string): string {
  return createHash("sha1").update(url).digest("hex").slice(0, 16);
}

/**
 * 把不同量纲的原始热度（HN 分数、GitHub star、平台热度…）压到 0-100。
 * 用 log 而不是线性，避免一个 5 万 star 的仓库把整张榜单压平。
 */
export function normalizeScore(raw: number, saturationPoint: number): number {
  if (!Number.isFinite(raw) || raw <= 0) return 0;
  const ratio = Math.log1p(raw) / Math.log1p(saturationPoint);
  return Math.round(Math.min(1, ratio) * 100);
}

/** 越新的条目分越高：24 小时内不衰减，之后每天衰减一档，最低保留 40%。 */
export function applyRecencyDecay(score: number, publishedAt?: string): number {
  if (!publishedAt) return score;
  const ts = Date.parse(publishedAt);
  if (Number.isNaN(ts)) return score;
  const ageHours = (Date.now() - ts) / 3_600_000;
  if (ageHours <= 24) return score;
  const factor = Math.max(0.4, 1 - (ageHours - 24) / 168); // 一周内线性衰减到 40%
  return Math.round(score * factor);
}

export function stripHtml(input: string, maxLength = 240): string {
  const text = input
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
});

export function parseXml(xml: string): Record<string, unknown> {
  return xmlParser.parse(xml) as Record<string, unknown>;
}

export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

/** RSS/Atom 里的文本节点可能是字符串，也可能是 { "#text": "..." }。 */
export function textOf(node: unknown): string {
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (node && typeof node === "object" && "#text" in node) {
    return String((node as Record<string, unknown>)["#text"] ?? "");
  }
  return "";
}

/** 去重（按 URL）并按分数降序排列。 */
export function dedupeAndRank(items: HotItem[]): HotItem[] {
  const byId = new Map<string, HotItem>();
  for (const item of items) {
    const existing = byId.get(item.id);
    if (!existing || item.score > existing.score) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()].sort((a, b) => b.score - a.score);
}
