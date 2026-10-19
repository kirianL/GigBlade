import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import { adoptDjLoginEmail } from "@/application/panel/adopt-dj-login-email";
import type { SiteVisitStore } from "@/application/ports/site-visit-store";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { readSiteProfile } from "@/domain/site-profile";
import {
  emptySiteVisitStats,
  isPreviewHostname,
  type PlatformSiteSummary,
} from "@/domain/site-visits";

const PLATFORM_SITES_TTL_MS = 10_000;
let cachedSites: {
  data: PlatformSiteSummary[];
  expiresAt: number;
} | null = null;
let inflightSites: Promise<PlatformSiteSummary[]> | null = null;

export type ListPlatformSitesPageOptions = {
  offset?: number;
  limit?: number;
  search?: string;
};

export type PaginatedPlatformSites = {
  sites: PlatformSiteSummary[];
  total: number;
  activeCount: number;
  totalVisits: number;
  offset: number;
  limit: number;
};

export function paginatePlatformSites(
  allSites: PlatformSiteSummary[],
  options: ListPlatformSitesPageOptions = {},
): PaginatedPlatformSites {
  const activeCount = allSites.filter((site) => site.status === "active").length;
  const totalVisits = allSites.reduce((sum, site) => sum + site.visits, 0);
  const needle = options.search?.trim().toLowerCase() ?? "";
  const filtered = needle
    ? allSites.filter((site) =>
        [site.slug, site.displayName, site.domain, site.email ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(needle),
      )
    : allSites;

  const offset = Math.max(0, Math.trunc(options.offset ?? 0));
  const rawLimit = options.limit ?? filtered.length;
  const limit = Math.max(1, Math.min(500, Math.trunc(rawLimit || 50)));
  const sites = filtered.slice(offset, offset + limit);

  return {
    sites,
    total: filtered.length,
    activeCount,
    totalVisits,
    offset,
    limit,
  };
}

export function invalidatePlatformSitesCache() {
  cachedSites = null;
}

export async function listPlatformSites(
  tenants: TenantRepository,
  routing: TenantRoutingStore,
  visits: SiteVisitStore,
  panelAuth?: PanelAuthStore,
): Promise<PlatformSiteSummary[]> {
  const useCache =
    Boolean(panelAuth) && process.env.NODE_ENV !== "test";
  if (useCache && cachedSites && cachedSites.expiresAt > Date.now()) {
    return cachedSites.data;
  }
  if (useCache && inflightSites) {
    return inflightSites;
  }

  const work = (async () => {
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

    const result = await Promise.all(allTenants.map(async (tenant) => {
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
      const accountEmail = emailBySlug.get(tenant.slug);
      if (panelAuth && profile.email && accountEmail && profile.email !== accountEmail) {
        void adoptDjLoginEmail(panelAuth, tenant.slug, profile.email).catch(
          () => {},
        );
      }
      const email = profile.email || accountEmail;

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
    }));

    if (useCache) {
      cachedSites = {
        data: result,
        expiresAt: Date.now() + PLATFORM_SITES_TTL_MS,
      };
    }
    return result;
  })();

  if (useCache) {
    inflightSites = work.finally(() => {
      inflightSites = null;
    });
    return inflightSites;
  }

  return work;
}
