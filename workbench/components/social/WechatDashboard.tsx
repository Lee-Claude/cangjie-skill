"use client";

import { useWechat } from "@/hooks/useSocial";

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

export function WechatDashboard() {
  const { data: payload, loading, error } = useWechat();

  if (loading) return <p className="p-6 text-sm text-ink-500">加载中…</p>;
  if (error) {
    return (
      <p className="m-4 rounded-lg border border-hot/40 bg-hot/10 px-3 py-2 text-xs text-hot">{error}</p>
    );
  }

  const data = payload?.data;
  if (!data) {
    return (
      <div className="p-6 text-sm text-ink-500">
        <p>还没有公众号数据。</p>
        <p className="mt-2 text-xs">
          微信公众平台的图文分析接口大多只对认证服务号开放，订阅号通常拿不到阅读数。先按{" "}
          <code className="rounded bg-ink-800 px-1 py-0.5">data/social/wechat.json</code> 的格式手动写一份，
          设 <code className="rounded bg-ink-800 px-1 py-0.5">WECHAT_DATA_PATH</code> 指向别的路径也行。
        </p>
      </div>
    );
  }

  const sorted = [...data.articles].sort((a, b) => b.reads - a.reads);

  return (
    <div className="space-y-4 p-4">
      {data.demoMode && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
          这是仓库自带的示例数据（demoMode），不是你的真实账号。替换{" "}
          <code className="rounded bg-ink-900 px-1 py-0.5">data/social/wechat.json</code> 换成真实数据。
        </p>
      )}

      <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
        <div className="text-sm font-medium text-white">{data.account.name}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-semibold text-white">{formatNumber(data.account.followers)}</span>
          <span className="text-[11px] text-ink-500">
            关注者 <span className="text-accent">+{data.account.followersChange7d}</span> / 7 天
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
          文章（按阅读量排序）
        </div>
        <div className="mt-2 divide-y divide-ink-800">
          {sorted.map((a, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <div className="truncate text-ink-100">{a.title}</div>
                <div className="text-[11px] text-ink-500">{a.publishedAt}</div>
              </div>
              <div className="shrink-0 text-right text-xs text-ink-500">
                <div className="text-ink-300">{formatNumber(a.reads)} 阅读</div>
                <div>
                  {a.likes} 赞 · {a.shares} 转发
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
