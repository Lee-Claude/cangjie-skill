"use client";

import { useMemo, useState } from "react";
import type { VaultResponse } from "@/lib/vault/types";

type NoteSummary = VaultResponse["notes"][number];

export function NoteList({
  notes,
  selected,
  onSelect,
}: {
  notes: NoteSummary[];
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  const [keyword, setKeyword] = useState("");

  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const n of notes) for (const t of n.tags) set.add(t);
    return [...set].sort();
  }, [notes]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const visible = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return notes.filter((n) => {
      if (activeTag && !n.tags.includes(activeTag)) return false;
      if (!kw) return true;
      return n.title.toLowerCase().includes(kw) || n.excerpt.toLowerCase().includes(kw);
    });
  }, [notes, keyword, activeTag]);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-2 border-b border-ink-800 p-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜笔记标题或摘要"
          className="w-full rounded-lg border border-ink-800 bg-ink-900 px-3 py-1.5 text-xs text-ink-100 outline-none placeholder:text-ink-500 focus:border-ink-700"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <TagChip label="全部" active={activeTag === null} onClick={() => setActiveTag(null)} />
            {tags.map((t) => (
              <TagChip key={t} label={t} active={activeTag === t} onClick={() => setActiveTag(t)} />
            ))}
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {visible.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-ink-500">没有匹配的笔记</p>
        )}
        {visible.map((n) => (
          <button
            key={n.slug}
            type="button"
            onClick={() => onSelect(n.slug)}
            className={`block w-full rounded-lg border p-2.5 text-left transition ${
              selected === n.slug
                ? "border-accent/60 bg-accent/5"
                : "border-transparent hover:border-ink-800 hover:bg-ink-900"
            }`}
          >
            <div className="text-sm font-medium text-ink-100">{n.title}</div>
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-500">{n.excerpt}</p>
            <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-ink-500">
              {n.created && <span>{n.created}</span>}
              {n.tags.slice(0, 3).map((t) => (
                <span key={t} className="rounded bg-ink-800 px-1.5 py-0.5">
                  {t}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function TagChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
        active
          ? "border-accent/60 bg-accent/10 text-accent"
          : "border-ink-800 text-ink-500 hover:border-ink-700 hover:text-ink-300"
      }`}
    >
      {label}
    </button>
  );
}
