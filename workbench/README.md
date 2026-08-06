# AI 工作台

左边是实时 AI 热点聚合，右边是能流式对话的创作助手。勾选热点 → 选创作模板 → 直接出稿。

![界面](./docs/screenshot.png)

## 快速开始

```bash
cd workbench
npm install
cp .env.example .env.local   # 填 ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

**没有 API key 也能跑** —— 热点面板照常工作，只有对话会失败，页面顶部会提示去配置。

## 配 API key

打开 `.env.local`，二选一：

```bash
# 方案 A：Claude（默认 claude-opus-5）
ANTHROPIC_API_KEY=sk-ant-xxx

# 方案 B：任何 OpenAI 兼容接口 —— DeepSeek / Kimi / 通义 / 本地 vLLM 都行
OPENAI_API_KEY=sk-xxx
OPENAI_BASE_URL=https://api.deepseek.com/v1
OPENAI_MODEL=deepseek-chat
```

两个都配了会优先用 Claude，想强制切换设 `LLM_PROVIDER=anthropic|openai`。改完 `.env.local` 要重启 dev server。

## 热点数据源

默认开箱即用、不需要任何 key 的四类源：

| 源 | 内容 | 热度依据 |
| --- | --- | --- |
| Hacker News | 近 3 天 AI 相关、>20 分的帖子 | points |
| GitHub | 近 60 天新建、>100 star 的 AI 仓库 | star 数 |
| arXiv | cs.AI / cs.LG / cs.CL 最新论文 | 发布时间 |
| RSS | 量子位、机器之心（可换） | 榜位 + 时间 |

所有源**并行拉取、单独容错**：某个源挂了只会在面板上标红一个 `!`，其余照常出结果。热度分统一压到 0–100（log 归一，避免一个 5 万 star 的仓库把榜单压平），再叠加时间衰减：24 小时内不衰减，之后一周内线性降到 40%。结果按 URL 去重，服务端缓存 5 分钟，前端每 5 分钟自动刷新。

### 接入自建的 AI 热榜

如果你在跑 [ai-hot-radar](https://github.com/zenitlab/ai-hot-radar)、[aihot](https://github.com/tbang6860-commits/aihot) 这类项目，填上它的 API 地址就会自动合并进榜单：

```bash
AIHOT_API_BASE=http://localhost:3001/api/agent
AIHOT_API_PATH=/curated        # 可选
AIHOT_API_TOKEN=               # 可选
```

各家热榜的字段名不统一，适配器做了宽松映射：标题认 `title/name/headline`，链接认 `url/link/href`，热度认 `score/heat/hot/points/stars`，响应外层认 `data/items/list/results/hotspots`。对不上的条目会被跳过，不会让整个源报错。字段实在对不上就改 `lib/sources/aihot.ts` 里的 `pickString` / `pickNumber` 列表。

### 换 RSS 源

```bash
HOT_RSS_FEEDS='量子位|https://www.qbitai.com/feed,新智元|https://xxx/feed'
```

RSS 2.0 和 Atom 两种格式都支持。

## 创作模块

勾选的热点会连同标题、来源、时间、摘要一起拼进 system prompt。上方 5 个模板（自由对话 / 推特长文 / 公众号 / 短视频脚本 / 深度拆解）各自追加一段写作要求，模板文案都在 `lib/prompt.ts` 里，直接改就行。

对话是真正的流式：服务端 SSE 逐 token 推，前端逐字渲染，支持中途「停止」。Enter 发送，Shift+Enter 换行。

## 代码结构

```
app/api/hot      热点聚合接口（并行拉取 + 缓存）
app/api/chat     流式对话接口（SSE）
app/api/status   前端用来判断有没有配 key
lib/sources/     每个数据源一个文件，加源就加一个文件再注册到 index.ts
lib/llm/         provider 抽象：anthropic.ts + openai.ts
lib/prompt.ts    system prompt 和创作模板
hooks/           useHotFeed（轮询）、useChat（SSE 消费）
components/      HotFeed / ChatPanel / Markdown（零依赖的极简渲染，不走 innerHTML）
```

加一个新数据源：在 `lib/sources/` 写个返回 `HotSourceResult` 的函数，扔进 `index.ts` 的 `collectors()` 就完事。

## 其他环境变量

| 变量 | 作用 |
| --- | --- |
| `ANTHROPIC_MODEL` | 默认 `claude-opus-5` |
| `ANTHROPIC_EFFORT` | `low`\|`medium`\|`high`\|`xhigh`\|`max`，默认 `high` |
| `ANTHROPIC_MAX_TOKENS` | 默认 64000（thinking 和正文共用这个额度） |
| `GITHUB_TOKEN` | 把 GitHub 搜索限速从 10 次/分钟提到 30 次/分钟 |
| `HOT_CACHE_TTL_MS` | 热点缓存时长，默认 300000 |

## 部署

```bash
npm run build && npm start
```

Vercel 直接导入 `workbench` 目录即可，把 `.env.local` 里的变量填到项目的 Environment Variables。注意热点缓存是进程内内存缓存，多实例部署时各实例各缓存一份——量级不大，无所谓。
