"use client";

import { Fragment, type ReactNode } from "react";

/**
 * 极简 Markdown 渲染。只覆盖模型实际会输出的那几种语法：
 * 围栏代码块、标题、有序/无序列表、加粗、行内代码、链接。
 * 全部构造成 React 元素，不走 dangerouslySetInnerHTML，天然免疫 XSS。
 */

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  // 行内代码 / 加粗 / 链接，按出现顺序切分
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith("`")) {
      nodes.push(
        <code key={key} className="rounded bg-ink-800 px-1.5 py-0.5 text-[0.85em] text-accent">
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={key} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        nodes.push(
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent underline underline-offset-2 hover:text-accent-dim"
          >
            {linkMatch[1]}
          </a>,
        );
      } else {
        nodes.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

type Block =
  | { kind: "code"; lang: string; content: string }
  | { kind: "heading"; level: number; content: string }
  | { kind: "list"; ordered: boolean; items: string[] }
  | { kind: "paragraph"; content: string };

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 围栏代码块（流式输出中可能还没收到结束围栏，按到末尾处理）
    const fence = /^```(\w*)\s*$/.exec(line);
    if (fence) {
      const lang = fence[1] ?? "";
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        body.push(lines[i]);
        i++;
      }
      i++; // 跳过结束围栏
      blocks.push({ kind: "code", lang, content: body.join("\n") });
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      blocks.push({ kind: "heading", level: heading[1].length, content: heading[2] });
      i++;
      continue;
    }

    const listMatch = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(line);
    if (listMatch) {
      const ordered = /\d/.test(listMatch[1]);
      const items: string[] = [];
      while (i < lines.length) {
        const m = /^\s*([-*]|\d+\.)\s+(.*)$/.exec(lines[i]);
        if (!m) break;
        items.push(m[2]);
        i++;
      }
      blocks.push({ kind: "list", ordered, items });
      continue;
    }

    if (!line.trim()) {
      i++;
      continue;
    }

    // 连续非空行合并成一个段落
    const paragraph: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,4}\s/.test(lines[i]) &&
      !/^\s*([-*]|\d+\.)\s/.test(lines[i])
    ) {
      paragraph.push(lines[i]);
      i++;
    }
    blocks.push({ kind: "paragraph", content: paragraph.join("\n") });
  }

  return blocks;
}

export function Markdown({ text }: { text: string }) {
  const blocks = parseBlocks(text);

  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-ink-100">
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.kind) {
          case "code":
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-lg border border-ink-700 bg-ink-950 p-3 text-[13px] leading-relaxed"
              >
                {block.lang && (
                  <div className="mb-2 text-[11px] uppercase tracking-wide text-ink-500">
                    {block.lang}
                  </div>
                )}
                <code className="text-ink-100">{block.content}</code>
              </pre>
            );
          case "heading": {
            const sizes = ["text-xl", "text-lg", "text-base", "text-sm"];
            return (
              <p
                key={key}
                className={`${sizes[block.level - 1]} font-semibold text-white`}
              >
                {renderInline(block.content, key)}
              </p>
            );
          }
          case "list":
            return block.ordered ? (
              <ol key={key} className="list-decimal space-y-1 pl-5 marker:text-ink-500">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="list-disc space-y-1 pl-5 marker:text-ink-500">
                {block.items.map((item, j) => (
                  <li key={`${key}-${j}`}>{renderInline(item, `${key}-${j}`)}</li>
                ))}
              </ul>
            );
          case "paragraph":
            return (
              <p key={key} className="whitespace-pre-wrap">
                {block.content.split("\n").map((line, j) => (
                  <Fragment key={`${key}-${j}`}>
                    {j > 0 && <br />}
                    {renderInline(line, `${key}-${j}`)}
                  </Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}
