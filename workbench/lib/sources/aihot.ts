import type { HotSourceResult } from "@/lib/types";
import { applyRecencyDecay, fetchWithTimeout, idFromUrl, normalizeScore, stripHtml } from "./util";

const SOURCE = "aihot";
const LABEL = "AI 热榜";

/**
 * 对接自建的 AI 热榜服务（如 zenitlab/ai-hot-radar、tbang6860-commits/aihot）。
 *
 * 只有设置了 AIHOT_API_BASE 才启用，例如：
 *   AIHOT_API_BASE=http://localhost:3001/api/agent
 *   AIHOT_API_PATH=/curated          # 可选，默认空
 *   AIHOT_API_TOKEN=xxx              # 可选，作为 Bearer token
 *
 * 各家热榜项目的字段名不统一，这里做宽松映射：标题取 title/name/headline，
 * 链接取 url/link/href，热度取 score/heat/hot/points/stars。字段对不上时
 * 该条会被跳过，而不是整个数据源报错。
 */

type LooseRecord = Record<string, unknown>;

function pickString(record: LooseRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function pickNumber(record: LooseRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return undefined;
}

/** 响应可能是数组，也可能包在 data / items / list / results 里。 */
function extractList(payload: unknown): LooseRecord[] {
  if (Array.isArray(payload)) return payload as LooseRecord[];
  if (payload && typeof payload === "object") {
    for (const key of ["data", "items", "list", "results", "hotspots"]) {
      const value = (payload as LooseRecord)[key];
      if (Array.isArray(value)) return value as LooseRecord[];
      // 有些接口是 { data: { items: [...] } }
      if (value && typeof value === "object") {
        const nested = extractList(value);
        if (nested.length) return nested;
      }
    }
  }
  return [];
}

export function isAiHotEnabled(): boolean {
  return Boolean(process.env.AIHOT_API_BASE?.trim());
}

export async function fetchAiHot(): Promise<HotSourceResult> {
  const base = process.env.AIHOT_API_BASE?.trim();
  if (!base) {
    return { source: SOURCE, sourceLabel: LABEL, items: [] };
  }

  const path = process.env.AIHOT_API_PATH?.trim() ?? "";
  const url = `${base.replace(/\/$/, "")}${path}`;
  const headers: Record<string, string> = { accept: "application/json" };
  if (process.env.AIHOT_API_TOKEN) {
    headers.authorization = `Bearer ${process.env.AIHOT_API_TOKEN}`;
  }

  try {
    const res = await fetchWithTimeout(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = extractList(await res.json());

    const items = list
      .map((record) => {
        const title = pickString(record, ["title", "name", "headline", "text"]);
        const link = pickString(record, ["url", "link", "href", "source_url", "originalUrl"]);
        if (!title || !link) return null;

        const raw = pickNumber(record, ["score", "heat", "hot", "hotValue", "points", "stars"]);
        const published = pickString(record, [
          "publishedAt",
          "published_at",
          "createdAt",
          "created_at",
          "date",
          "time",
        ]);

        return {
          id: idFromUrl(link),
          title,
          url: link,
          source: SOURCE,
          sourceLabel: LABEL,
          score: applyRecencyDecay(raw === undefined ? 70 : normalizeScore(raw, 100), published),
          rawScore: raw,
          rawScoreLabel: raw === undefined ? "热榜收录" : `热度 ${raw}`,
          publishedAt: published,
          summary: pickString(record, ["summary", "description", "desc", "excerpt", "content"])
            ? stripHtml(
                pickString(record, ["summary", "description", "desc", "excerpt", "content"])!,
              )
            : undefined,
          author: pickString(record, ["author", "source", "site", "platform"]),
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
