import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
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
}
