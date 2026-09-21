import { notFound, validationError } from "@/domain/errors";
import { canResolveHostname, normalizeHostname } from "@/domain/hostname";
import { readSiteProfile, type SiteProfile } from "@/domain/site-profile";
import {
  assertRegisteredTemplate,
  getSiteTemplateAppearance,
  type SiteTemplateAppearance,
  type SiteTemplateId,
} from "@/domain/site-template";

export type TenantStatus = "active" | "suspended" | "canceled";
export type TenantPlan = "all_inclusive";
export type TenantRoutingStatus = "active" | "suspended";

export type Tenant = {
  id: string;
  slug: string;
  plan: TenantPlan;
  templateId: SiteTemplateId;
  themeConfig: Record<string, unknown>;
  status: TenantStatus;
};

export type TenantRouting = {
  id: string;
  status: TenantRoutingStatus;
  canonicalHostname: string;
};

export type TenantContext = {
  tenantId: string;
  hostname: string;
  canonicalHostname: string;
};

export type PublicTenant = {
  slug: string;
  domain: string;
  templateId: SiteTemplateId;
  appearance: SiteTemplateAppearance;
  profile: SiteProfile;
};

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function edgeConfigKey(hostname: string): string {
  return `tenant_${normalizeHostname(hostname)}`;
}

export function normalizeSlug(value: string): string {
  return value.trim().toLowerCase();
}

export function assertValidSlug(slug: string): string {
  const normalized = normalizeSlug(slug);

  if (!SLUG_PATTERN.test(normalized)) {
    throw validationError("El slug del tenant no es válido");
  }

  return normalized;
}

export function isActiveTenant(tenant: Tenant): boolean {
  return tenant.status === "active";
}

export function toPublicTenant(
  tenant: Tenant,
  canonicalHostname: string,
): PublicTenant {
  if (!isActiveTenant(tenant)) {
    throw notFound("Tenant no disponible");
  }

  const templateId = assertRegisteredTemplate(tenant.templateId);

  return {
    slug: tenant.slug,
    domain: canonicalHostname,
    templateId,
    appearance: getSiteTemplateAppearance(templateId),
    profile: readSiteProfile(tenant.slug, tenant.themeConfig),
  };
}

export function createTenantRouting(
  tenant: Tenant,
  hostname: string,
): TenantRouting {
  const canonicalHostname = normalizeHostname(hostname);

  if (!canResolveHostname(canonicalHostname)) {
    throw validationError("El hostname del tenant no es válido");
  }

  return {
    id: tenant.id,
    status: tenant.status === "active" ? "active" : "suspended",
    canonicalHostname,
  };
}
