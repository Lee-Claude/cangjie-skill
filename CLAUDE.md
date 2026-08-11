# 仓库约定

## Obsidian 笔记

用户把这个仓库同步进本机的 `~/Obsidian` 库。**做完一块有意义的工作后，在 `obsidian/` 目录写一篇对应的笔记**，不要只留代码和 commit message。

要求：

- frontmatter 至少带 `title`、`tags`、`created`；子笔记加 `parent: "[[上级笔记]]"`
- 笔记之间用 wikilink 串起来，并在 `obsidian/AI 工作台.md` 的索引里挂上
- 写**为什么这么做**和**踩了什么坑**，不要复述代码本身 —— 代码在仓库里，笔记的价值是解释取舍
- 用中文

云端会话没法直接写用户 Mac 上的文件夹，所以内容一律进仓库。用户本机通过 sparse checkout 只把 `obsidian/` 拉进 Obsidian 库，launchd 每 15 分钟自动 pull —— 也就是说**你写进 `obsidian/` 并 push，笔记就会自动出现在用户的知识库里**。方案细节见 `obsidian/同步方案.md`，配置脚本是 `scripts/setup-obsidian-sync.sh`。

因为库里是 sparse checkout，**不要把笔记放到 `obsidian/` 以外的地方** —— 放别处同步不过去。

## 跨会话同步收件箱

Lee 在他 Mac 上还跑着另一个本地 Claude Code 会话，两边约定用 `.claude-sync/INBOX.md` 互相留言（不是 Obsidian 笔记，别混进 `obsidian/`）。

**每次会话开始时先读一眼这个文件**，看有没有本地会话留给你的消息或请求；处理完在下面追加确认，规则见文件内的协议说明。这是异步的——不会立刻收到通知，靠 push/pull。

## 怎么跟用户配合

**能自己验证的绝不甩给用户。** 只有必须在用户机器上跑的（macOS 特有行为、GUI 操作、
本地权限），才请他动手。

**一次只给一步。** 别一口气列 ①②③④⑤ —— 中间任何一步的实际结果都可能改变后面的走法，
提前给等于逼他按一条可能已经作废的路线走。拿到这一步的结果，再决定下一步。

**每步都要有明确的成败判据**，让他知道该看输出里的哪一行。

## 开发

工作台代码在 `workbench/`（Next.js 15 + TypeScript + Tailwind v4）。仓库根目录的其余内容是 skill 文档，两者互不干扰。

改完 `workbench/` 下的东西，提交前跑一次 `npx next build` 确认类型和构建都过。
