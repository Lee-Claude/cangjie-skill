"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { HotFeed } from "./HotFeed";
import { useChat } from "@/hooks/useChat";
import { useHotFeed } from "@/hooks/useHotFeed";
import type { HotItem } from "@/lib/types";

type Status = {
  provider: "anthropic" | "openai" | null;
  model: string | null;
  aiHotConnected: boolean;
};

export function Workbench() {
  const { feed, loading, error, refresh } = useHotFeed();
  const { messages, streaming, send, stop, reset } = useChat();

  const [selected, setSelected] = useState<HotItem[]>([]);
  const [template, setTemplate] = useState("free");
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data: Status) => setStatus(data))
      .catch(() => setStatus(null));
  }, []);

  const toggle = useCallback((item: HotItem) => {
    setSelected((prev) =>
      prev.some((s) => s.id === item.id)
        ? prev.filter((s) => s.id !== item.id)
        : [...prev, item],
    );
  }, []);

  const selectedIds = new Set(selected.map((s) => s.id));

  const providerLabel = status?.model
    ? `${status.provider === "anthropic" ? "Claude" : "OpenAI 兼容"} · ${status.model}`
    : null;

  return (
    <main className="flex h-screen flex-col">
      {status && !status.provider && <MissingKeyBanner />}

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <HotFeed
          feed={feed}
          loading={loading}
          error={error}
          onRefresh={refresh}
          selectedIds={selectedIds}
          onToggle={toggle}
          onClearSelection={() => setSelected([])}
        />
        <ChatPanel
          messages={messages}
          streaming={streaming}
          context={selected}
          template={template}
          onTemplateChange={setTemplate}
          onSend={(text) => void send(text, { context: selected, template })}
          onStop={stop}
          onReset={reset}
          onRemoveContext={toggle}
          providerLabel={providerLabel}
        />
      </div>
    </main>
  );
}

function MissingKeyBanner() {
  return (
    <div className="shrink-0 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
      还没配置模型 API key —— 热点面板照常工作，但对话会失败。在{" "}
      <code className="rounded bg-ink-900 px-1 py-0.5">workbench/.env.local</code> 里设置{" "}
      <code className="rounded bg-ink-900 px-1 py-0.5">ANTHROPIC_API_KEY</code>{" "}
      后重启开发服务器。
    </div>
  );
}
