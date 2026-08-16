# 希腊房地产快讯

聚合几个希腊新闻源的 RSS，按关键词筛出房地产相关报道，展示在一个页面上。Next.js 15+ App Router，ISR 每 5 分钟自动刷新，页面上也有手动“刷新”按钮。

## 本地跑起来

```bash
npm install
npm run dev
```

打开 http://localhost:3000。首页最下面有“订阅源状态”，能直接看出每个 RSS 源抓没抓到东西——这一步必须在能访问外网的环境里跑，云端沙箱环境的出网代理会挡住这些站点。

## 数据源怎么配

`src/lib/feeds.ts` 里是订阅源列表。目前这几个是按 WordPress 站点惯例（`/feed/` 路径）猜的，没能实测：

- Greek Reporter — `https://greekreporter.com/feed/`
- Keep Talking Greece — `https://www.keeptalkinggreece.com/feed/`
- Greek City Times — `https://greekcitytimes.com/feed/`
- Ekathimerini — `https://feeds.feedburner.com/ekathimerini`

跑起来之后如果某个源在“订阅源状态”里显示 ❌，去对应网站找到真实的 RSS 地址，改这个文件里的 `url` 字段就行，不用碰其他代码。

这几个源本身是综合新闻站，不是专门做房地产的，所以条目会先过一遍 `REAL_ESTATE_KEYWORDS` 关键词过滤（`src/lib/feeds.ts` 同一个文件里）。想加真正的房地产垂直媒体（比如未来找到确切 RSS 地址的话），把 `dedicated: true` 设上就不会被关键词过滤掉。

## 部署

标准 Next.js 项目，扔 Vercel 直接能跑：`vercel deploy`（在这个目录下）。也可以自己起服务器 `npm run build && npm run start`。
