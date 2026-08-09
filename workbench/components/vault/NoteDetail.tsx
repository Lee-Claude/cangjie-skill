"use client";

import { useEffect, useState } from "react";
import { Markdown } from "@/components/Markdown";
import type { VaultNoteDetail } from "@/lib/vault/types";

export function NoteDetail({
  slug,
  onNavigate,
}: {
  slug: string | null;
  onNavigate: (slug: string) => void;
}) {
  const [note, setNote] = useState<VaultNoteDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) {
      setNote(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/vault/${encodeURIComponent(slug)}`)
      .then(async (res) => {
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<VaultNoteDetail>;
      })
      .then((data) => {
        if (!cancelled) setNote(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!slug) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-ink-500">
        点一个节点或列表项看笔记内容
      </div>
    );
  }

  if (loading && !note) {
    return <div className="p-6 text-sm text-ink-500">加载中…</div>;
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="rounded-lg border border-hot/40 bg-hot/10 px-3 py-2 text-xs text-hot">{error}</p>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="h-full overflow-y-auto p-6">
      <h1 className="text-xl font-semibold text-white">{note.title}</h1>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-500">
        {note.created && <span>{note.created}</span>}
        {note.tags.map((t) => (
          <span key={t} className="rounded bg-ink-800 px-1.5 py-0.5 text-ink-300">
            {t}
          </span>
        ))}
        <span>{note.wordCount} 字</span>
      </div>

      <div className="mt-5">
        <Markdown
          text={note.content}
          resolveWikilink={(target) => note.linkResolution[target]}
          onWikilinkClick={onNavigate}
        />
      </div>

      {note.links.length > 0 && (
        <RelatedSection title="链接到" items={note.links} onNavigate={onNavigate} />
      )}
      {note.backlinks.length > 0 && (
        <RelatedSection
          title="被引用"
          items={note.backlinks.map((b) => b.slug)}
          labels={Object.fromEntries(note.backlinks.map((b) => [b.slug, b.title]))}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}

function RelatedSection({
  title,
  items,
  labels,
  onNavigate,
}: {
  title: string;
  items: string[];
  labels?: Record<string, string>;
  onNavigate: (slug: string) => void;
}) {
  return (
    <div className="mt-6 border-t border-ink-800 pt-4">
      <h2 className="text-xs font-medium uppercase tracking-wide text-ink-500">{title}</h2>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {items.map((slug) => (
          <button
            key={slug}
            type="button"
            onClick={() => onNavigate(slug)}
            className="rounded-full border border-ink-800 px-2.5 py-1 text-xs text-ink-300 transition hover:border-accent/60 hover:text-accent"
          >
            {labels?.[slug] ?? slug}
          </button>
        ))}
      </div>
    </div>
  );
}
