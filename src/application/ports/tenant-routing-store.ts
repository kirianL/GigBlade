import type { TenantRouting } from "@/domain/tenant";

export type ListedTenantRoute = TenantRouting & { hostname: string };

export interface TenantRoutingStore {
  get(hostname: string): Promise<TenantRouting | undefined>;
  list(): Promise<ListedTenantRoute[]>;
  listByTenantId?(tenantId: string): Promise<ListedTenantRoute[]>;
  put(hostname: string, routing: TenantRouting): Promise<void>;
  deleteByTenantId(tenantId: string): Promise<string[]>;
  delete(hostname: string): Promise<void>;
}
