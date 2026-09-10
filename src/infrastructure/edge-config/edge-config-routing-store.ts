import { get } from "@vercel/edge-config";

import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { edgeConfigKey, type TenantRouting } from "@/domain/tenant";

export class EdgeConfigRoutingStore implements TenantRoutingStore {
  async get(hostname: string): Promise<TenantRouting | undefined> {
    return get<TenantRouting>(edgeConfigKey(hostname));
  }
}
