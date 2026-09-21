import type {
  ListedTenantRoute,
  TenantRoutingStore,
} from "@/application/ports/tenant-routing-store";
import { normalizeHostname } from "@/domain/hostname";
import type { TenantRouting } from "@/domain/tenant";

export class InMemoryTenantRoutingStore implements TenantRoutingStore {
  private readonly routes = new Map<string, TenantRouting>();

  constructor(seed: Array<[string, TenantRouting]> = []) {
    for (const [hostname, routing] of seed) {
      this.routes.set(normalizeHostname(hostname), routing);
    }
  }

  async get(hostname: string): Promise<TenantRouting | undefined> {
    return this.routes.get(normalizeHostname(hostname));
  }

  async list(): Promise<ListedTenantRoute[]> {
    return [...this.routes.entries()].map(([hostname, routing]) => ({
      hostname,
      ...routing,
    }));
  }

  async put(hostname: string, routing: TenantRouting): Promise<void> {
    this.routes.set(normalizeHostname(hostname), routing);
  }

  async deleteByTenantId(tenantId: string): Promise<string[]> {
    const removed: string[] = [];
    for (const [hostname, routing] of this.routes) {
      if (routing.id === tenantId) {
        this.routes.delete(hostname);
        removed.push(hostname);
      }
    }
    return removed;
  }
}
