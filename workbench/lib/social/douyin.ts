import { readFile } from "fs/promises";
import path from "path";
import type { DouyinData } from "./types";

/**
 * 抖音创作者数据。故意不对接官方 API —— 抖音开放平台的"创作者数据"权限
 * 通常需要企业资质审核，短期内申请不下来，而且没有真实凭证这边完全没法
 * 验证对接代码对不对。所以先读一个约定路径的 JSON 文件：仓库自带 demo 数据，
 * 你以后有真实数据（手动导出，或将来接一个同步脚本）就是替换/覆盖这个文件，
 * 前端不用改。
 *
 * 想指向别的文件：设 DOUYIN_DATA_PATH。
 */
export function resolveDouyinDataPath(): string {
  const explicit = process.env.DOUYIN_DATA_PATH?.trim();
  if (explicit) return path.resolve(explicit);
  return path.resolve(process.cwd(), "data", "social", "douyin.json");
}

export async function readDouyinData(filePath = resolveDouyinDataPath()): Promise<DouyinData | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as DouyinData;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
