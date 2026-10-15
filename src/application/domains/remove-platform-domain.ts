import type { EdgeConfigWriter } from "@/application/ports/edge-config-writer";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { notFound, unauthorized, validationError } from "@/domain/errors";
import { normalizeHostname } from "@/domain/hostname";

export async function removePlatformDomain(
  tenants: TenantRepository,
  routing: TenantRoutingStore,
  domainInput: string,
  slug?: string,
  edgeConfigWriter?: EdgeConfigWriter,
): Promise<{ success: boolean; hostname: string }> {
  const domain = normalizeHostname(domainInput);
  if (!domain || !domain.includes(".")) {
    throw validationError("Dominio no válido");
  }

  const route = await routing.get(domain);
  if (!route) {
    throw notFound("Dominio no registrado en la plataforma");
  }

  if (slug) {
    const allTenants = await tenants.list();
    const tenant = allTenants.find((t) => t.id === route.id);
    if (!tenant || tenant.slug.toLowerCase() !== slug.trim().toLowerCase()) {
      throw unauthorized("No puedes desconectar un dominio que pertenece a otro DJ");
    }
  }

  // Remove from database/in-memory routing store
  await routing.delete(domain);

  // Remove from Edge Config if configured
  if (edgeConfigWriter) {
    try {
      await edgeConfigWriter.deleteTenantRouting(domain);
    } catch {
      // ignore
    }
  }

  return { success: true, hostname: domain };
}
