---
title: Claudian 认证踩坑
tags:
  - obsidian
  - macos
  - 排障
created: 2026-08-10
parent: "[[AI 工作台]]"
---

# Claudian 认证踩坑

[Claudian](https://github.com/YishenTu/claudian)（Obsidian 里嵌 Claude Code 当侧边栏助手的插件）突然报
`authentication_failed`，删了刚加的 key 也没用。排查完发现**症状和真实原因完全不是一回事**。

## 症状 vs. 真实原因

表面时间线：加了一个英伟达的 key（想多接一个 provider）→ 插件整个报 `authentication_failed` → 删掉那个 key → 还是报错。看起来像是加 key 这个动作把认证状态搞坏了。

排查下来，跟英伟达的 key 一点关系都没有：**Claudian 设置里「Claude CLI 路径」那一栏填的是
`/opt/homebrew`，缺了 `/bin/claude`**——不是一个可执行文件路径，是一个目录。改成完整路径
（或者直接清空走自动检测）就好了。

加 key 只是恰好跟这个坏掉的路径撞在了同一个时间点，纯属巧合，不是因果。

## 怎么确认的

**先把"账号"和"插件配置"这两层剥开**，分别验证，不要因为最近改过什么就先入为主：

1. 终端里直接跑 `claude`（不经过 Obsidian）——正常登录、正常对话，说明账号和 CLI 本身没坏。
2. 回头看 Claudian 设置面板，跟真实的 `which claude` 输出（`/opt/homebrew/bin/claude`）逐字比对
   插件里存的路径——发现少了 `/bin/claude`。

排查过程中还踩到一个小插曲：`which claude` 第一次是直接打进正在跑的 `claude` 交互会话里的，
那样打字是在跟 Claude 对话，不是执行 shell 命令，看不到真实路径，还意外碰上那次会话的登录
过期提示（`/login` 重新登一下就好，跟这个 bug 无关）。**验证环境本身要对**：拿 shell 命令当
诊断依据，就必须在真正的 shell 提示符下跑，不能在任何交互式 REPL 里打。

## 教训

**报错发生前"最近改过的东西"不等于"报错的原因"。** 加 key 这个动作在时间上离报错最近，
最容易被当成嫌疑人，但真正的坏配置（CLI 路径缺一截）可能已经存在了一段时间，只是没被
触发过——直到某次插件重启或者别的什么时机，才开始报错。断案要看证据（账号单独测、配置
逐字段核对），不能看时间线上的巧合。

相关：[[AI 工作台]]、[[同步方案]]
