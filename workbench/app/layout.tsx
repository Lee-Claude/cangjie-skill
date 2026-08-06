import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 工作台 · 热点 + 创作",
  description: "实时 AI 热点聚合，配一个能流式对话的 AI 创作助手。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
