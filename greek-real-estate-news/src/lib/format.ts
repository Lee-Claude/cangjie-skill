export function formatRelativeTime(iso: string | null, now: number): string {
  if (!iso) return "时间未知";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "时间未知";

  const diffMs = now - then;
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return "刚刚";
  if (diffMin < 60) return `${diffMin} 分钟前`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} 小时前`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay} 天前`;

  return new Date(then).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
