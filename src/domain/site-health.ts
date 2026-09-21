export type SiteHealthLevel = "ok" | "warn" | "critical";

export type SiteHealthCheckId =
  | "tenant_active"
  | "routing"
  | "content_valid"
  | "api_online"
  | "panel_access"
  | "public_contact"
  | "profile_name"
  | "route_alignment"
  | "link_security";

export type SiteHealthCheck = {
  id: SiteHealthCheckId;
  level: SiteHealthLevel;
  label: string;
  detail: string;
};

export type PlatformSiteAudit = {
  slug: string;
  displayName: string;
  domain: string;
  preview: boolean;
  tenantStatus: "active" | "suspended" | "canceled";
  routeStatus: "active" | "suspended" | "missing";
  overall: SiteHealthLevel;
  checks: SiteHealthCheck[];
  checkedAt: string;
};

export type PlatformSiteAuditSummary = {
  checkedAt: string;
  totals: Record<SiteHealthLevel, number>;
  sites: PlatformSiteAudit[];
};

const LEVEL_RANK: Record<SiteHealthLevel, number> = {
  ok: 0,
  warn: 1,
  critical: 2,
};

export function mergeHealthLevel(
  current: SiteHealthLevel,
  next: SiteHealthLevel,
): SiteHealthLevel {
  return LEVEL_RANK[next] > LEVEL_RANK[current] ? next : current;
}

export function overallFromChecks(checks: SiteHealthCheck[]): SiteHealthLevel {
  return checks.reduce<SiteHealthLevel>(
    (level, check) => mergeHealthLevel(level, check.level),
    "ok",
  );
}

export function summarizeAuditTotals(
  sites: PlatformSiteAudit[],
): Record<SiteHealthLevel, number> {
  return sites.reduce(
    (totals, site) => {
      totals[site.overall] += 1;
      return totals;
    },
    { ok: 0, warn: 0, critical: 0 } satisfies Record<SiteHealthLevel, number>,
  );
}
