import "server-only";

import { rm } from "node:fs/promises";
import { join } from "node:path";

import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

async function removePrefix(bucket: string, prefix: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(prefix, { limit: 1000 });
  if (error || !data?.length) return;
  const paths = data
    .map((item) => `${prefix}/${item.name}`)
    .filter((path) => path !== `${prefix}/`);
  if (paths.length === 0) return;
  await supabase.storage.from(bucket).remove(paths);
}

export async function deleteSiteMedia(
  slug: string,
  runtime: "memory" | "real",
) {
  if (runtime === "real") {
    await removePrefix("site-images", `sites/${slug}`);
    return;
  }

  await rm(join(process.cwd(), "public", "sites", slug), {
    recursive: true,
    force: true,
  });
}
