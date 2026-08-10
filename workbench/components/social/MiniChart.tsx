"use client";

/**
 * 极简 SVG 折线图。没有引入图表库 —— 就画一条趋势线加几个点，
 * 犯不上为这个加 recharts/visx 之类的依赖，跟 vault 那边的力导向图一个思路。
 */
export function MiniChart({
  points,
  height = 64,
}: {
  points: { label: string; value: number }[];
  height?: number;
}) {
  if (points.length === 0) return null;

  const width = 100; // viewBox 百分比坐标，外层用容器宽度撑开
  const max = Math.max(...points.map((p) => p.value), 1);
  const min = Math.min(...points.map((p) => p.value), 0);
  const span = max - min || 1;
  const stepX = width / Math.max(points.length - 1, 1);

  const coords = points.map((p, i) => ({
    x: i * stepX,
    y: height - ((p.value - min) / span) * (height - 8) - 4,
  }));

  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(2)},${c.y.toFixed(2)}`).join(" ");
  const areaPath = `${path} L${coords[coords.length - 1].x.toFixed(2)},${height} L0,${height} Z`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-16 w-full">
        <path d={areaPath} fill="#6ee7b7" fillOpacity={0.08} stroke="none" />
        <path d={path} fill="none" stroke="#6ee7b7" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
        {coords.map((c, i) => (
          <circle key={i} cx={c.x} cy={c.y} r={1.6} fill="#6ee7b7" />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-ink-500">
        <span>{points[0].label}</span>
        <span>{points[points.length - 1].label}</span>
      </div>
    </div>
  );
}
