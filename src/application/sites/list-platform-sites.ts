import type { SiteVisitStore } from "@/application/ports/site-visit-store";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { readSiteProfile } from "@/domain/site-profile";
import {
  emptySiteVisitStats,
  isPreviewHostname,
  type PlatformSiteSummary,
} from "@/domain/site-visits";

export async function listPlatformSites(
  tenants: TenantRepository,
  routing: TenantRoutingStore,
  visits: SiteVisitStore,
): Promise<PlatformSiteSummary[]> {
  const [allTenants, allVisits] = await Promise.all([
    tenants.list(),
    visits.list(),
  ]);
  const visitsByTenant = new Map(allVisits.map((entry) => [entry.tenantId, entry]));

  const rows = await Promise.all(
    allTenants.map(async (tenant) => {
      const hostname = `${tenant.slug}.localhost`;
      const route = await routing.get(hostname);
      if (!route) return null;

      const stats = visitsByTenant.get(tenant.id) ?? emptySiteVisitStats(tenant.id);
      const profile = readSiteProfile(tenant.slug, tenant.themeConfig);

      return {
        slug: tenant.slug,
        displayName: profile.displayName,
        domain: route.canonicalHostname,
        preview: isPreviewHostname(route.canonicalHostname),
        status: route.status,
        visits: stats.uniqueVisitors,
        lastVisitedAt: stats.lastVisitedAt,
      } satisfies PlatformSiteSummary;
    }),
  );

  return rows.filter((row): row is PlatformSiteSummary => row !== null);
}
