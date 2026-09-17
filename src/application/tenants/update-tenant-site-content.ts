import { notFound, validationError } from "@/domain/errors";
import {
  buildSiteThemeConfig,
  siteContentInputSchema,
} from "@/domain/site-profile";
import { assertRegisteredTemplate } from "@/domain/site-template";
import {
  toPublicTenant,
  type PublicTenant,
  type TenantContext,
} from "@/domain/tenant";
import type { TenantRepository } from "@/application/ports/tenant-repository";

export async function updateTenantSiteContent(
  tenants: TenantRepository,
  context: TenantContext,
  rawInput: unknown,
): Promise<PublicTenant> {
  const parsed = siteContentInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw validationError("El contenido del sitio no es válido");
  }

  const tenant = await tenants.findById(context.tenantId);
  if (!tenant) {
    throw notFound("Tenant no encontrado");
  }

  const updated = await tenants.updateSiteContent(context, {
    templateId: assertRegisteredTemplate(parsed.data.templateId),
    themeConfig: buildSiteThemeConfig(
      tenant.themeConfig,
      tenant.slug,
      parsed.data,
    ),
  });

  return toPublicTenant(updated, context.canonicalHostname);
}
