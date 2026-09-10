import type { TenantRouting } from "@/domain/tenant";

export interface EdgeConfigWriter {
  upsertTenantRouting(hostname: string, routing: TenantRouting): Promise<void>;
  deleteTenantRouting(hostname: string): Promise<void>;
}
