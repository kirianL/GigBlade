import { notFound } from "@/domain/errors";
import { isPreviewHostname } from "@/domain/site-visits";
import type { TenantContext } from "@/domain/tenant";
import { getApp } from "@/lib/composition/app";
import { getTenantContext } from "@/lib/tenant/from-headers";

export async function resolveTenantBySlug(slug: string) {
  const normalized = slug.trim().toLowerCase();
  const app = getApp();
  const tenant = app.tenants.findBySlug
    ? await app.tenants.findBySlug(normalized)
    : (await app.tenants.list()).find((item) => item.slug === normalized) ??
      null;
  if (!tenant) {
    throw notFound("Tenant no encontrado");
  }
  return tenant;
}

export async function getRequestTenantContext(
  request: Request,
): Promise<TenantContext> {
  const slug = new URL(request.url).searchParams.get("slug")?.trim().toLowerCase();
  if (!slug) {
    return getTenantContext();
  }

  const app = getApp();
  const tenant = await resolveTenantBySlug(slug);
  const routes = app.routing.listByTenantId
    ? await app.routing.listByTenantId(tenant.id)
    : (await app.routing.list()).filter((route) => route.id === tenant.id);

  const publicHostname = routes.find(
    (route) => !isPreviewHostname(route.canonicalHostname),
  )?.canonicalHostname;
  const hostname = publicHostname ?? `${tenant.slug}.localhost`;
  return {
    tenantId: tenant.id,
    hostname,
    canonicalHostname: hostname,
  };
}
