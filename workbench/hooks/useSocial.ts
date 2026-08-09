"use client";

import { useEffect, useState } from "react";
import type { DouyinData, InsightNote, WechatData } from "@/lib/social/types";

function useFetch<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(detail.error ?? `HTTP ${res.status}`);
        }
        return res.json() as Promise<T>;
      })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "加载失败");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, loading, error };
}

export function useInsights() {
  return useFetch<{ notes: InsightNote[]; root: string }>("/api/social/insights");
}

export function useDouyin() {
  return useFetch<{ data: DouyinData | null }>("/api/social/douyin");
}

export function useWechat() {
  return useFetch<{ data: WechatData | null }>("/api/social/wechat");
}
