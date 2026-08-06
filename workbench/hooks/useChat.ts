"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, ChatStreamEvent, HotItem } from "@/lib/types";

let seq = 0;
const nextId = () => `m${++seq}-${Date.now().toString(36)}`;

export type SendOptions = {
  context?: HotItem[];
  template?: string;
};

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reset = useCallback(() => {
    stop();
    setMessages([]);
  }, [stop]);

  const send = useCallback(
    async (text: string, options: SendOptions = {}) => {
      const content = text.trim();
      if (!content || streaming) return;

      const userMessage: ChatMessage = { id: nextId(), role: "user", content };
      const assistantId = nextId();

      // 先把用户消息和一个空的助手气泡放进去，后续往里追加 delta
      const history = [...messages, userMessage];
      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", streaming: true },
      ]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const patchAssistant = (patch: Partial<ChatMessage>) => {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, ...patch } : m)),
        );
      };

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            messages: history.map((m) => ({ role: m.role, content: m.content })),
            context: options.context,
            template: options.template,
          }),
        });

        // 出错时服务端返回的是 JSON，不是 SSE
        if (!res.ok || !res.body) {
          const detail = (await res.json().catch(() => ({}))) as { error?: string };
          patchAssistant({
            streaming: false,
            error: detail.error ?? `请求失败（HTTP ${res.status}）`,
          });
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let acc = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";

          for (const chunk of events) {
            const line = chunk.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;
            let event: ChatStreamEvent;
            try {
              event = JSON.parse(line.slice(5).trim()) as ChatStreamEvent;
            } catch {
              continue;
            }
            if (event.type === "delta") {
              acc += event.text;
              patchAssistant({ content: acc });
            } else if (event.type === "error") {
              patchAssistant({ error: event.message });
            }
          }
        }

        patchAssistant({ streaming: false });
      } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError";
        patchAssistant({
          streaming: false,
          error: aborted ? undefined : err instanceof Error ? err.message : "网络错误",
        });
      } finally {
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  return { messages, streaming, send, stop, reset };
}
