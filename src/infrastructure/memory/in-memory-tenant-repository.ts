import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { Tenant } from "@/domain/tenant";

export class InMemoryTenantRepository implements TenantRepository {
  private readonly tenants = new Map<string, Tenant>();

  constructor(seed: Tenant[] = []) {
    for (const tenant of seed) {
      this.tenants.set(tenant.id, tenant);
    }
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.tenants.get(id) ?? null;
  }

  async list(): Promise<Tenant[]> {
    return [...this.tenants.values()];
  }
}
