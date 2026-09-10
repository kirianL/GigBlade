import type { TenantRouting } from "@/domain/tenant";

export interface TenantRoutingStore {
  get(hostname: string): Promise<TenantRouting | undefined>;
}
