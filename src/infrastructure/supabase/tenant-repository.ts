import "server-only";

import type { TenantRepository } from "@/application/ports/tenant-repository";
import { serviceUnavailable } from "@/domain/errors";
import type { Tenant } from "@/domain/tenant";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";
import { failPostgrestQuery } from "@/infrastructure/supabase/postgrest";
import { readTenantQueryResult } from "@/infrastructure/supabase/read-tenant-row";

const TENANT_COLUMNS = "id, slug, plan, template_id, theme_config, status";

export class SupabaseTenantRepository implements TenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const supabase = createSupabaseAdminClient();
    const result = await supabase
      .from("tenants")
      .select(TENANT_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    return readTenantQueryResult(result, {
      operation: "tenants.findById",
      tenantId: id,
    });
  }

  async list(): Promise<Tenant[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .select(TENANT_COLUMNS)
      .order("slug");

    if (error) {
      failPostgrestQuery(error, { operation: "tenants.list" });
    }

    return (data ?? []).map((row) => {
      const tenant = readTenantQueryResult(
        { data: row, error: null },
        { operation: "tenants.list" },
      );
      if (!tenant) {
        throw serviceUnavailable("Esquema de tenant incompleto");
      }
      return tenant;
    });
  }
}
