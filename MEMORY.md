# MEMORY.md

> 项目记忆入口。按「唯一真源 + 指针，禁止复述」的原则写：这个文件不重复内容，只指路到真正记录的地方。
> 建于 2026-08-28，起因：跟用户本机常驻 Claude Code 实例做合并前的相互了解，对方约定项目记忆放在各项目根目录的 `MEMORY.md`。

## 这是什么项目

个人 AI 赛道工作台：`workbench/`（Next.js 15 + TypeScript + Tailwind v4，热点聚合 + 流式创作 + 知识星图 + 社媒模块）+ 同步进 Obsidian 库的笔记（`obsidian/`）。

- 项目入口 / 笔记索引：[obsidian/AI 工作台.md](obsidian/AI%20工作台.md)
- 仓库约定（Obsidian 笔记规则、协作方式、开发流程）：[CLAUDE.md](CLAUDE.md)

## 架构决策 & 踩过的坑 —— 都在 `obsidian/` 下，这里只列指针

| 主题 | 记在哪 |
|---|---|
| Obsidian 同步整体方案，为什么选 sparse checkout + launchd | [obsidian/同步方案.md](obsidian/同步方案.md) |
| 同步踩过的坑：iCloud 把 `.git` 抽成占位符导致仓库损坏、sparse checkout 多一层嵌套、clone 忘记带 `-b`、macOS 自带 bash 3.2 遇中文全角标点会炸 | 同上，「坑」与「macOS 实测记录」两节 |
| 检出目录该放哪、TCC 权限限制、"整体迁移"计划 vs 实际部署（软链桥接，库从未搬动） | [obsidian/库放在哪.md](obsidian/库放在哪.md) |
| Claudian 插件 `authentication_failed` 排障（真实原因是 CLI 路径缺一截，跟同时加的 API key 只是时间巧合） | [obsidian/Claudian 认证踩坑.md](obsidian/Claudian%20认证踩坑.md) |
| 功能验证到什么程度、哪些只写了没跑过 | [obsidian/验证记录.md](obsidian/验证记录.md) |

## 运维备注

- 笔记同步：本机 launchd 每 15 分钟 `git -C ~/AI工作台 pull --rebase --autostash`；真实 Obsidian 库在 `~/Documents/Obsidian`，从未搬动，靠 `~/Documents/Obsidian/AI工作台` 软链接桥接到检出目录。
- 这个仓库的 Claude Code 会话是云端 / bridge 会话，不持有本机文件系统权限——只能通过 push 到这个仓库、再等 15 分钟同步窗口，间接触达本机 Obsidian 库，没有实时读写通道。

## 与本机常驻实例的关系

2026-08-28，用户从本机常驻 Claude Code 实例（95 skills、3 个 subagent、四层规则体系、独立的 AI-Memory/项目 MEMORY.md/会话记忆三层记忆系统）取得一份脱敏对接说明，评估是否合并。

**结论：不整体合并。** 对方文档自己也建议先只读互通、跑一两周确认不打架，再谈写入，别一次性双向合并。当前状态：只读互通已经通过 Obsidian 库的软链桥接天然成立（本机实例能读到这个仓库同步过去的笔记）；写入权归谁、规则冲突裁决顺序、skill/agent 命名空间、闸门归谁判——这四件事对方文档列为"合并前必须先谈"，但这边（这个仓库绑定的会话）没有对应的技能库/子 agent/规则分层去谈判，真正能拍板的只有用户本人。这份 `MEMORY.md` 本身就是双方约定的第一个技术接口点：本机实例的"图书管理员"开工前扫记忆库时，能在这里认出这个项目、找到指针，不需要重新介绍。
