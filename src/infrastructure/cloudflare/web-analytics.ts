import "server-only";

import { getCloudflareAccountConfig } from "@/infrastructure/cloudflare/account";

export class CloudflareWebAnalytics {
  async monthlyUniqueVisitors(hostname: string): Promise<number> {
    getCloudflareAccountConfig();
    throw new Error(
      `Cloudflare Web Analytics no está conectado todavía: ${hostname}`,
    );
  }
}
