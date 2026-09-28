import { notFound } from "@/domain/errors";
import { isPreviewHostname } from "@/domain/site-visits";
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

  const app = getApp();
  const [tenants, routes] = await Promise.all([
    app.tenants.list(),
    app.routing.list(),
  ]);
  const tenant = tenants.find((item) => item.slug === slug);
  if (!tenant) {
    throw notFound("Tenant no encontrado");
  }

  const publicHostname = routes.find(
    (route) =>
      route.id === tenant.id && !isPreviewHostname(route.canonicalHostname),
  )?.canonicalHostname;
  const hostname = publicHostname ?? `${tenant.slug}.localhost`;
  return {
    tenantId: tenant.id,
    hostname,
    canonicalHostname: hostname,
  };
}
