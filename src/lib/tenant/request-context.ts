import { notFound } from "@/domain/errors";
import type { TenantContext } from "@/domain/tenant";
import { getApp } from "@/lib/composition/app";
import { getTenantContext } from "@/lib/tenant/from-headers";

export async function getRequestTenantContext(
  request: Request,
): Promise<TenantContext> {
  const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase();
  if (!slug) {
    return getTenantContext();
  }

  const tenant = (await getApp().tenants.list()).find((item) => item.slug === slug);
  if (!tenant) {
    throw notFound("Tenant no encontrado");
  }

  const hostname = `${tenant.slug}.localhost`;
  return {
    tenantId: tenant.id,
    hostname,
    canonicalHostname: hostname,
  };
}
