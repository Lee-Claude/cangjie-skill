---
title: 迁出 iCloud
tags:
  - 配置
  - obsidian
  - macos
created: 2026-08-07
parent: "[[同步方案]]"
---

# 迁出 iCloud

把 Obsidian 库从 iCloud Drive 挪到本地，让 [[同步方案]] 里的 git 仓库能安全运行。

> **2026-08-07 实测：本机不需要挪。** `~/Documents` 不是软链，iCloud「桌面与文稿文件夹」同步是关的，占位符数量 0。库 `~/Documents/Obsidian` 本来就是纯本地目录。
>
> 下面的流程留着备用 —— 换机器、或哪天手滑开了同步，照这个走。

## 先确认要不要挪

别上来就搬。终端粘这段，三行输出就够判断：

```bash
if [ -L ~/Documents ]; then
  echo "iCloud 同步开着 ⚠️  →  $(readlink ~/Documents)"
else
  echo "没开 ✅  普通本地目录，不用挪"
fi
find ~/Documents -name '*.icloud' 2>/dev/null | wc -l   # 占位符数量，0 才干净
```

原理：开启「桌面与文稿文件夹」同步后，macOS 会把 `~/Documents` 变成指向
`~/Library/Mobile Documents/com~apple~CloudDocs/Documents` 的软链。用 `-L` 判断比翻设置界面准，
也不用进设置界面冒手滑点错开关的风险。

> ⚠️ **终端里没有 `~/文稿` 这个路径。**「文稿」只是 Finder 显示的中文名，
> 文件系统里是 `~/Documents`。`cd ~/文稿` 会直接报错。

只有第一行显示"开着"才需要往下做。

## 为什么必须挪

iCloud 的**「优化 Mac 储存空间」**会把不常访问的文件抽走，本地只留一个几百字节的 `.icloud` 占位符，用到时再下载。

这个机制对文档没问题，对 git 仓库是灾难：

- `.git/objects/` 里的文件被抽走 → 仓库损坏，`git status` 直接报错
- 多设备同时同步 → iCloud 在 `.git` 里生成「XXX 2.md」这样的冲突副本，git 索引直接乱掉
- iCloud 不理解 git 的原子性，可能只同步了一半的写入

Obsidian 官方也不建议库放 iCloud（他们自己卖 Obsidian Sync 就是这个原因之一）。

## 关键决策：只挪库，别关 iCloud 同步

**不要去关「桌面与文稿文件夹」那个开关。**

关掉它的时候，macOS 会把 iCloud 上的副本撤走、本地 `~/Documents` 变空，很多人在这一步丢过数据。而且你其他文档本来同步得好好的，没必要陪葬。

正确做法是**把 Obsidian 库单独挪出 `~/Documents`**，放到主目录下（主目录本身不同步）：

```
~/Documents/Obsidian    →    ~/Obsidian
```

一次移动解决问题，其他文档不受影响，iCloud 功能照常。

## 安全步骤

顺序很重要：**先下载 → 再复制 → 验证 → 切换 → 最后才删**。全程别用「移动」，用「复制」，验证通过前旧的一份不要动。

### 1. 退出 Obsidian

必须完全退出（⌘Q），不是关窗口。Obsidian 运行时有文件锁和未落盘的缓存。

### 2. 强制下载全部文件（最容易踩的一步）

如果库里有被抽成占位符的文件，你复制过去的就是几百字节的空壳，内容全丢。

Finder 里打开库所在目录 → 右键库文件夹 → **「立即下载」**。

然后在终端确认没有残留占位符：

```bash
find ~/Documents/Obsidian -name '*.icloud' | head
```

**必须没有任何输出。** 有输出说明还有文件没下载完，等它下完再继续。

### 3. 复制到新位置

```bash
cp -R ~/Documents/Obsidian ~/Obsidian
```

用 `cp` 不用 `mv` —— 验证通过之前，旧的那份是你的后路。

### 4. 验证两边一致

```bash
echo "旧：$(find ~/Documents/Obsidian -type f | wc -l) 个文件，$(du -sh ~/Documents/Obsidian | cut -f1)"
echo "新：$(find ~/Obsidian -type f | wc -l) 个文件，$(du -sh ~/Obsidian | cut -f1)"
```

**文件数和体积都要对得上。** 差得多就是第 2 步没下载干净，回去重做。

### 5. 在 Obsidian 里切过去

打开 Obsidian → 左下角库图标 → 「打开另一个库」→ 「打开本地库」→ 选 `~/Obsidian`。

进去转一圈：笔记在不在、插件正不正常、关系图谱有没有断链。

### 6. 重新指向新路径

```bash
cd ~/code/cangjie-skill
./scripts/setup-obsidian-sync.sh ~/Obsidian
```

脚本会用同一个 label 重新注册 launchd 任务，自动把定时 pull 指到新路径，旧的那条会被替换掉。

### 7. 确认无误后再删旧的

**至少用一整天**，确认新库一切正常，再删：

```bash
rm -rf ~/Documents/Obsidian
```

删之前记得 Obsidian 里已经切到新库了，别把正在用的那份删了。

## 为什么这一步没有写成脚本

[[同步方案]] 里那个配置脚本是幂等的、只读远端、出错能重来。而搬库不一样：**它动的是你唯一一份知识库**，而且依赖 iCloud 下载状态这种脚本判断不可靠的东西。

写成一键脚本 = 把「确认下载完了吗」「文件数对得上吗」这些必须人眼确认的判断藏进黑盒。这类操作值得你手动过一遍，看着数字对上再往下走。

## 挪完之后

`~/Obsidian` 不在任何云同步里，所以想多设备同步得另想办法：

- **Obsidian Sync**（官方，收费）—— 理解 Obsidian 的文件结构，不会跟 git 打架
- **git 本身** —— 库根目录做成一个私有仓库，配 Obsidian Git 插件自动 commit/push
- **Syncthing** —— 免费，点对点，但要自己配

跟本项目的 [[同步方案]] 不冲突：那个管的是 `AI工作台/` 这一个子目录，上面这些管的是整个库。
