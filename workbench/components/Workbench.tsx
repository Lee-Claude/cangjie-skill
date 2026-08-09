"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "./ChatPanel";
import { HotFeed } from "./HotFeed";
import { VaultPanel } from "./vault/VaultPanel";
import { useChat } from "@/hooks/useChat";
import { useHotFeed } from "@/hooks/useHotFeed";
import type { HotItem } from "@/lib/types";

type View = "workbench" | "vault";

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
  const [view, setView] = useState<View>("workbench");

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

      <nav className="flex shrink-0 items-center gap-1 border-b border-ink-800 bg-ink-950 px-4 py-2">
        <ViewTab label="工作台" active={view === "workbench"} onClick={() => setView("workbench")} />
        <ViewTab label="知识星图" active={view === "vault"} onClick={() => setView("vault")} />
      </nav>

      {view === "workbench" ? (
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
      ) : (
        <div className="min-h-0 flex-1">
          <VaultPanel />
        </div>
      )}
    </main>
  );
}

function ViewTab({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
        active ? "bg-ink-800 text-white" : "text-ink-500 hover:text-ink-300"
      }`}
    >
      {label}
    </button>
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
