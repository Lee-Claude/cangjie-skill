import type { HotItem } from "@/lib/types";

export type CreationTemplate = {
  key: string;
  label: string;
  /** 点击模板时自动填进输入框的初稿 */
  starter: string;
  /** 追加到 system prompt 的角色设定 */
  system: string;
};

export const TEMPLATES: CreationTemplate[] = [
  {
    key: "free",
    label: "自由对话",
    starter: "",
    system: "",
  },
  {
    key: "thread",
    label: "推特长文",
    starter: "把选中的热点写成一条中文 X/Twitter thread。",
    system:
      "写 X/Twitter thread 时：第一条必须能独立成立并让人想点开，之后每条一个论点，" +
      "不用编号符号堆砌，不用 emoji 开头。避免营销腔，把事实和观点分开。",
  },
  {
    key: "wechat",
    label: "公众号",
    starter: "把选中的热点写成一篇公众号文章的开头和提纲。",
    system:
      "写公众号文章时：标题给 3 个备选，正文用小标题分段，开头两句要交代清楚" +
      "发生了什么以及为什么现在值得看。不要写“在这个 AI 飞速发展的时代”这类空话。",
  },
  {
    key: "video",
    label: "短视频脚本",
    starter: "把选中的热点写成一个 60 秒的短视频口播脚本。",
    system:
      "写短视频脚本时：按 [画面] / [口播] 两栏输出，前 3 秒必须给出钩子，" +
      "总时长控制在 60 秒（约 180 字口播）。口播用短句，能念出来。",
  },
  {
    key: "analysis",
    label: "深度拆解",
    starter: "拆解选中的热点：它到底解决了什么问题，谁会受影响，有什么没说透的。",
    system:
      "做深度拆解时：先用一句话说清事件本身，再分技术、商业、影响三层展开。" +
      "明确区分“报道里写了的”和“你的推断”。不确定的地方直接说不确定。",
  },
];

export function findTemplate(key?: string): CreationTemplate {
  return TEMPLATES.find((t) => t.key === key) ?? TEMPLATES[0];
}

const BASE_SYSTEM = `你是一个 AI 赛道创作者的工作台助手，正在一个实时热点面板旁边和用户对话。

要求：
- 用中文回答，除非用户用其他语言提问。
- 直接给结果，不要开场白和"好的，我来帮你"这类铺垫。
- 涉及热点事实时，只依据下面提供的热点条目；条目里没有的信息，说明这是你的推断或建议用户去核实，不要编造数字、引述和链接。
- 写作类任务给可直接使用的成稿，不要给"你可以这样写"的元描述。`;

/** 把用户勾选的热点条目拼成 system prompt 里的上下文块。 */
export function buildSystemPrompt(context: HotItem[] = [], templateKey?: string): string {
  const template = findTemplate(templateKey);
  const parts = [BASE_SYSTEM];

  if (template.system) {
    parts.push(`## 本次任务的写作要求\n${template.system}`);
  }

  if (context.length > 0) {
    const block = context
      .map((item, index) => {
        const lines = [
          `${index + 1}. ${item.title}`,
          `   来源：${item.sourceLabel}${item.rawScoreLabel ? ` · ${item.rawScoreLabel}` : ""}`,
          `   链接：${item.url}`,
        ];
        if (item.publishedAt) lines.push(`   时间：${item.publishedAt}`);
        if (item.summary) lines.push(`   摘要：${item.summary}`);
        return lines.join("\n");
      })
      .join("\n\n");
    parts.push(`## 用户选中的热点条目（共 ${context.length} 条）\n${block}`);
  }

  return parts.join("\n\n");
}
