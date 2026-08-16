"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { refreshNews } from "@/app/actions";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await refreshNews();
      router.refresh();
    });
  }

  const busy = isPending;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-1.5 rounded-full border border-blue-900/20 bg-white px-3.5 py-1.5 text-sm font-medium text-blue-900 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-blue-200/20 dark:bg-slate-900 dark:text-blue-200 dark:hover:bg-slate-800"
    >
      <span className={busy ? "animate-spin" : ""}>⟳</span>
      {busy ? "刷新中…" : "刷新"}
    </button>
  );
}
