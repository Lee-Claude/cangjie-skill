"use client";

import { useMemo, useState } from "react";
import { HotCard } from "./HotCard";
import type { HotFeedResponse, HotItem } from "@/lib/types";

export function HotFeed({
  feed,
  loading,
  error,
  onRefresh,
  selectedIds,
  onToggle,
  onClearSelection,
}: {
  feed: HotFeedResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  selectedIds: Set<string>;
  onToggle: (item: HotItem) => void;
  onClearSelection: () => void;
}) {
  const [activeSource, setActiveSource] = useState<string>("all");
  const [keyword, setKeyword] = useState("");

  const visible = useMemo(() => {
    if (!feed) return [];
    const kw = keyword.trim().toLowerCase();
    return feed.items.filter((item) => {
      if (activeSource !== "all" && item.source !== activeSource) return false;
      if (!kw) return true;
      return (
        item.title.toLowerCase().includes(kw) ||
        (item.summary?.toLowerCase().includes(kw) ?? false)
      );
    });
  }, [feed, activeSource, keyword]);

  const failedSources = feed?.sources.filter((s) => s.error) ?? [];

  return (
    <section className="flex h-full min-h-0 flex-col border-r border-ink-800 bg-ink-950">
      <header className="shrink-0 border-b border-ink-800 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent animate-pulse-dot" />
            <h2 className="text-sm font-semibold tracking-wide">实时热点</h2>
            {feed && (
              <span className="text-[11px] text-ink-500">
                {feed.items.length} 条 ·{" "}
                {new Date(feed.fetchedAt).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {feed.cached && " (缓存)"}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="rounded-md border border-ink-700 px-2.5 py-1 text-xs text-ink-300 transition hover:border-ink-500 hover:text-ink-100 disabled:opacity-40"
          >
            {loading ? "刷新中…" : "刷新"}
          </button>
        </div>

        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="过滤关键词，比如 agent / 开源 / 融资"
          className="mt-3 w-full rounded-lg border border-ink-800 bg-ink-900 px-3 py-1.5 text-xs text-ink-100 outline-none placeholder:text-ink-500 focus:border-ink-700"
        />

        {feed && feed.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            <SourceChip
              label="全部"
              count={feed.items.length}
              active={activeSource === "all"}
              onClick={() => setActiveSource("all")}
            />
            {feed.sources.map((s) => (
              <SourceChip
                key={s.source}
                label={s.sourceLabel}
                count={s.count}
                failed={Boolean(s.error)}
                active={activeSource === s.source}
                onClick={() => setActiveSource(s.source)}
              />
            ))}
          </div>
        )}

        {selectedIds.size > 0 && (
          <div className="mt-2 flex items-center justify-between rounded-lg bg-accent/10 px-2.5 py-1.5 text-[11px] text-accent">
            <span>已选中 {selectedIds.size} 条，会作为上下文发给 AI</span>
            <button
              type="button"
              onClick={onClearSelection}
              className="underline underline-offset-2 hover:text-accent-dim"
            >
              清空
            </button>
          </div>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {error && (
          <p className="rounded-lg border border-hot/40 bg-hot/10 px-3 py-2 text-xs text-hot">
            {error}
          </p>
        )}

        {failedSources.length > 0 && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
            以下数据源本次拉取失败，其余照常：
            {failedSources.map((s) => ` ${s.sourceLabel}(${s.error})`).join("；")}
          </p>
        )}

        {!feed && loading && <SkeletonList />}

        {feed && visible.length === 0 && !loading && (
          <p className="px-1 py-8 text-center text-xs text-ink-500">
            没有匹配的条目。换个关键词，或者点右上角刷新。
          </p>
        )}

        {visible.map((item) => (
          <HotCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onToggle={onToggle}
          />
        ))}
      </div>
    </section>
  );
}

function SourceChip({
  label,
  count,
  active,
  failed,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  failed?: boolean;
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
      <span className={`ml-1 tabular-nums ${failed ? "text-hot" : ""}`}>
        {failed ? "!" : count}
      </span>
    </button>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-ink-800 bg-ink-900 p-3">
          <div className="h-3.5 w-3/4 rounded bg-ink-800" />
          <div className="mt-2 h-3 w-full rounded bg-ink-850" />
          <div className="mt-1.5 h-3 w-1/3 rounded bg-ink-850" />
        </div>
      ))}
    </div>
  );
}
