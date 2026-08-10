/**
 * 极简 frontmatter 解析器。只覆盖这个 vault 里笔记实际会写的语法：
 * 标量、带引号的字符串、简单的多行列表（`key:\n  - item`）。
 * 不是完整 YAML —— 跟 components/Markdown.tsx 的零依赖思路一致，
 * 没必要为几行 frontmatter 引入一个完整 YAML 库。
 */

export type Frontmatter = Record<string, string | string[]>;

export function parseFrontmatter(raw: string): { data: Frontmatter; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw };

  const [, block, body] = match;
  const lines = block.split(/\r?\n/);
  const data: Frontmatter = {};

  let currentKey: string | null = null;
  let currentList: string[] | null = null;

  const flushList = () => {
    if (currentKey && currentList) data[currentKey] = currentList;
    currentKey = null;
    currentList = null;
  };

  for (const line of lines) {
    const listItem = /^\s*-\s+(.*)$/.exec(line);
    if (listItem && currentList) {
      currentList.push(stripQuotes(listItem[1].trim()));
      continue;
    }

    flushList();

    const kv = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line);
    if (!kv) continue;
    const [, key, rest] = kv;

    if (rest === "") {
      // 值为空，可能是接下来的多行列表
      currentKey = key;
      currentList = [];
      continue;
    }

    data[key] = stripQuotes(rest.trim());
  }
  flushList();

  return { data, body };
}

function stripQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

export function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function asStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}
