import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import type { SiteVisitStore } from "@/application/ports/site-visit-store";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { notFound } from "@/domain/errors";
import {
  requirePlatform,
  type PanelPublicUser,
} from "@/domain/panel-auth";
import { assertValidSlug } from "@/domain/tenant";

export async function deleteDj(
  deps: {
    tenants: TenantRepository;
    routing: TenantRoutingStore;
    visits: SiteVisitStore;
    panelAuth: PanelAuthStore;
    deleteMedia?: (slug: string) => Promise<void>;
    deleteRoutingCache?: (hostname: string) => Promise<void>;
  },
  actor: PanelPublicUser,
  input: { slug: unknown },
) {
  requirePlatform(actor, "Solo la plataforma puede eliminar un DJ.");

  const slug = assertValidSlug(String(input.slug ?? ""));
  const tenant = (await deps.tenants.list()).find((item) => item.slug === slug);
  if (!tenant) throw notFound("No encontramos esa página.");

  const hostnames = await deps.routing.deleteByTenantId(tenant.id);
  await deps.visits.deleteByTenantId(tenant.id);
  await deps.panelAuth.deleteDjAccountsBySlug(slug);
  await deps.tenants.deleteById(tenant.id);

  if (deps.deleteMedia) {
    try {
      await deps.deleteMedia(slug);
    } catch {
      // La página ya no existe; las fotos huérfanas no bloquean el borrado.
    }
  }

  if (deps.deleteRoutingCache) {
    await Promise.all(
      hostnames.map(async (hostname) => {
        try {
          await deps.deleteRoutingCache?.(hostname);
        } catch {
          // Edge Config es cache. El tenant ya se borró.
        }
      }),
    );
  }

  return { slug };
}
