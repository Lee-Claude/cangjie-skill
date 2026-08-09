"use client";

import { useCallback, useEffect, useState } from "react";
import type { VaultResponse } from "@/lib/vault/types";

export function useVault() {
  const [data, setData] = useState<VaultResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vault");
      if (!res.ok) {
        const detail = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(detail.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as VaultResponse);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "加载知识库失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
