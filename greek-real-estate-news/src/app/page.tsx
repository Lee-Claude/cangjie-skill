import { getNews } from "@/lib/news";
import { formatRelativeTime } from "@/lib/format";
import { RefreshButton } from "@/components/RefreshButton";

export const revalidate = 300;

export default async function Home() {
  const { items, feedStatuses, fetchedAt } = await getNews();
  const now = Date.parse(fetchedAt);
  const okFeeds = feedStatuses.filter((f) => f.ok);
  const failedFeeds = feedStatuses.filter((f) => !f.ok);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:py-12">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">🇬🇷 希腊房地产快讯</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            Greek Real Estate News
          </h1>
          <p className="mt-2 text-sm text-black/60 dark:text-white/50">
            自动聚合 {okFeeds.length} 个希腊新闻源里的房地产相关报道，每 5 分钟更新一次。
          </p>
        </div>
        <RefreshButton />
      </header>

      {items.length === 0 ? (
        <div className="rounded-xl border border-black/10 bg-black/[0.02] p-6 text-sm text-black/60 dark:border-white/10 dark:bg-white/[0.03] dark:text-white/50">
          暂时没有抓到任何条目。看下面的“订阅源状态”，通常是某个 RSS 地址失效了——去对应网站确认真实链接，改
          <code className="mx-1 rounded bg-black/5 px-1 py-0.5 dark:bg-white/10">
            src/lib/feeds.ts
          </code>
          就行。
        </div>
      ) : (
        <ol className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.link}
              className="rounded-xl border border-black/10 p-4 transition hover:border-blue-900/30 hover:bg-blue-50/40 dark:border-white/10 dark:hover:border-blue-200/30 dark:hover:bg-blue-950/20"
            >
              <a href={item.link} target="_blank" rel="noreferrer" className="block">
                <div className="mb-1.5 flex flex-wrap items-center gap-2 text-xs text-black/50 dark:text-white/40">
                  <span className="rounded-full bg-blue-900/10 px-2 py-0.5 font-medium text-blue-900 dark:bg-blue-200/10 dark:text-blue-200">
                    {item.sourceName}
                  </span>
                  <span>{formatRelativeTime(item.publishedAt, now)}</span>
                </div>
                <h2 className="text-base font-medium leading-snug">{item.title}</h2>
                {item.snippet && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-black/60 dark:text-white/50">
                    {item.snippet}
                  </p>
                )}
              </a>
            </li>
          ))}
        </ol>
      )}

      <footer className="mt-10 border-t border-black/10 pt-4 text-xs text-black/40 dark:border-white/10 dark:text-white/30">
        <p>订阅源状态（数据抓取于 {new Date(now).toLocaleString("zh-CN")}）：</p>
        <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
          {feedStatuses.map((f) => (
            <li key={f.sourceId}>
              {f.ok ? "✅" : "❌"} {f.sourceName}
              {f.ok ? ` (${f.itemCount} 条)` : ` — ${f.error}`}
            </li>
          ))}
        </ul>
        {failedFeeds.length > 0 && (
          <p className="mt-2">
            {failedFeeds.length} 个源没抓到数据，多半是 RSS 地址失效，去 `src/lib/feeds.ts`
            里改成真实地址即可。
          </p>
        )}
      </footer>
    </div>
  );
}
