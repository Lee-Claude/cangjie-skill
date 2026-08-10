export type InsightNote = {
  slug: string;
  title: string;
  platform?: string;
  period?: string;
  created?: string;
  tags: string[];
  excerpt: string;
  content: string;
};

export type DouyinTrendPoint = {
  date: string;
  plays: number;
  likes: number;
  newFollowers: number;
};

export type DouyinVideo = {
  title: string;
  plays: number;
  likes: number;
  comments: number;
  publishedAt: string;
  url?: string;
};

export type DouyinData = {
  /** true 表示这是仓库自带的示例数据，不是你的真实账号 */
  demoMode: boolean;
  updatedAt: string;
  account: {
    nickname: string;
    followers: number;
    followersChange7d: number;
    totalLikes: number;
    totalPlays: number;
  };
  trend: DouyinTrendPoint[];
  topVideos: DouyinVideo[];
};

export type WechatArticle = {
  title: string;
  publishedAt: string;
  reads: number;
  likes: number;
  shares: number;
  url?: string;
};

export type WechatData = {
  demoMode: boolean;
  updatedAt: string;
  account: {
    name: string;
    followers: number;
    followersChange7d: number;
  };
  articles: WechatArticle[];
};
