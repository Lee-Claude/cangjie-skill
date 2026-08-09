import { readdir, readFile } from "fs/promises";
import path from "path";
import { asString, asStringArray, parseFrontmatter } from "@/lib/vault/frontmatter";
import type { InsightNote } from "./types";

/**
 * 社媒洞察笔记目录。跟知识图谱共享同一个 vault 根（默认仓库自己的 ../obsidian），
 * 但只读 insights/ 子目录 —— 这些是"研究简报"，不是知识库主体的双链笔记，
 * 单独开一个目录，不跟 lib/vault/read.ts 混在一起：
 *   1. 不需要 wikilink 解析、不需要参与知识图谱
 *   2. 避免为了这一个子功能改造已经验证过的核心 vault 读取逻辑
 */
export function resolveInsightsRoot(): string {
  const explicit = process.env.INSIGHTS_ROOT?.trim();
  if (explicit) return path.resolve(explicit);
  const vaultRoot = process.env.VAULT_ROOT?.trim() || path.resolve(process.cwd(), "..", "obsidian");
  return path.join(path.resolve(vaultRoot), "insights");
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[\[([^\]|]+)(?:\\?\|[^\]]*)?\]\]/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function listMarkdownFiles(root: string): Promise<string[]> {
  try {
    const entries = await readdir(root, { withFileTypes: true });
    return entries.filter((e) => e.isFile() && e.name.endsWith(".md")).map((e) => e.name);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

export async function readInsights(root = resolveInsightsRoot()): Promise<InsightNote[]> {
  const files = await listMarkdownFiles(root);

  const notes = await Promise.all(
    files.map(async (filename) => {
      const slug = filename.replace(/\.md$/, "");
      const raw = await readFile(path.join(root, filename), "utf8");
      const { data, body } = parseFrontmatter(raw);

      return {
        slug,
        title: asString(data.title) || slug,
        platform: asString(data.platform),
        period: asString(data.period),
        created: asString(data.created),
        tags: asStringArray(data.tags),
        excerpt: stripMarkdown(body).slice(0, 160),
        content: body,
      };
    }),
  );

  return notes.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));
}
