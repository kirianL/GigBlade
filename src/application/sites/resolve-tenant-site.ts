import { notFound } from "@/domain/errors";
import { assertRegisteredTemplate, type SiteTemplateId } from "@/domain/site-template";
import {
  toPublicTenant,
  type PublicTenant,
  type TenantContext,
} from "@/domain/tenant";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import { readLandingTheme, type LandingTheme } from "@/lib/tenant/theme";

export type TenantSite = PublicTenant & {
  templateId: SiteTemplateId;
  profile: LandingTheme;
};

export async function resolveTenantSite(
  tenants: TenantRepository,
  context: TenantContext,
): Promise<TenantSite> {
  const tenant = await tenants.findById(context.tenantId);

  if (!tenant) {
    throw notFound("Tenant no encontrado");
  }

  const publicTenant = toPublicTenant(tenant, context.canonicalHostname);

  return {
    ...publicTenant,
    templateId: assertRegisteredTemplate(tenant.templateId),
    profile: readLandingTheme(tenant.slug, tenant.themeConfig),
  };
}
