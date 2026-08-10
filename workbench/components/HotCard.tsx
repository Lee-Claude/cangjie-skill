"use client";

import type { HotItem } from "@/lib/types";

function relativeTime(iso?: string): string | null {
  if (!iso) return null;
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return null;
  const minutes = Math.round((Date.now() - ts) / 60_000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return `${Math.round(hours / 24)} 天前`;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-hot";
  if (score >= 50) return "text-amber-400";
  return "text-ink-500";
}

export function HotCard({
  item,
  selected,
  onToggle,
}: {
  item: HotItem;
  selected: boolean;
  onToggle: (item: HotItem) => void;
}) {
  const time = relativeTime(item.publishedAt);

  return (
    <article
      className={`group rounded-xl border p-3 transition ${
        selected
          ? "border-accent/60 bg-accent/5"
          : "border-ink-800 bg-ink-900 hover:border-ink-700"
      }`}
    >
      <div className="flex items-start gap-3">
        <label className="mt-0.5 flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggle(item)}
            className="size-4 cursor-pointer accent-emerald-400"
            aria-label={`选中「${item.title}」投喂给 AI`}
          />
        </label>

        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="block text-sm font-medium leading-snug text-ink-100 hover:text-accent"
          >
            {item.title}
          </a>

          {item.summary && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-500">
              {item.summary}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <span className="rounded bg-ink-800 px-1.5 py-0.5 text-ink-300">
              {item.sourceLabel}
            </span>
            <span className={`font-medium tabular-nums ${scoreColor(item.score)}`}>
              热度 {item.score}
            </span>
            {item.rawScoreLabel && <span>{item.rawScoreLabel}</span>}
            {time && <span>{time}</span>}
          </div>
        </div>
      </div>
    </article>
  );
}
