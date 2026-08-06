"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { HotFeedResponse } from "@/lib/types";

const AUTO_REFRESH_MS = 5 * 60 * 1000;

export function useHotFeed() {
  const [feed, setFeed] = useState<HotFeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  const load = useCallback(async (force = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/hot${force ? "?refresh=1" : ""}`);
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(detail.error ?? `HTTP ${res.status}`);
      }
      setFeed((await res.json()) as HotFeedResponse);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(true), AUTO_REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return { feed, loading, error, refresh: () => load(true) };
}
