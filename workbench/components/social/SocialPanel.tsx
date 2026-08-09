"use client";

import { useState } from "react";
import { DouyinDashboard } from "./DouyinDashboard";
import { InsightsFeed } from "./InsightsFeed";
import { WechatDashboard } from "./WechatDashboard";

type Tab = "insights" | "douyin" | "wechat";

const TABS: { key: Tab; label: string }[] = [
  { key: "insights", label: "社媒洞察" },
  { key: "douyin", label: "抖音数据" },
  { key: "wechat", label: "公众号" },
];

export function SocialPanel() {
  const [tab, setTab] = useState<Tab>("insights");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <nav className="flex shrink-0 gap-1 border-b border-ink-800 px-4 py-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              tab === t.key ? "bg-ink-800 text-white" : "text-ink-500 hover:text-ink-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === "insights" && <InsightsFeed />}
        {tab === "douyin" && <DouyinDashboard />}
        {tab === "wechat" && <WechatDashboard />}
      </div>
    </div>
  );
}
