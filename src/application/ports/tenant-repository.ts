import type { Tenant } from "@/domain/tenant";

export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  list(): Promise<Tenant[]>;
}
