"use client";

import { useState } from "react";
import { Markdown } from "@/components/Markdown";
import { useInsights } from "@/hooks/useSocial";

export function InsightsFeed() {
  const { data, loading, error } = useInsights();
  const [expanded, setExpanded] = useState<string | null>(null);

  if (loading) return <p className="p-6 text-sm text-ink-500">加载中…</p>;
  if (error) {
    return (
      <p className="m-4 rounded-lg border border-hot/40 bg-hot/10 px-3 py-2 text-xs text-hot">{error}</p>
    );
  }

  const notes = data?.notes ?? [];

  if (notes.length === 0) {
    return (
      <div className="p-6 text-sm text-ink-500">
        <p>还没有洞察笔记。</p>
        <p className="mt-2 text-xs">
          在 <code className="rounded bg-ink-800 px-1 py-0.5">obsidian/insights/</code> 目录下新建一篇
          Markdown，带上 <code className="rounded bg-ink-800 px-1 py-0.5">title</code> /{" "}
          <code className="rounded bg-ink-800 px-1 py-0.5">platform</code> /{" "}
          <code className="rounded bg-ink-800 px-1 py-0.5">created</code> frontmatter 就能显示在这里。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4">
      {notes.map((note) => {
        const open = expanded === note.slug;
        return (
          <article key={note.slug} className="rounded-xl border border-ink-800 bg-ink-900 p-4">
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
              {note.platform && (
                <span className="rounded bg-ink-800 px-1.5 py-0.5 text-ink-300">{note.platform}</span>
              )}
              {note.period && <span>{note.period}</span>}
              {note.created && <span>{note.created}</span>}
            </div>
            <h3 className="mt-1.5 text-base font-semibold text-white">{note.title}</h3>
            {!open && <p className="mt-1.5 text-sm text-ink-300">{note.excerpt}</p>}
            {open && (
              <div className="mt-3 border-t border-ink-800 pt-3">
                <Markdown text={note.content} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setExpanded(open ? null : note.slug)}
              className="mt-2 text-xs text-accent underline underline-offset-2 hover:text-accent-dim"
            >
              {open ? "收起" : "展开全文"}
            </button>
          </article>
        );
      })}
    </div>
  );
}
