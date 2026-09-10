import { canResolveHostname, normalizeHostname } from "@/domain/hostname";
import type { TenantRouting } from "@/domain/tenant";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";

export async function resolveTenantRouting(
  store: TenantRoutingStore,
  hostname: string,
): Promise<TenantRouting | undefined> {
  const normalized = normalizeHostname(hostname);

  if (!canResolveHostname(normalized)) {
    return undefined;
  }

  return store.get(normalized);
}
