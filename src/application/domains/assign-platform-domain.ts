import type { EdgeConfigWriter } from "@/application/ports/edge-config-writer";
import type { ProjectDomains } from "@/application/ports/project-domains";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import type { DomainAutomationDetail } from "@/domain/domain-automation";
import { buildDomainAutomationDetail } from "@/infrastructure/domains/detector";
import { notFound, validationError } from "@/domain/errors";
import { normalizeHostname } from "@/domain/hostname";
import { readSiteProfile } from "@/domain/site-profile";
import type { TenantRouting } from "@/domain/tenant";

import { clearProxyRoutingCache } from "@/lib/tenant/resolve-proxy-routing";

export type AssignDomainInput = {
  slug: string;
  domain: string;
};

export async function assignPlatformDomain(
  tenants: TenantRepository,
  routing: TenantRoutingStore,
  projectDomains: ProjectDomains,
  input: unknown,
  edgeConfigWriter?: EdgeConfigWriter,
): Promise<DomainAutomationDetail> {
  const body = (input ?? {}) as { slug?: unknown; domain?: unknown };
  if (typeof body.slug !== "string" || !body.slug.trim()) {
    throw validationError("Slug del DJ requerido");
  }
  if (typeof body.domain !== "string" || !body.domain.trim()) {
    throw validationError("Dominio requerido");
  }

  const slug = body.slug.trim().toLowerCase();
  const domain = normalizeHostname(body.domain);

  // Validate hostname format
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".")) {
    throw validationError("El formato del dominio no es válido");
  }

  const tenant = tenants.findBySlug
    ? await tenants.findBySlug(slug)
    : (await tenants.list()).find((t) => t.slug === slug) ?? null;
  if (!tenant) {
    throw notFound("DJ no encontrado");
  }

  const profile = readSiteProfile(tenant.slug, tenant.themeConfig);

  // 1. Add to Vercel Project Domains
  let vercelVerified = false;
  try {
    const vercelStatus = await projectDomains.add(domain);
    vercelVerified = Boolean(vercelStatus.verified);
  } catch {
    vercelVerified = false;
  }

  // 2. Put into routing store
  const routingRecord: TenantRouting = {
    id: tenant.id,
    status: "active",
    canonicalHostname: domain,
  };
  await routing.put(domain, routingRecord);
  clearProxyRoutingCache();

  // 3. Sync to Edge Config if writer available
  let edgeConfigSynced = false;
  if (edgeConfigWriter) {
    try {
      await edgeConfigWriter.upsertTenantRouting(domain, routingRecord);
      edgeConfigSynced = true;
    } catch {
      edgeConfigSynced = false;
    }
  } else {
    edgeConfigSynced = true;
  }

  return buildDomainAutomationDetail({
    hostname: domain,
    tenantSlug: tenant.slug,
    tenantName: profile.displayName || tenant.slug,
    vercelVerified,
    edgeConfigSynced,
  });
}
