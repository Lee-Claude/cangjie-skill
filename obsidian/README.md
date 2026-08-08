# Obsidian 笔记

这个目录是给 Obsidian 用的，笔记都带 frontmatter、双链和标签。入口是 [[AI 工作台]]。

## 接进本机 Obsidian 库

```bash
# PR #1 合并前脚本还在功能分支上，clone 要带 -b；合并后去掉即可
git clone -b claude/personal-ai-dashboard-adxhu5 \
  https://github.com/Lee-Claude/cangjie-skill.git ~/code/cangjie-skill
cd ~/code/cangjie-skill
./scripts/setup-obsidian-sync.sh ~/Documents/Obsidian
```

一条命令搞定：sparse checkout 只把这个目录拉进库（代码不落盘），再注册一个 launchd 任务每 15 分钟自动 pull。脚本幂等，可以重复跑。

拉哪个分支的笔记不用指定 —— 脚本会跟着自己所在的分支走。

完整说明、为什么这么选、以及 iCloud 那个坑，见 [[同步方案]]。

## 约定

新笔记放这个目录，frontmatter 至少带 `title`、`tags`、`created`，子笔记用 `parent: "[[上级笔记]]"` 串起来。索引在 [[AI 工作台]] 里维护。
