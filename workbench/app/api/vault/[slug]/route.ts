import { NextResponse } from "next/server";
import { buildTitleResolver, extractWikilinkTargets, readVault, resolveVaultRoot } from "@/lib/vault/read";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const notes = await readVault(resolveVaultRoot());
    const note = notes.find((n) => n.slug === slug);
    if (!note) {
      return NextResponse.json({ error: `笔记不存在：${slug}` }, { status: 404 });
    }

    // 反向链接：谁链接到了这篇笔记，笔记详情页展示"引用此笔记"用
    const backlinks = notes
      .filter((n) => n.links.includes(slug))
      .map((n) => ({ slug: n.slug, title: n.title }));

    // 正文里每个 [[原始写法]] -> slug 的映射，null 表示死链接（目标笔记不存在）。
    // 前端渲染 Markdown 时靠这张表决定每个 wikilink 该不该可点、点了跳去哪 ——
    // 不能复用 note.links，那是去重、去自环后的图谱边，丢了"原始写法 -> 目标"的对应关系。
    const resolveTarget = buildTitleResolver(notes);
    const linkResolution = Object.fromEntries(
      extractWikilinkTargets(note.content).map((target) => [target, resolveTarget(target)]),
    );

    return NextResponse.json(
      { ...note, backlinks, linkResolution },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取笔记失败" },
      { status: 500 },
    );
  }
}
