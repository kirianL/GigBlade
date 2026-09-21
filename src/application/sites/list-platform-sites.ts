import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
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
  panelAuth?: PanelAuthStore,
): Promise<PlatformSiteSummary[]> {
  const [allTenants, allVisits, allRoutes, accounts] = await Promise.all([
    tenants.list(),
    visits.list(),
    routing.list(),
    panelAuth ? panelAuth.listAccounts() : Promise.resolve([]),
  ]);
  const visitsByTenant = new Map(allVisits.map((entry) => [entry.tenantId, entry]));
  const routesByTenant = new Map<string, typeof allRoutes>();
  for (const route of allRoutes) {
    const list = routesByTenant.get(route.id) ?? [];
    list.push(route);
    routesByTenant.set(route.id, list);
  }
  const emailBySlug = new Map(
    accounts
      .filter((account) => account.role === "dj" && account.slug)
      .map((account) => [account.slug as string, account.email]),
  );

  return allTenants.map((tenant) => {
    const tenantRoutes = routesByTenant.get(tenant.id) ?? [];
    const domain =
      tenantRoutes.find(
        (route) =>
          typeof route.canonicalHostname === "string" &&
          !isPreviewHostname(route.canonicalHostname),
      )?.canonicalHostname ?? "";
    const preferred =
      tenantRoutes.find((route) => route.canonicalHostname === domain) ??
      tenantRoutes[0];
    const stats = visitsByTenant.get(tenant.id) ?? emptySiteVisitStats(tenant.id);
    const profile = readSiteProfile(tenant.slug, tenant.themeConfig);
    const email = emailBySlug.get(tenant.slug);

    return {
      slug: tenant.slug,
      displayName: profile.displayName,
      domain,
      preview: !domain,
      status: preferred?.status ?? (tenant.status === "suspended" ? "suspended" : "active"),
      visits: stats.uniqueVisitors,
      lastVisitedAt: stats.lastVisitedAt,
      ...(email ? { email } : {}),
    } satisfies PlatformSiteSummary;
  });
}
