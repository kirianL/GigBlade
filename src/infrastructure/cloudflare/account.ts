import "server-only";

import { getServerEnv } from "@/lib/env/server";

export function getCloudflareAccountConfig() {
  const env = getServerEnv();

  if (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID) {
    throw new Error("Faltan CLOUDFLARE_API_TOKEN o CLOUDFLARE_ACCOUNT_ID");
  }

  return {
    accountId: env.CLOUDFLARE_ACCOUNT_ID,
    apiToken: env.CLOUDFLARE_API_TOKEN,
  };
}
