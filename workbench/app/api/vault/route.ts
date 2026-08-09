import { NextResponse } from "next/server";
import { layoutGraph } from "@/lib/vault/layout";
import { readVault, resolveVaultRoot } from "@/lib/vault/read";
import type { VaultResponse } from "@/lib/vault/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const root = resolveVaultRoot();
    const notes = await readVault(root);
    const { nodes, edges } = layoutGraph(notes);

    const payload: VaultResponse = {
      notes: notes
        .map(({ slug, title, tags, created, updated, excerpt, wordCount }) => ({
          slug,
          title,
          tags,
          created,
          updated,
          excerpt,
          wordCount,
        }))
        .sort((a, b) => (b.created ?? "").localeCompare(a.created ?? "")),
      graph: { nodes, edges },
      root,
    };

    return NextResponse.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "读取知识库失败" },
      { status: 500 },
    );
  }
}
