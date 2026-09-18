export type SiteVisitStats = {
  tenantId: string;
  month: string;
  uniqueVisitors: number;
  lastVisitedAt: string | null;
  visitorKeys: string[];
};

export type PlatformSiteSummary = {
  slug: string;
  displayName: string;
  domain: string;
  preview: boolean;
  status: "active" | "suspended";
  visits: number;
  lastVisitedAt: string | null;
  email?: string;
};

export function calendarMonth(at = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(at);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return `${year}-${month}`;
}

export function emptySiteVisitStats(
  tenantId: string,
  at = new Date(),
): SiteVisitStats {
  return {
    tenantId,
    month: calendarMonth(at),
    uniqueVisitors: 0,
    lastVisitedAt: null,
    visitorKeys: [],
  };
}

export function applyUniqueVisit(
  current: SiteVisitStats,
  visitorKey: string,
  at = new Date(),
): SiteVisitStats {
  const month = calendarMonth(at);
  const keys = current.month === month ? current.visitorKeys : [];
  const seen = keys.includes(visitorKey);
  const nextKeys = seen ? keys : [...keys, visitorKey];

  return {
    tenantId: current.tenantId,
    month,
    uniqueVisitors: nextKeys.length,
    lastVisitedAt: at.toISOString(),
    visitorKeys: nextKeys,
  };
}

export function publicSiteVisitStats(stats: SiteVisitStats) {
  return {
    uniqueVisitors: stats.uniqueVisitors,
    month: stats.month,
    lastVisitedAt: stats.lastVisitedAt,
    source: "preview" as const,
  };
}

export function isPreviewHostname(hostname: string): boolean {
  return hostname.endsWith(".localhost") || hostname.includes("localhost:");
}
