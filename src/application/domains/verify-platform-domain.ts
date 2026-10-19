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

export async function verifyPlatformDomain(
  tenants: TenantRepository,
  routing: TenantRoutingStore,
  projectDomains: ProjectDomains,
  domainInput: string,
  edgeConfigWriter?: EdgeConfigWriter,
): Promise<DomainAutomationDetail> {
  const domain = normalizeHostname(domainInput);
  if (!domain || !domain.includes(".")) {
    throw validationError("Dominio no válido");
  }

  // 1. Ask Vercel to verify
  let vercelVerified = false;
  let verificationChallenges: import("@/application/ports/project-domains").ProjectDomainVerificationChallenge[] | undefined;
  try {
    const vercelRes = await projectDomains.verify(domain);
    vercelVerified = Boolean(vercelRes.verified);
    verificationChallenges = vercelRes.verification;
  } catch {
    vercelVerified = false;
  }

  // 2. Find associated tenant
  const route = await routing.get(domain);
  if (!route) {
    throw notFound("Dominio no registrado en la plataforma");
  }

  const tenant = await tenants.findById(route.id);
  const profile = tenant
    ? readSiteProfile(tenant.slug, tenant.themeConfig)
    : null;

  clearProxyRoutingCache();

  // 3. If verified or pointed, ensure Edge Config is synced
  let edgeConfigSynced = false;
  if (edgeConfigWriter) {
    try {
      const routingRecord: TenantRouting = {
        id: route.id,
        status: "active",
        canonicalHostname: domain,
      };
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
    tenantSlug: tenant?.slug ?? "dj",
    tenantName: profile?.displayName ?? tenant?.slug ?? "DJ",
    vercelVerified,
    edgeConfigSynced,
    verificationChallenges,
  });
}
