#!/usr/bin/env bash
#
# 把这个仓库的 obsidian/ 目录接进本机 Obsidian 库，并配好自动同步。
#
#   ./scripts/setup-obsidian-sync.sh ~/Documents/Obsidian
#
# 做两件事：
#   1. sparse checkout —— 只把 obsidian/ 拉到库里，代码一个字节都不落盘
#   2. launchd 定时任务 —— 每 15 分钟静默 pull 一次，开机自动加载
#
# 幂等：已经配过就只做更新，不会重复 clone 或重复注册任务。

set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/Lee-Claude/cangjie-skill.git}"
FOLDER_NAME="${FOLDER_NAME:-AI工作台}"

# 默认拉「脚本自己所在的那个分支」的笔记。这样在功能分支上跑就拿功能分支的笔记，
# 合并到 main 之后跑就拿 main 的 —— 不用记 BRANCH= 前缀。
_script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
_current_branch="$(git -C "$_script_dir" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
# detached HEAD 会返回字面量 "HEAD"，这种情况退回 main
[ -n "$_current_branch" ] && [ "$_current_branch" != "HEAD" ] || _current_branch="main"
BRANCH="${BRANCH:-$_current_branch}"
INTERVAL_SECONDS="${INTERVAL_SECONDS:-900}"
LABEL="com.lee.obsidian-pull"

die() { printf '\033[31m✗ %s\033[0m\n' "$1" >&2; exit 1; }
ok()  { printf '\033[32m✓\033[0m %s\n' "$1"; }
warn(){ printf '\033[33m!\033[0m %s\n' "$1"; }

# ── 参数 ────────────────────────────────────────────────────────────
VAULT="${1:-}"
[ -n "$VAULT" ] || die "用法：$0 <Obsidian 库路径>   例：$0 ~/Documents/Obsidian"
VAULT="${VAULT/#\~/$HOME}"
[ -d "$VAULT" ] || die "找不到目录：$VAULT"

TARGET="$VAULT/$FOLDER_NAME"

# ── 前置检查 ────────────────────────────────────────────────────────
command -v git >/dev/null || die "没装 git"

# sparse-checkout 子命令要 git 2.25+，--no-cone 要 2.27+。留点余量要求 2.30。
git_version="$(git --version | awk '{print $3}')"
git_major="${git_version%%.*}"
git_minor="$(printf '%s' "$git_version" | cut -d. -f2)"
if [ "$git_major" -lt 2 ] || { [ "$git_major" -eq 2 ] && [ "$git_minor" -lt 30 ]; }; then
  die "git 版本太老（$git_version），需要 2.30+。macOS 上跑 'brew install git' 升级。"
fi

# iCloud 检查：git 仓库放 iCloud Drive 会被"优化储存空间"抽成占位符，导致仓库损坏
case "$VAULT" in
  *"/Library/Mobile Documents/"*|*"/com~apple~CloudDocs/"*)
    warn "这个库在 iCloud Drive 里。iCloud 的「优化储存空间」可能抽走 .git 里的文件"
    warn "导致仓库损坏。强烈建议把 Obsidian 库移出 iCloud 再跑这个脚本。"
    printf '仍然继续？[y/N] '
    read -r reply
    [ "$reply" = "y" ] || [ "$reply" = "Y" ] || die "已取消"
    ;;
esac

# ── 1. sparse checkout ──────────────────────────────────────────────
if [ -d "$TARGET/.git" ]; then
  ok "已存在，跳过 clone：$TARGET"
else
  [ -e "$TARGET" ] && die "$TARGET 已存在但不是 git 仓库，请先处理掉"
  echo "正在拉取笔记到 $TARGET …"
  git clone --filter=blob:none --sparse "$REPO_URL" "$TARGET" -b "$BRANCH" --quiet
  ok "clone 完成"
fi

cd "$TARGET"
# --no-cone 才能精确到单个目录；默认的 cone 模式会把仓库根目录的
# README.md / SKILL.md 之类也拉下来，那些不该出现在笔记库里
git sparse-checkout set --no-cone '/obsidian/'
git pull --rebase --autostash --quiet 2>/dev/null || warn "pull 失败，检查网络或分支名"

[ -d "$TARGET/obsidian" ] || die "拉下来了但没有 obsidian/ 目录，确认分支 '$BRANCH' 上有这个目录"
if [ -d "$TARGET/workbench" ]; then
  die "workbench/ 落盘了，说明 sparse checkout 没生效"
fi
ok "笔记已就位：$TARGET/obsidian（$(find "$TARGET/obsidian" -name '*.md' | wc -l | tr -d ' ') 篇，来自分支 $BRANCH）"
ok "代码未落盘，库是干净的"

# ── 2. 自动 pull ────────────────────────────────────────────────────
if [ "$(uname)" != "Darwin" ]; then
  warn "非 macOS，跳过 launchd 配置。自己加个 cron：*/15 * * * * git -C '$TARGET' pull --rebase --autostash --quiet"
  exit 0
fi

PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array>
    <string>$(command -v git)</string>
    <string>-C</string>
    <string>$TARGET</string>
    <string>pull</string>
    <string>--rebase</string>
    <string>--autostash</string>
    <string>--quiet</string>
  </array>
  <key>StartInterval</key><integer>$INTERVAL_SECONDS</integer>
  <key>RunAtLoad</key><true/>
  <key>StandardErrorPath</key><string>/tmp/$LABEL.err</string>
</dict>
</plist>
PLIST_EOF

launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
ok "定时任务已注册，每 $((INTERVAL_SECONDS / 60)) 分钟自动 pull 一次"

echo
echo "完成。Obsidian 里打开「$FOLDER_NAME」就能看到笔记。"
echo
echo "  出错日志：  /tmp/$LABEL.err"
echo "  手动同步：  git -C '$TARGET' pull"
echo "  停掉自动：  launchctl unload '$PLIST'"
