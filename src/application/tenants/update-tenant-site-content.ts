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
    const field = parsed.error.issues[0]?.path[0];
    if (field === "email") {
      throw validationError("El correo no es válido.");
    }
    if (field === "mixes") {
      throw validationError("Revisá los links de los mixes.");
    }
    if (field === "brandColor") {
      throw validationError("El color del sitio no es válido.");
    }
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
