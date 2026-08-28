---
title: AI 工作台
tags:
  - project
  - ai
  - 工作台
created: 2026-08-07
status: 可用
repo: https://github.com/Lee-Claude/cangjie-skill
---

# AI 工作台

个人 AI 赛道工作台。左边实时热点聚合，右边流式创作助手：**勾选热点 → 选创作模板 → 直接出稿**。

代码在仓库的 `workbench/` 目录，Next.js 15 + TypeScript + Tailwind v4。

## 三十秒跑起来

```bash
cd workbench && npm install
cp .env.example .env.local   # 填 ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

没有 API key 也能跑 —— 热点面板照常工作，只有对话会失败，页面顶部会提示。

## 笔记索引

- [[热点聚合]] —— 五个数据源怎么并成一张榜，热度分和时间衰减怎么算
- [[数据源 - AI hot]] —— 零配置接入的关键：它把数据写回自己仓库
- [[流式对话]] —— SSE 从 Messages API 一路推到前端逐字渲染
- [[创作模板]] —— 五个模板的写作要求，以及热点怎么进 system prompt
- [[环境变量]] —— 所有配置项速查
- [[验证记录]] —— 验到什么程度，哪部分没验到
- [[同步方案]] —— 这些笔记怎么自动同步进本机 Obsidian 库
- [[库放在哪]] —— 库为什么不能放 iCloud，以及怎么安全搬走
- [[知识星图]] —— 读本机 vault 画关系图，正文双链怎么做到可点击跳转
- [[社媒模块]] —— 社媒洞察 / 抖音数据 / 公众号，为什么不接官方 API
- [[Claudian 认证踩坑]] —— authentication_failed 报错跟加的 key 没关系，是插件里 CLI 路径缺了一截
- [[2026-08 知识库归档]] —— 每月首篇自包含备份，给以后数据迁移用

## 目录结构

```
app/api/hot      热点聚合接口（并行拉取 + 缓存）
app/api/chat     流式对话接口（SSE）
app/api/status   前端判断有没有配 key
lib/sources/     每个数据源一个文件
lib/llm/         provider 抽象：anthropic.ts + openai.ts
lib/prompt.ts    system prompt 和创作模板
hooks/           useHotFeed（轮询）、useChat（SSE 消费）
components/      HotFeed / ChatPanel / Markdown
```

## 待办

- [ ] 热点趋势图（需要先攒历史快照，目前只有当前值）
- [ ] 生成结果存档，最好能直接回流到这个 Obsidian 库
- [ ] 定时推送（每天早上把简报 + top 5 推到某个地方）
