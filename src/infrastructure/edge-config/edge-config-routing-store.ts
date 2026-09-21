import { get } from "@vercel/edge-config";

import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { serviceUnavailable } from "@/domain/errors";
import { edgeConfigKey, type TenantRouting } from "@/domain/tenant";

export class EdgeConfigRoutingStore implements TenantRoutingStore {
  async get(hostname: string): Promise<TenantRouting | undefined> {
    return get<TenantRouting>(edgeConfigKey(hostname));
  }

  async list() {
    return [];
  }

  async put(): Promise<void> {
    throw serviceUnavailable("No se puede crear un dominio en Edge Config.");
  }

  async deleteByTenantId() {
    return [];
  }
}
