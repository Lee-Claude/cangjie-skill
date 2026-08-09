"use client";

import { useMemo, useState } from "react";
import type { VaultGraph } from "@/lib/vault/types";

const SIZE = 1000;
const PADDING = 90;

export function Graph({
  graph,
  selected,
  onSelect,
}: {
  graph: VaultGraph;
  selected: string | null;
  onSelect: (slug: string) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const active = hovered ?? selected;

  const positioned = useMemo(
    () =>
      graph.nodes.map((n) => ({
        ...n,
        px: PADDING + n.x * (SIZE - PADDING * 2),
        py: PADDING + n.y * (SIZE - PADDING * 2),
      })),
    [graph.nodes],
  );
  const byId = useMemo(() => new Map(positioned.map((n) => [n.id, n])), [positioned]);

  const neighbors = useMemo(() => {
    if (!active) return null;
    const set = new Set<string>([active]);
    for (const edge of graph.edges) {
      if (edge.source === active) set.add(edge.target);
      if (edge.target === active) set.add(edge.source);
    }
    return set;
  }, [active, graph.edges]);

  const maxDegree = Math.max(1, ...positioned.map((n) => n.degree));
  const radius = (n: (typeof positioned)[number]) => 8 + (n.degree / maxDegree) * 14;

  if (positioned.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-500">
        知识库是空的，还没有笔记
      </div>
    );
  }

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-full w-full" role="img" aria-label="知识图谱">
      <g>
        {graph.edges.map((edge, i) => {
          const a = byId.get(edge.source);
          const b = byId.get(edge.target);
          if (!a || !b) return null;
          const dim = neighbors && !(neighbors.has(edge.source) && neighbors.has(edge.target));
          return (
            <line
              key={`${edge.source}-${edge.target}-${i}`}
              x1={a.px}
              y1={a.py}
              x2={b.px}
              y2={b.py}
              stroke={dim ? "#2a3142" : "#6ee7b7"}
              strokeOpacity={dim ? 0.35 : 0.6}
              strokeWidth={dim ? 1 : 1.5}
            />
          );
        })}
      </g>
      <g>
        {positioned.map((n) => {
          const dim = neighbors ? !neighbors.has(n.id) : false;
          const isActive = n.id === active;
          return (
            <g
              key={n.id}
              transform={`translate(${n.px}, ${n.py})`}
              className="cursor-pointer"
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelect(n.id)}
            >
              <circle
                r={radius(n)}
                fill={isActive ? "#6ee7b7" : "#1c2130"}
                stroke={isActive ? "#6ee7b7" : "#2a3142"}
                strokeWidth={2}
                opacity={dim ? 0.35 : 1}
              />
              <text
                y={radius(n) + 16}
                textAnchor="middle"
                fontSize={15}
                fill={isActive ? "#e6e9f2" : "#a8b0c4"}
                opacity={dim ? 0.35 : 1}
                className="select-none"
              >
                {n.title.length > 10 ? `${n.title.slice(0, 10)}…` : n.title}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
