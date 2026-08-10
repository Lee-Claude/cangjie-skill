export type VaultNote = {
  /** 稳定 ID，来自文件名（不含 .md），用于 wikilink 解析和路由 */
  slug: string;
  title: string;
  tags: string[];
  created?: string;
  updated?: string;
  /** frontmatter 里除 title/tags/created/updated 外的其余字段，原样透传 */
  extra: Record<string, string>;
  /** 正文前 160 字，去 Markdown 语法，用于列表页摘要 */
  excerpt: string;
  /** 全文，供详情页渲染 */
  content: string;
  /** 这篇笔记链出的其他笔记 slug（已过滤掉指向不存在笔记的死链接） */
  links: string[];
  wordCount: number;
};

export type GraphNode = {
  id: string;
  title: string;
  tags: string[];
  /** 0–1 归一化坐标，前端按容器尺寸缩放 */
  x: number;
  y: number;
  /** 度数（连接数），前端用来决定节点大小 */
  degree: number;
};

export type GraphEdge = {
  source: string;
  target: string;
};

export type VaultGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

export type VaultNoteSummary = Pick<
  VaultNote,
  "slug" | "title" | "tags" | "created" | "updated" | "excerpt" | "wordCount"
>;

export type VaultResponse = {
  notes: VaultNoteSummary[];
  graph: VaultGraph;
  root: string;
};

/** GET /api/vault/[slug] 的响应形状：笔记全文 + 反向链接 + wikilink 解析表。 */
export type VaultNoteDetail = Omit<VaultNote, "extra" | "content"> & {
  content: string;
  backlinks: { slug: string; title: string }[];
  /** 正文里每个 `[[原始写法]]` -> slug；null 表示目标笔记不存在（死链接） */
  linkResolution: Record<string, string | null>;
};
