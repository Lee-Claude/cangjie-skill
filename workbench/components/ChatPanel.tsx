"use client";

import { useEffect, useRef, useState } from "react";
import { Markdown } from "./Markdown";
import { TEMPLATES } from "@/lib/prompt";
import type { ChatMessage, HotItem } from "@/lib/types";

export function ChatPanel({
  messages,
  streaming,
  context,
  template,
  onTemplateChange,
  onSend,
  onStop,
  onReset,
  onRemoveContext,
  providerLabel,
}: {
  messages: ChatMessage[];
  streaming: boolean;
  context: HotItem[];
  template: string;
  onTemplateChange: (key: string) => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onReset: () => void;
  onRemoveContext: (item: HotItem) => void;
  providerLabel: string | null;
}) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 新内容进来时贴着底部；用户手动往上滚时不要抢焦点
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = () => {
    if (!draft.trim() || streaming) return;
    onSend(draft);
    setDraft("");
  };

  const applyTemplate = (key: string) => {
    onTemplateChange(key);
    const found = TEMPLATES.find((t) => t.key === key);
    if (found?.starter && !draft.trim()) {
      setDraft(found.starter);
      textareaRef.current?.focus();
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col bg-ink-950">
      <header className="flex shrink-0 items-center justify-between border-b border-ink-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-wide">AI 创作</h2>
          <span className="text-[11px] text-ink-500">
            {providerLabel ?? "未配置模型"}
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={messages.length === 0}
          className="rounded-md border border-ink-700 px-2.5 py-1 text-xs text-ink-300 transition hover:border-ink-500 hover:text-ink-100 disabled:opacity-40"
        >
          新对话
        </button>
      </header>

      <div className="shrink-0 border-b border-ink-800 px-4 py-2">
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => applyTemplate(t.key)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition ${
                template === t.key
                  ? "border-accent/60 bg-accent/10 text-accent"
                  : "border-ink-800 text-ink-500 hover:border-ink-700 hover:text-ink-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <EmptyState hasContext={context.length > 0} />
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-ink-800 px-4 py-3">
        {context.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {context.map((item) => (
              <span
                key={item.id}
                className="flex max-w-[240px] items-center gap-1.5 rounded-full border border-accent/40 bg-accent/5 px-2 py-0.5 text-[11px] text-accent"
              >
                <span className="truncate">{item.title}</span>
                <button
                  type="button"
                  onClick={() => onRemoveContext(item)}
                  className="shrink-0 text-accent/60 hover:text-accent"
                  aria-label={`移除「${item.title}」`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="rounded-xl border border-ink-800 bg-ink-900 focus-within:border-ink-700">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // Enter 发送，Shift+Enter 换行
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            rows={3}
            placeholder="左边勾选热点，然后说你要什么 —— Enter 发送，Shift+Enter 换行"
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-ink-100 outline-none placeholder:text-ink-500"
          />
          <div className="flex items-center justify-between px-3 pb-2">
            <span className="text-[11px] text-ink-500">
              {context.length > 0 ? `将带上 ${context.length} 条热点` : "未选中热点"}
            </span>
            {streaming ? (
              <button
                type="button"
                onClick={onStop}
                className="rounded-lg border border-hot/50 px-3 py-1 text-xs text-hot transition hover:bg-hot/10"
              >
                停止
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={!draft.trim()}
                className="rounded-lg bg-accent px-3.5 py-1 text-xs font-medium text-ink-950 transition hover:bg-accent-dim disabled:opacity-30"
              >
                发送
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-ink-800 px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-wider text-ink-500">
        AI
      </div>
      {message.content ? (
        <div className={message.streaming ? "streaming-caret" : undefined}>
          <Markdown text={message.content} />
        </div>
      ) : (
        message.streaming && (
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="size-1.5 rounded-full bg-ink-500 animate-pulse-dot"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )
      )}
      {message.error && (
        <p className="rounded-lg border border-hot/40 bg-hot/10 px-3 py-2 text-xs text-hot">
          {message.error}
        </p>
      )}
    </div>
  );
}

function EmptyState({ hasContext }: { hasContext: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-ink-300">
        {hasContext ? "热点已就位，说说你想写什么" : "先在左边勾几条热点"}
      </p>
      <p className="max-w-xs text-xs leading-relaxed text-ink-500">
        勾选的条目会连同标题、来源、摘要一起进入上下文。选一个上面的创作模板可以直接
        套用对应的写作要求。
      </p>
    </div>
  );
}
