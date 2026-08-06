import type { HotSourceResult } from "@/lib/types";
import { fetchWithTimeout, idFromUrl, normalizeScore, stripHtml } from "./util";

const SOURCE = "github";
const LABEL = "GitHub Trending";

type Repo = {
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  created_at: string;
  pushed_at: string;
  topics?: string[];
  owner?: { login: string };
};

/**
 * GitHub 没有官方 trending API，这里用 search 近似：
 * 最近 60 天内新建、star 数 > 100、主题跟 AI 相关的仓库。
 * 设置 GITHUB_TOKEN 可以把速率限制从 10 次/分钟提到 30 次/分钟。
 */
export async function fetchGithub(): Promise<HotSourceResult> {
  const since = new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const query = encodeURIComponent(
    `created:>${since} stars:>100 topic:ai OR topic:llm OR topic:agent OR topic:aigc OR topic:rag`,
  );
  const url = `https://api.github.com/search/repositories?q=${query}&sort=stars&order=desc&per_page=30`;

  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) {
    headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetchWithTimeout(url, { headers });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { items?: Repo[] };

    const items = (data.items ?? []).map((repo) => ({
      id: idFromUrl(repo.html_url),
      title: repo.full_name,
      url: repo.html_url,
      source: SOURCE,
      sourceLabel: LABEL,
      // 新仓库 5000 star 已经很炸裂，用它做饱和点。这里不做时间衰减：
      // 查询本身已经限定了"最近 60 天新建"。
      score: normalizeScore(repo.stargazers_count, 5000),
      rawScore: repo.stargazers_count,
      rawScoreLabel: `★ ${repo.stargazers_count.toLocaleString()}`,
      publishedAt: repo.pushed_at ?? repo.created_at,
      author: repo.owner?.login,
      summary: repo.description ? stripHtml(repo.description) : undefined,
      tags: repo.topics?.slice(0, 5),
    }));

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
