# Obsidian 笔记

这个目录是给 Obsidian 用的，笔记都带 frontmatter、双链和标签。入口是 [[AI 工作台]]。

## 怎么让它出现在你的 Obsidian 库里

Claude 跑在云端容器里，写不了你 Mac 上的 `~/文稿/Obsidian`。所以走 git：内容推到仓库，你在本机拉下来。

### 方案一：软链（推荐）

仓库放在别处，只把这个目录软链进 Obsidian 库。好处是笔记和代码一起版本管理，但 Obsidian 库里不会混进 `node_modules`。

```bash
git clone https://github.com/Lee-Claude/cangjie-skill.git ~/code/cangjie-skill
ln -s ~/code/cangjie-skill/obsidian ~/文稿/Obsidian/AI工作台
```

以后更新：

```bash
cd ~/code/cangjie-skill && git pull
```

Obsidian 里立刻就能看到。

> Obsidian 默认**不跟随软链**。设置 → 文件与链接 → 打开「检测所有文件变化」；或者干脆用方案二。

### 方案二：直接 clone 进库

```bash
cd ~/文稿/Obsidian
git clone https://github.com/Lee-Claude/cangjie-skill.git
```

简单，但整个仓库（含 `workbench/` 的代码）都会进库，Obsidian 的搜索和图谱会把代码文件也算进去。介意的话在库设置里把 `cangjie-skill/workbench` 加进「排除的文件」。

### 方案三：本机跑 Claude Code

在你自己 Mac 上装 Claude Code 打开这个项目，它就能直接读写 `~/文稿/Obsidian`，不用 git 中转。这是唯一能做到"所有文件自动放进去"的路子。

## 约定

新笔记放这个目录，frontmatter 至少带 `title`、`tags`、`created`，子笔记用 `parent: "[[上级笔记]]"` 串起来。索引在 [[AI 工作台]] 里维护。
