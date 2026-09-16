import { notFound } from "@/domain/errors";
import {
  isLocalHostname,
  isMarketingHostname,
  normalizeHostname,
} from "@/domain/hostname";
import type { TenantContext } from "@/domain/tenant";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { resolveTenantRouting } from "@/application/tenants/resolve-tenant-routing";

export async function resolveTrustedTenantContext(
  store: TenantRoutingStore,
  hostname: string,
): Promise<TenantContext> {
  const normalized = normalizeHostname(hostname);

  if (isMarketingHostname(normalized) && !isLocalHostname(normalized)) {
    throw notFound("Tenant no resuelto");
  }

  const tenant = await resolveTenantRouting(store, normalized);

  if (!tenant || tenant.status !== "active") {
    throw notFound("Tenant no resuelto");
  }

  return {
    tenantId: tenant.id,
    hostname: normalized,
    canonicalHostname: tenant.canonicalHostname,
  };
}
