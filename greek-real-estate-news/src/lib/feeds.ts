export type FeedSource = {
  id: string;
  name: string;
  url: string;
  homepage: string;
  /**
   * true = 站点本身就是希腊房地产垂直媒体，条目全收
   * false = 综合新闻站，需要按关键词过滤出房地产相关条目
   */
  dedicated: boolean;
};

// 这些 URL 是根据站点技术栈（多为 WordPress，惯例用 /feed/）和搜索结果推断的，
// 云端会话的出网代理挡住了直连验证（greekreporter.com 等域名直接 403），
// 没法在这里实测通不通。跑 `npm run dev` 时看首页底部的“订阅源状态”就知道哪个源是空的，
// 空了就去对应站点确认真实 RSS 地址，改这个文件就行。
export const FEED_SOURCES: FeedSource[] = [
  {
    id: "greek-reporter",
    name: "Greek Reporter",
    url: "https://greekreporter.com/feed/",
    homepage: "https://greekreporter.com/",
    dedicated: false,
  },
  {
    id: "keep-talking-greece",
    name: "Keep Talking Greece",
    url: "https://www.keeptalkinggreece.com/feed/",
    homepage: "https://www.keeptalkinggreece.com/",
    dedicated: false,
  },
  {
    id: "greek-city-times",
    name: "Greek City Times",
    url: "https://greekcitytimes.com/feed/",
    homepage: "https://greekcitytimes.com/",
    dedicated: false,
  },
  {
    id: "ekathimerini",
    name: "Ekathimerini",
    url: "https://feeds.feedburner.com/ekathimerini",
    homepage: "https://www.ekathimerini.com/",
    dedicated: false,
  },
];

// 综合新闻源用这些关键词（英文 + 希腊语）筛出房地产相关条目
export const REAL_ESTATE_KEYWORDS = [
  "real estate",
  "property",
  "properties",
  "housing",
  "home price",
  "home prices",
  "house price",
  "apartment",
  "apartments",
  "villa",
  "rent",
  "rental",
  "mortgage",
  "golden visa",
  "construction permit",
  "ακίνητ", // ακίνητα / ακινήτων 等变格
  "στέγ", // στέγη / στέγαση
  "ενοίκι", // ενοικίαση
  "διαμέρισμα",
];
