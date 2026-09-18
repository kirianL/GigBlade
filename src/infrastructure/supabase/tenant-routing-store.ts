import "server-only";

import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { normalizeHostname } from "@/domain/hostname";
import type { TenantRouting } from "@/domain/tenant";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { readPostgrestResult } from "@/infrastructure/supabase/postgrest";

type DomainRow = {
  tenant_id: string;
  hostname: string;
  status: "active" | "suspended";
};

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
    const typed = row as DomainRow;
    return {
      id: typed.tenant_id,
      status: typed.status,
      canonicalHostname: typed.hostname,
    };
  }
}
