import "server-only";

import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { Tenant, TenantPlan, TenantStatus } from "@/domain/tenant";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

type TenantRow = {
  id: string;
  slug: string;
  plan: TenantPlan;
  theme_config: Record<string, unknown>;
  status: TenantStatus;
};

export class SupabaseTenantRepository implements TenantRepository {
  async findById(id: string): Promise<Tenant | null> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id, slug, plan, theme_config, status")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const row = data as TenantRow;

    return mapTenant(row);
  }

  async list(): Promise<Tenant[]> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("id, slug, plan, theme_config, status")
      .order("slug");

    if (error || !data) {
      return [];
    }

    return (data as TenantRow[]).map(mapTenant);
  }
}

function mapTenant(row: TenantRow): Tenant {
  return {
    id: row.id,
    slug: row.slug,
    plan: row.plan,
    themeConfig: row.theme_config,
    status: row.status,
  };
}
