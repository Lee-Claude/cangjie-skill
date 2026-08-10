"use client";

import { MiniChart } from "./MiniChart";
import { useDouyin } from "@/hooks/useSocial";

function formatNumber(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return n.toLocaleString("zh-CN");
}

export function DouyinDashboard() {
  const { data: payload, loading, error } = useDouyin();

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
        <p>还没有抖音数据。</p>
        <p className="mt-2 text-xs">
          抖音开放平台的创作者数据接口需要企业资质审核，个人短期内申请不下来。先按{" "}
          <code className="rounded bg-ink-800 px-1 py-0.5">data/social/douyin.json</code> 的格式手动写一份
          （或者以后接一个同步脚本自动生成），设 <code className="rounded bg-ink-800 px-1 py-0.5">DOUYIN_DATA_PATH</code>{" "}
          指向别的路径也行。
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {data.demoMode && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-[11px] text-amber-300">
          这是仓库自带的示例数据（demoMode），不是你的真实账号。替换{" "}
          <code className="rounded bg-ink-900 px-1 py-0.5">data/social/douyin.json</code> 换成真实数据。
        </p>
      )}

      <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
        <div className="text-sm font-medium text-white">{data.account.nickname}</div>
        <div className="mt-3 grid grid-cols-3 gap-3 text-center">
          <Stat label="粉丝数" value={formatNumber(data.account.followers)} delta={data.account.followersChange7d} />
          <Stat label="总获赞" value={formatNumber(data.account.totalLikes)} />
          <Stat label="总播放" value={formatNumber(data.account.totalPlays)} />
        </div>
      </div>

      <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-500">近 7 天播放趋势</div>
        <div className="mt-2">
          <MiniChart points={data.trend.map((t) => ({ label: t.date.slice(5), value: t.plays }))} />
        </div>
      </div>

      <div className="rounded-xl border border-ink-800 bg-ink-900 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-500">热门作品</div>
        <div className="mt-2 space-y-2">
          {data.topVideos.map((v, i) => (
            <div key={i} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink-100">{v.title}</span>
              <span className="shrink-0 text-xs text-ink-500">
                {formatNumber(v.plays)} 播放 · {formatNumber(v.likes)} 赞
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div>
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-[11px] text-ink-500">
        {label}
        {delta !== undefined && <span className="ml-1 text-accent">+{delta}</span>}
      </div>
    </div>
  );
}
