import { notFound } from "@/domain/errors";
import {
  toPublicTenant,
  type PublicTenant,
  type TenantContext,
} from "@/domain/tenant";
import type { TenantRepository } from "@/application/ports/tenant-repository";

export async function getPublicTenant(
  tenants: TenantRepository,
  context: TenantContext,
): Promise<PublicTenant> {
  const tenant = await tenants.findById(context.tenantId);

  if (!tenant) {
    throw notFound("Tenant no encontrado");
  }

  return toPublicTenant(tenant, context.canonicalHostname);
}
