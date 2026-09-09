import { notFound } from "@/domain/errors";
import type { PublicTenant, TenantContext } from "@/domain/tenant";
import { createSupabaseAdminClient } from "@/infrastructure/supabase/admin";

type TenantRow = {
  slug: string;
  theme_config: Record<string, unknown>;
  status: string;
};

export async function getPublicTenant(
  context: TenantContext,
): Promise<PublicTenant> {
  const supabase = createSupabaseAdminClient();

  const { data, error } = await supabase
    .from("tenants")
    .select("slug, theme_config, status")
    .eq("id", context.tenantId)
    .maybeSingle();

  if (error || !data) {
    throw notFound("Tenant no encontrado");
  }

  const tenant = data as TenantRow;

  if (tenant.status !== "active") {
    throw notFound("Tenant no disponible");
  }

  return {
    slug: tenant.slug,
    domain: context.canonicalHostname,
    themeConfig: tenant.theme_config,
  };
}
