---
title: 数据源 - AI hot
tags:
  - ai
  - 数据源
  - 开源项目
created: 2026-08-07
parent: "[[热点聚合]]"
source: https://github.com/laolaoshiren/ai-hot
site: https://aihot.bt199.com/
---

# 数据源 - AI hot

[[热点聚合]] 里的中文热榜来源。项目是 [laolaoshiren/ai-hot](https://github.com/laolaoshiren/ai-hot)，定位是"面向中文用户的 AI 工具、模型、Agent、新闻导航站"，每 6 小时更新。

## 关键发现：不用部署它

README 里只写了网站入口，没提 API，第一眼看上去像是要自己部署后端才能用。

**但它把榜单数据 commit 回自己仓库的 `data/` 目录。** 所以直接读 raw.githubusercontent 上的 JSON 就行 —— 零配置，`npm run dev` 起来就有热榜。

```
https://raw.githubusercontent.com/laolaoshiren/ai-hot/main/data/hot.json
```

这是整个接入里最省事的一点，值得记一笔：**遇到"没有 API"的数据项目，先看它的仓库里有没有生成好的数据文件**，很多静态站项目都是这个模式。

## 仓库里有什么

`data/` 下 18 个 JSON，实测过的：

| 文件 | 大小 | 内容 | 用了吗 |
| --- | --- | --- | --- |
| `hot.json` | 37 KB | 热榜条目，带 score / 来源 / AI 摘要 / 分类 | ✅ 主数据 |
| `briefing.json` | 544 B | 每日 AI 简报，一段话总结当天主线 | ✅ 顶部卡片 |
| `trending.json` | 49 KB | 100 个仓库排名 + star 增速 | ❌ 见下 |
| `rising.json` | 866 B | 近期值得看的开源项目 | ❌ 只有 2 条且重叠 |
| `news.json` | **20 MB** | 全量新闻存档 | ❌ 每次请求拉太重 |
| `projects/models/tools.json` | 95–310 KB | 导航站的工具/模型目录 | ❌ 是目录不是热点 |

**为什么没接 `trending.json`**：里面 100 个仓库的 `velocity_per_day` 目前全是 0，`top_risers` 是空数组 —— star 增速追踪还没产出差值。接进来等于每天往榜单里灌 TensorFlow、PyTorch 这些常青仓库，是噪音不是信号。哪天它的增速数据跑起来了，这个源值得再看一眼。

## 数据结构

`hot.json` 顶层：

```json
{
  "updated_at": "2026-08-06T13:49:04",
  "total": 10,
  "hot_list": [...],   // 三个键指向同一批数据
  "top_20":   [...],
  "items":    [...]
}
```

单条（字段照抄真实数据）：

```json
{
  "title": "Spotify 前员工筹集 1000 万美元…",
  "title_zh": "…",
  "url": "https://techcrunch.com/...",      // 外链，创作者要看的
  "internal_url": "https://aihot.bt199.com/news/b98407de0bce/",
  "type": "news",                            // news | tool | project | model
  "type_label": "📰 新闻",
  "category": "资讯",
  "source": "TechCrunch AI",
  "score": 15,                               // 小整数，实测 6–15，不是百分制
  "time": "2026-08-06",
  "ai_summary": "…"
}
```

几个容易踩的点：

- **`score` 是个位数到十几**，不是 0–100。归一化饱和点设 30。
- **优先用 `url` 而不是 `internal_url`** —— 创作者要的是原始报道，不是导航站的跳转页。
- `hot_list` / `items` / `top_20` 是同一批数据的三个别名，代码里三个都认，取到哪个用哪个。

## 每日简报

`briefing.json` 是意外收获，AI 生成的当天主线总结：

```json
{
  "date": "2026-08-06",
  "content": "今天 AI 的主线已经很清楚：行业竞争正在从「模型更强」转向「谁更能真正落地」……",
  "news_count": 20,
  "sources": { "TechCrunch AI": 7, "The Verge AI": 4, "量子位": 2 },
  "emoji": "⚡"
}
```

渲染成榜单顶部一张卡片，可展开收起，底部显示来源分布。拉不到就返回 null，不影响榜单本身 —— 它是锦上添花，不该拖累主数据。

## 配置

默认全自动，不用配。只有换 fork / 镜像 / 关掉才需要：

```bash
AIHOT_REPO=你的用户名/ai-hot
AIHOT_BRANCH=main
AIHOT_BASE_URL=https://example.com/data   # 直接指定放 JSON 的目录
AIHOT_ENABLED=false
```

代码在 `lib/sources/aihot.ts`。

## 踩过的坑

第一版是在**不知道 schema 的情况下**写的宽松适配器，把 `title/name/headline`、`score/heat/hot/points/stars` 一堆可能的字段名全试一遍。后来拿到真实数据，直接按实际结构重写了 —— **能拿到真数据就别猜字段名**，猜出来的兼容层既冗余又容易在边界上出错。
