import { readdir, readFile } from "fs/promises";
import path from "path";
import { asString, asStringArray, parseFrontmatter } from "./frontmatter";
import type { VaultNote } from "./types";

/**
 * Vault 根目录。默认指向仓库自己的 obsidian/ —— 这样本地开发不用配置任何
 * 环境变量就有真实数据可看（这些笔记本来就是这个项目自己的文档，是个天然的
 * 自举 demo）。想指向别的 vault，设 VAULT_ROOT 覆盖。
 */
export function resolveVaultRoot(): string {
  const explicit = process.env.VAULT_ROOT?.trim();
  if (explicit) return path.resolve(explicit);
  return path.resolve(process.cwd(), "..", "obsidian");
}

/**
 * 提取正文里的 wikilink 目标。跳过围栏代码块和行内代码，避免把文档里当作
 * 示例写的 `[[上级笔记]]` 之类占位符误当成真实链接 —— 反正死链接也会在
 * buildLinks 里被过滤掉，这里主要是不想把示例文本的噪音传下去。
 *
 * 支持 `[[标题]]` 和 `[[标题|别名]]` 两种写法；表格里为了不跟列分隔符冲突
 * 会写成 `[[标题\|别名]]`，转义的竖线也当同一种处理。
 */
export function extractWikilinkTargets(markdown: string): string[] {
  const withoutFences = markdown.replace(/```[\s\S]*?```/g, "");
  const withoutInlineCode = withoutFences.replace(/`[^`]*`/g, "");

  const targets = new Set<string>();
  const pattern = /\[\[([^\]|]+?)(?:\\?\|[^\]]*)?\]\]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(withoutInlineCode)) !== null) {
    targets.add(match[1].trim());
  }
  return [...targets];
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
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".md"))
      .map((e) => e.name);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

/** 读取 vault 里所有笔记，解析 frontmatter，解析 wikilink 为真实存在的 slug。 */
export async function readVault(root = resolveVaultRoot()): Promise<VaultNote[]> {
  const files = await listMarkdownFiles(root);

  const drafts = await Promise.all(
    files.map(async (filename) => {
      const slug = filename.replace(/\.md$/, "");
      const raw = await readFile(path.join(root, filename), "utf8");
      const { data, body } = parseFrontmatter(raw);

      const title = asString(data.title) || slug;
      const knownKeys = new Set(["title", "tags", "created", "updated"]);
      const extra: Record<string, string> = {};
      for (const [key, value] of Object.entries(data)) {
        if (knownKeys.has(key)) continue;
        const str = asString(value);
        if (str) extra[key] = str;
      }

      return {
        slug,
        title,
        tags: asStringArray(data.tags),
        created: asString(data.created),
        updated: asString(data.updated),
        extra,
        content: body,
        linkTargets: extractWikilinkTargets(body),
      };
    }),
  );

  const resolveTarget = buildTitleResolver(drafts);

  return drafts.map((draft) => {
    const links = [...new Set(draft.linkTargets.map(resolveTarget).filter((s): s is string => s !== null))]
      // 排除自环 —— 笔记链接自己没有图谱意义
      .filter((slug) => slug !== draft.slug);

    return {
      slug: draft.slug,
      title: draft.title,
      tags: draft.tags,
      created: draft.created,
      updated: draft.updated,
      extra: draft.extra,
      content: draft.content,
      excerpt: stripMarkdown(draft.content).slice(0, 160),
      links,
      wordCount: draft.content.length,
    };
  });
}

function normalize(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, "");
}

/**
 * 用 title 归一化匹配（去空格、大小写不敏感）构建一个 wikilink 目标文本 -> slug
 * 的解析函数。链接文本和真实标题之间的细微出入（全角/半角、首尾空格）不会
 * 导致本该存在的链接被当成死链接丢掉。目标不存在时返回 null。
 *
 * 导出给 API 路由复用 —— 正文渲染时要把每个 `[[原文]]` 精确对应到 slug，
 * 而不只是拿到 readVault() 已经去重、去自环后的 links 数组。
 */
export function buildTitleResolver(
  notes: { slug: string; title: string }[],
): (target: string) => string | null {
  const bySlug = new Map(notes.map((n) => [n.slug, n] as const));
  const byNormalizedTitle = new Map(notes.map((n) => [normalize(n.title), n.slug] as const));

  return (target: string) => {
    if (bySlug.has(target)) return target;
    return byNormalizedTitle.get(normalize(target)) ?? null;
  };
}
