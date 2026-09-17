import { notFound } from "@/domain/errors";
import {
  toPublicTenant,
  type PublicTenant,
  type TenantContext,
} from "@/domain/tenant";
import type { TenantRepository } from "@/application/ports/tenant-repository";

export type TenantSite = PublicTenant;

export async function resolveTenantSite(
  tenants: TenantRepository,
  context: TenantContext,
): Promise<TenantSite> {
  const tenant = await tenants.findById(context.tenantId);

  if (!tenant) {
    throw notFound("Tenant no encontrado");
  }

  return toPublicTenant(tenant, context.canonicalHostname);
}
