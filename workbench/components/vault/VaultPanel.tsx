"use client";

import { useState } from "react";
import { Graph } from "./Graph";
import { NoteDetail } from "./NoteDetail";
import { NoteList } from "./NoteList";
import { useVault } from "@/hooks/useVault";

export function VaultPanel() {
  const { data, loading, error, refresh } = useVault();
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)_minmax(0,360px)]">
      <div className="min-h-0 border-r border-ink-800">
        {data && (
          <NoteList notes={data.notes} selected={selected} onSelect={setSelected} />
        )}
      </div>

      <div className="relative min-h-0 border-r border-ink-800 bg-ink-950">
        <div className="absolute left-3 top-3 z-10 flex items-center gap-2 text-[11px] text-ink-500">
          {data && (
            <span>
              {data.graph.nodes.length} 篇 · {data.graph.edges.length} 条链接
            </span>
          )}
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="rounded-md border border-ink-700 px-2 py-0.5 text-ink-300 transition hover:border-ink-500 hover:text-ink-100 disabled:opacity-40"
          >
            {loading ? "刷新中…" : "刷新"}
          </button>
        </div>

        {error && (
          <div className="flex h-full items-center justify-center px-6">
            <p className="rounded-lg border border-hot/40 bg-hot/10 px-3 py-2 text-center text-xs text-hot">
              {error}
              <br />
              确认 workbench 能读到 vault 目录（默认是仓库里的 ../obsidian）
            </p>
          </div>
        )}

        {!error && loading && !data && (
          <div className="flex h-full items-center justify-center text-sm text-ink-500">加载知识图谱…</div>
        )}

        {!error && data && (
          <Graph graph={data.graph} selected={selected} onSelect={setSelected} />
        )}
      </div>

      <div className="min-h-0">
        <NoteDetail slug={selected} onNavigate={setSelected} />
      </div>
    </div>
  );
}
