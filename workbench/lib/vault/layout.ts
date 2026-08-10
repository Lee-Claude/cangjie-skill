import type { GraphEdge, GraphNode, VaultNote } from "./types";

/**
 * 简化版 Fruchterman-Reingold 力导向布局，服务端算好坐标一次性返回。
 * 没有引入 d3-force —— 笔记数量级是几十到几百篇，这几十行手写实现够用，
 * 跟 components/Markdown.tsx 一样是"没必要为这点活儿加依赖"的思路。
 *
 * 返回坐标归一化到 [0, 1]，前端按容器尺寸自己缩放，不用关心具体像素。
 */
export function layoutGraph(notes: VaultNote[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const n = notes.length;
  if (n === 0) return { nodes: [], edges: [] };

  const degree = new Map<string, number>();
  const edges: GraphEdge[] = [];
  for (const note of notes) {
    for (const target of note.links) {
      edges.push({ source: note.slug, target });
      degree.set(note.slug, (degree.get(note.slug) ?? 0) + 1);
      degree.set(target, (degree.get(target) ?? 0) + 1);
    }
  }

  // 确定性伪随机初始布局（圆形撒点 + 小扰动），而不是 Math.random() ——
  // 同样的 vault 每次请求应该给出同样的图，不然节点在前端每次刷新都跳来跳去。
  const positions = new Map<string, { x: number; y: number }>();
  notes.forEach((note, i) => {
    const angle = (2 * Math.PI * i) / n;
    const jitter = seededJitter(note.slug);
    positions.set(note.slug, {
      x: Math.cos(angle) * (0.35 + jitter * 0.1),
      y: Math.sin(angle) * (0.35 + jitter * 0.1),
    });
  });

  const AREA = 1; // 工作坐标系边长，最后再归一化到 [0,1]
  const k = Math.sqrt((AREA * AREA) / Math.max(n, 1)); // 理想节点间距
  const ITERATIONS = 250;

  for (let iter = 0; iter < ITERATIONS; iter++) {
    const displacement = new Map<string, { x: number; y: number }>();
    for (const note of notes) displacement.set(note.slug, { x: 0, y: 0 });

    // 斥力：所有节点两两互斥，反比于距离
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const a = notes[i].slug;
        const b = notes[j].slug;
        const pa = positions.get(a)!;
        const pb = positions.get(b)!;
        let dx = pa.x - pb.x;
        let dy = pa.y - pb.y;
        let dist = Math.hypot(dx, dy) || 0.0001;
        const force = (k * k) / dist;
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        const da = displacement.get(a)!;
        const db = displacement.get(b)!;
        da.x += dx;
        da.y += dy;
        db.x -= dx;
        db.y -= dy;
      }
    }

    // 引力：相连节点互相吸引，正比于距离
    for (const edge of edges) {
      const pa = positions.get(edge.source);
      const pb = positions.get(edge.target);
      if (!pa || !pb) continue;
      const dx = pa.x - pb.x;
      const dy = pa.y - pb.y;
      const dist = Math.hypot(dx, dy) || 0.0001;
      const force = (dist * dist) / k;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      displacement.get(edge.source)!.x -= fx;
      displacement.get(edge.source)!.y -= fy;
      displacement.get(edge.target)!.x += fx;
      displacement.get(edge.target)!.y += fy;
    }

    // 降温：位移幅度随迭代衰减，让布局逐渐收敛而不是持续震荡
    const temperature = (0.1 * (ITERATIONS - iter)) / ITERATIONS;
    for (const note of notes) {
      const disp = displacement.get(note.slug)!;
      const dist = Math.hypot(disp.x, disp.y) || 0.0001;
      const pos = positions.get(note.slug)!;
      pos.x += (disp.x / dist) * Math.min(dist, temperature);
      pos.y += (disp.y / dist) * Math.min(dist, temperature);
      // 轻微向心力，防止孤立节点飘出视野
      pos.x *= 0.995;
      pos.y *= 0.995;
    }
  }

  const xs = [...positions.values()].map((p) => p.x);
  const ys = [...positions.values()].map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;

  const nodes: GraphNode[] = notes.map((note) => {
    const pos = positions.get(note.slug)!;
    return {
      id: note.slug,
      title: note.title,
      tags: note.tags,
      x: (pos.x - minX) / spanX,
      y: (pos.y - minY) / spanY,
      degree: degree.get(note.slug) ?? 0,
    };
  });

  return { nodes, edges };
}

/** 字符串 -> [-1, 1] 的确定性伪随机数，用于给初始布局撒一点不规则的扰动。 */
function seededJitter(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0;
  }
  return ((hash % 1000) / 1000) * 2 - 1;
}
