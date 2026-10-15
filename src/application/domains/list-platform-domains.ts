import type { ProjectDomains } from "@/application/ports/project-domains";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import type { DomainAutomationDetail } from "@/domain/domain-automation";
import { buildDomainAutomationDetail } from "@/infrastructure/domains/detector";
import { isPreviewHostname } from "@/domain/site-visits";
import { readSiteProfile } from "@/domain/site-profile";

export async function listPlatformDomains(
  tenants: TenantRepository,
  routing: TenantRoutingStore,
  projectDomains: ProjectDomains,
): Promise<DomainAutomationDetail[]> {
  const [allTenants, allRoutes] = await Promise.all([
    tenants.list(),
    routing.list(),
  ]);

  const routesByTenant = new Map<string, typeof allRoutes>();
  for (const route of allRoutes) {
    const list = routesByTenant.get(route.id) ?? [];
    list.push(route);
    routesByTenant.set(route.id, list);
  }

  const results: DomainAutomationDetail[] = [];

  for (const tenant of allTenants) {
    const profile = readSiteProfile(tenant.slug, tenant.themeConfig);
    const tenantRoutes = routesByTenant.get(tenant.id) ?? [];
    const customRoute = tenantRoutes.find(
      (route) =>
        typeof route.canonicalHostname === "string" &&
        !isPreviewHostname(route.canonicalHostname),
    );

    if (customRoute && customRoute.canonicalHostname) {
      let vercelVerified = false;
      let verificationChallenges: import("@/application/ports/project-domains").ProjectDomainVerificationChallenge[] | undefined;
      try {
        const vercelStatus = await projectDomains.getStatus(
          customRoute.canonicalHostname,
        );
        vercelVerified = Boolean(vercelStatus.verified);
        verificationChallenges = vercelStatus.verification;
      } catch {
        vercelVerified = false;
      }

      const detail = await buildDomainAutomationDetail({
        hostname: customRoute.canonicalHostname,
        tenantSlug: tenant.slug,
        tenantName: profile.displayName || tenant.slug,
        vercelVerified,
        edgeConfigSynced: customRoute.status === "active",
        verificationChallenges,
      });

      results.push(detail);
    }
  }

  return results;
}
