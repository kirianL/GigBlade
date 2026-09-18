import { createHash } from "node:crypto";

import type { SiteVisitStore } from "@/application/ports/site-visit-store";
import {
  calendarMonth,
  publicSiteVisitStats,
  type SiteVisitStats,
} from "@/domain/site-visits";
import type { TenantContext } from "@/domain/tenant";

export function visitorFingerprint(
  tenantId: string,
  ip: string,
  userAgent: string,
  at = new Date(),
): string {
  return createHash("sha256")
    .update([tenantId, calendarMonth(at), ip, userAgent].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export function recordSiteVisit(
  store: SiteVisitStore,
  context: TenantContext,
  visitorKey: string,
): Promise<SiteVisitStats> {
  return store.record(context.tenantId, visitorKey);
}

export async function getSiteVisitStats(
  store: SiteVisitStore,
  context: TenantContext,
) {
  return publicSiteVisitStats(await store.get(context.tenantId));
}
