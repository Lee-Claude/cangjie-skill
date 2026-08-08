# 仓库约定

## Obsidian 笔记

用户把这个仓库同步进本机的 `~/Documents/Obsidian` 库。**做完一块有意义的工作后，在 `obsidian/` 目录写一篇对应的笔记**，不要只留代码和 commit message。

要求：

- frontmatter 至少带 `title`、`tags`、`created`；子笔记加 `parent: "[[上级笔记]]"`
- 笔记之间用 `[[双链]]` 串起来，并在 `obsidian/AI 工作台.md` 的索引里挂上
- 写**为什么这么做**和**踩了什么坑**，不要复述代码本身 —— 代码在仓库里，笔记的价值是解释取舍
- 用中文

云端会话没法直接写用户 Mac 上的文件夹，所以内容一律进仓库。用户本机通过 sparse checkout 只把 `obsidian/` 拉进 Obsidian 库，launchd 每 15 分钟自动 pull —— 也就是说**你写进 `obsidian/` 并 push，笔记就会自动出现在用户的知识库里**。方案细节见 `obsidian/同步方案.md`，配置脚本是 `scripts/setup-obsidian-sync.sh`。

因为库里是 sparse checkout，**不要把笔记放到 `obsidian/` 以外的地方** —— 放别处同步不过去。

## 开发

工作台代码在 `workbench/`（Next.js 15 + TypeScript + Tailwind v4）。仓库根目录的其余内容是 skill 文档，两者互不干扰。

改完 `workbench/` 下的东西，提交前跑一次 `npx next build` 确认类型和构建都过。
