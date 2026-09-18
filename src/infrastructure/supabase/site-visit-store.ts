import "server-only";

import type { SiteVisitStore } from "@/application/ports/site-visit-store";
import {
  calendarMonth,
  emptySiteVisitStats,
  type SiteVisitStats,
} from "@/domain/site-visits";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { failPostgrestQuery } from "@/infrastructure/supabase/postgrest";

type VisitRow = {
  tenant_id: string;
  month: string;
  visitor_key: string;
  first_seen_at: string;
  last_seen_at: string;
};

const COLUMNS = "tenant_id, month, visitor_key, first_seen_at, last_seen_at";

export class SupabaseSiteVisitStore implements SiteVisitStore {
  async get(tenantId: string): Promise<SiteVisitStats> {
    const month = calendarMonth();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("site_visits")
      .select(COLUMNS)
      .eq("tenant_id", tenantId)
      .eq("month", month);
    if (error) {
      failPostgrestQuery(error, { operation: "site_visits.get", tenantId });
    }
    return statsFromRows(tenantId, month, (data ?? []) as VisitRow[]);
  }

  async record(tenantId: string, visitorKey: string): Promise<SiteVisitStats> {
    const month = calendarMonth();
    const now = new Date().toISOString();
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("site_visits").upsert(
      {
        tenant_id: tenantId,
        month,
        visitor_key: visitorKey,
        last_seen_at: now,
      },
      { onConflict: "tenant_id,month,visitor_key", ignoreDuplicates: false },
    );
    if (error) {
      failPostgrestQuery(error, { operation: "site_visits.record", tenantId });
    }
    return this.get(tenantId);
  }

  async list(): Promise<SiteVisitStats[]> {
    const month = calendarMonth();
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("site_visits")
      .select(COLUMNS)
      .eq("month", month);
    if (error) {
      failPostgrestQuery(error, { operation: "site_visits.list" });
    }
    const byTenant = new Map<string, VisitRow[]>();
    for (const row of (data ?? []) as VisitRow[]) {
      const list = byTenant.get(row.tenant_id) ?? [];
      list.push(row);
      byTenant.set(row.tenant_id, list);
    }
    return [...byTenant.entries()].map(([tenantId, rows]) =>
      statsFromRows(tenantId, month, rows),
    );
  }
}

function statsFromRows(
  tenantId: string,
  month: string,
  rows: VisitRow[],
): SiteVisitStats {
  if (rows.length === 0) return emptySiteVisitStats(tenantId);
  let lastVisitedAt: string | null = null;
  const visitorKeys: string[] = [];
  for (const row of rows) {
    visitorKeys.push(row.visitor_key);
    if (!lastVisitedAt || row.last_seen_at > lastVisitedAt) {
      lastVisitedAt = row.last_seen_at;
    }
  }
  return {
    tenantId,
    month,
    uniqueVisitors: visitorKeys.length,
    lastVisitedAt,
    visitorKeys,
  };
}
