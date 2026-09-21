import "server-only";

import type { TenantRepository } from "@/application/ports/tenant-repository";
import { conflict, notFound, serviceUnavailable } from "@/domain/errors";
import type { Tenant, TenantContext } from "@/domain/tenant";
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

  async create(input: Omit<Tenant, "id">): Promise<Tenant> {
    const supabase = createSupabaseAdminClient();
    const result = await supabase
      .from("tenants")
      .insert({
        slug: input.slug,
        plan: input.plan,
        template_id: input.templateId,
        theme_config: input.themeConfig,
        status: input.status,
      })
      .select(TENANT_COLUMNS)
      .maybeSingle();

    if (result.error?.code === "23505") {
      throw conflict("Ya hay un DJ con ese slug.");
    }

    const tenant = readTenantQueryResult(result, {
      operation: "tenants.create",
    });
    if (!tenant) {
      throw serviceUnavailable("No se pudo crear el DJ.");
    }
    return tenant;
  }

  async updateSiteContent(
    context: TenantContext,
    next: Pick<Tenant, "templateId" | "themeConfig">,
  ): Promise<Tenant> {
    const supabase = createSupabaseAdminClient();
    const result = await supabase
      .from("tenants")
      .update({
        template_id: next.templateId,
        theme_config: next.themeConfig,
      })
      .eq("id", context.tenantId)
      .select(TENANT_COLUMNS)
      .maybeSingle();

    const tenant = readTenantQueryResult(result, {
      operation: "tenants.updateSiteContent",
      tenantId: context.tenantId,
    });

    if (!tenant) {
      throw notFound("Tenant no encontrado");
    }

    return tenant;
  }

  async deleteById(id: string): Promise<void> {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("tenants")
      .delete()
      .eq("id", id)
      .select("id")
      .maybeSingle();
    if (error) {
      failPostgrestQuery(error, { operation: "tenants.deleteById", tenantId: id });
    }
    if (!data) {
      throw notFound("Tenant no encontrado");
    }
  }
}
