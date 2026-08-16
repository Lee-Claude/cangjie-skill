"use server";

import { updateTag } from "next/cache";

export async function refreshNews() {
  updateTag("news");
}
