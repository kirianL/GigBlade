import "server-only";

import type {
  ListedTenantRoute,
  TenantRoutingStore,
} from "@/application/ports/tenant-routing-store";
import { normalizeHostname } from "@/domain/hostname";
import type { TenantRouting } from "@/domain/tenant";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import {
  failPostgrestQuery,
  readPostgrestResult,
} from "@/infrastructure/supabase/postgrest";

type DomainRow = {
  tenant_id: string;
  hostname: string;
  status: "active" | "suspended";
};

function toRoute(row: DomainRow): ListedTenantRoute {
  return {
    id: row.tenant_id,
    status: row.status,
    canonicalHostname: row.hostname,
    hostname: row.hostname,
  };
}

export class SupabaseTenantRoutingStore implements TenantRoutingStore {
  async get(hostname: string): Promise<TenantRouting | undefined> {
    const canonicalHostname = normalizeHostname(hostname);
    const supabase = createSupabaseAdminClient();
    const row = readPostgrestResult(
      await supabase
        .from("tenant_domains")
        .select("tenant_id, hostname, status")
        .eq("hostname", canonicalHostname)
        .maybeSingle(),
      { operation: "tenant_domains.get" },
    );
    if (!row) return undefined;
    return toRoute(row as DomainRow);
  }

  async list(): Promise<ListedTenantRoute[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tenant_domains")
      .select("tenant_id, hostname, status");
    if (error) {
      failPostgrestQuery(error, { operation: "tenant_domains.list" });
    }
    return ((data ?? []) as DomainRow[]).map(toRoute);
  }

  async deleteByTenantId(tenantId: string): Promise<string[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tenant_domains")
      .delete()
      .eq("tenant_id", tenantId)
      .select("hostname");
    if (error) {
      failPostgrestQuery(error, {
        operation: "tenant_domains.deleteByTenantId",
        tenantId,
      });
    }
    return ((data ?? []) as Array<{ hostname: string }>).map((row) => row.hostname);
  }
}
