import { readFile } from "fs/promises";
import path from "path";
import type { WechatData } from "./types";

/**
 * 公众号文章数据。同样不对接官方 API —— 微信公众平台的图文分析接口通常
 * 只对认证服务号开放，订阅号大多拿不到阅读数这类精细数据；就算能拿到，
 * AppID/AppSecret 换 access_token、素材接口分页、token 刷新这些没有真实
 * 账号也测不出对不对。先读约定路径的 JSON，跟抖音数据同一个模式。
 *
 * 想指向别的文件：设 WECHAT_DATA_PATH。
 */
export function resolveWechatDataPath(): string {
  const explicit = process.env.WECHAT_DATA_PATH?.trim();
  if (explicit) return path.resolve(explicit);
  return path.resolve(process.cwd(), "data", "social", "wechat.json");
}

export async function readWechatData(filePath = resolveWechatDataPath()): Promise<WechatData | null> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as WechatData;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
