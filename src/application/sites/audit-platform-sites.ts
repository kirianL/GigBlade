import { getPublicTenant } from "@/application/tenants/get-public-tenant";
import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { readSiteProfile } from "@/domain/site-profile";
import {
  overallFromChecks,
  summarizeAuditTotals,
  type PlatformSiteAudit,
  type PlatformSiteAuditSummary,
  type SiteHealthCheck,
  type SiteHealthLevel,
} from "@/domain/site-health";
import { isPreviewHostname } from "@/domain/site-visits";
import type { Tenant } from "@/domain/tenant";

function check(
  id: SiteHealthCheck["id"],
  level: SiteHealthLevel,
  label: string,
  detail: string,
): SiteHealthCheck {
  return { id, level, label, detail };
}

function hasInsecurePublicLink(profile: ReturnType<typeof readSiteProfile>): boolean {
  const values = [
    ...Object.values(profile.links),
    ...(profile.mixes?.map((mix) => mix.url) ?? []),
    ...(profile.events?.map((event) => event.ticketUrl) ?? []),
  ];
  return values.some((value) => {
    if (typeof value !== "string" || !value.trim()) return false;
    try {
      const url = new URL(value.trim());
      return url.protocol === "http:" && !url.hostname.endsWith(".localhost");
    } catch {
      return false;
    }
  });
}

async function auditTenant(input: {
  tenants: TenantRepository;
  tenant: Tenant;
  routes: Array<{ status: "active" | "suspended"; canonicalHostname: string }>;
  hasPanelAccount: boolean;
}): Promise<PlatformSiteAudit> {
  const { tenants, tenant, routes, hasPanelAccount } = input;
  const profile = readSiteProfile(tenant.slug, tenant.themeConfig);
  const publicDomain =
    routes.find(
      (route) =>
        typeof route.canonicalHostname === "string" &&
        !isPreviewHostname(route.canonicalHostname),
    )?.canonicalHostname ?? null;
  const preferred =
    routes.find((route) => route.canonicalHostname === publicDomain) ??
    routes[0];
  const resolveHostname =
    publicDomain ?? preferred?.canonicalHostname ?? `${tenant.slug}.localhost`;
  const domain = publicDomain ?? "";
  const preview = !publicDomain;
  const routeStatus: PlatformSiteAudit["routeStatus"] =
    preferred?.status ?? "missing";
  const checks: SiteHealthCheck[] = [];

  if (tenant.status === "suspended" || tenant.status === "canceled") {
    checks.push(
      check(
        "tenant_active",
        tenant.status === "canceled" ? "critical" : "warn",
        "Tenant pausado",
        tenant.status === "canceled"
          ? "El plan está cancelado; la página no debería publicarse."
          : "El tenant está suspendido en la base.",
      ),
    );
  } else {
    checks.push(
      check("tenant_active", "ok", "Tenant activo", "El plan figura activo en la plataforma."),
    );
  }

  if (routes.length === 0) {
    checks.push(
      check(
        "routing",
        "critical",
        "Sin enrutamiento",
        "No hay hostname asociado; la página no puede resolverse.",
      ),
    );
    checks.push(
      check(
        "route_alignment",
        "critical",
        "Ruta ausente",
        "No hay registro de dominio/ruta para este DJ.",
      ),
    );
  } else if (preview) {
    checks.push(
      check(
        "routing",
        "warn",
        "Dominio en preparación",
        "Todavía no hay un dominio propio asignado. El sitio público sale cuando se registre.",
      ),
    );
  } else {
    checks.push(
      check(
        "routing",
        "ok",
        "Enrutamiento",
        `Hostname principal: ${domain}.`,
      ),
    );
  }

  if (routes.length > 0) {
    if (tenant.status === "active" && routeStatus === "suspended") {
      checks.push(
        check(
          "route_alignment",
          "warn",
          "Ruta suspendida",
          "El tenant está activo pero la ruta figura suspendida.",
        ),
      );
    } else if (tenant.status !== "active" && routeStatus === "active") {
      checks.push(
        check(
          "route_alignment",
          "warn",
          "Ruta activa con tenant pausado",
          "La ruta sigue activa aunque el tenant no debería publicarse.",
        ),
      );
    } else {
      checks.push(
        check(
          "route_alignment",
          "ok",
          "Estado alineado",
          "Tenant y ruta coinciden.",
        ),
      );
    }
  }

  let publicSiteReady = false;
  try {
    const publicSite = await getPublicTenant(tenants, {
      tenantId: tenant.id,
      hostname: resolveHostname,
      canonicalHostname: resolveHostname,
    });
    publicSiteReady = publicSite.slug === tenant.slug;
    checks.push(
      check(
        "content_valid",
        "ok",
        "Contenido publicable",
        "El perfil se puede serializar para la página pública.",
      ),
    );
  } catch {
    checks.push(
      check(
        "content_valid",
        "critical",
        "Contenido inválido",
        "El tenant no pudo convertirse a respuesta pública.",
      ),
    );
  }

  checks.push(
    check(
      "api_online",
      publicSiteReady ? "ok" : "critical",
      publicSiteReady ? "Sitio resoluble" : "Sitio no publicable",
      publicSiteReady
        ? "La plataforma puede servir este tenant por hostname."
        : "No se pudo armar la respuesta pública del sitio.",
    ),
  );

  if (!profile.displayName.trim()) {
    checks.push(
      check(
        "profile_name",
        "warn",
        "Sin nombre público",
        "La página no muestra un nombre de artista.",
      ),
    );
  } else {
    checks.push(
      check(
        "profile_name",
        "ok",
        "Nombre público",
        profile.displayName.trim(),
      ),
    );
  }

  const hasContact = Boolean(
    profile.email?.trim() || profile.links.instagram?.trim(),
  );
  checks.push(
    check(
      "public_contact",
      hasContact ? "ok" : "warn",
      hasContact ? "Contacto publicado" : "Sin contacto público",
      hasContact
        ? "Hay correo o Instagram visible para booking."
        : "No hay correo ni Instagram; revisá la superficie de contacto.",
    ),
  );

  checks.push(
    check(
      "panel_access",
      hasPanelAccount ? "ok" : "warn",
      hasPanelAccount ? "Acceso al panel" : "Sin cuenta de panel",
      hasPanelAccount
        ? "Existe una cuenta DJ asociada a este slug."
        : "Nadie puede entrar al panel con rol DJ para editar este sitio.",
    ),
  );

  if (hasInsecurePublicLink(profile)) {
    checks.push(
      check(
        "link_security",
        "warn",
        "Enlaces HTTP",
        "Hay links públicos sin HTTPS; preferí URLs seguras.",
      ),
    );
  } else {
    checks.push(
      check(
        "link_security",
        "ok",
        "Enlaces",
        "Links públicos sin HTTP plano.",
      ),
    );
  }

  return {
    slug: tenant.slug,
    displayName: profile.displayName.trim() || tenant.slug,
    domain,
    preview,
    tenantStatus: tenant.status,
    routeStatus,
    overall: overallFromChecks(checks),
    checks,
    checkedAt: new Date().toISOString(),
  };
}

export async function auditPlatformSites(
  tenants: TenantRepository,
  routing: TenantRoutingStore,
  panelAuth: PanelAuthStore,
): Promise<PlatformSiteAuditSummary> {
  const [allTenants, allRoutes, accounts] = await Promise.all([
    tenants.list(),
    routing.list(),
    panelAuth.listAccounts(),
  ]);

  const routesByTenant = new Map<string, typeof allRoutes>();
  for (const route of allRoutes) {
    const list = routesByTenant.get(route.id) ?? [];
    list.push(route);
    routesByTenant.set(route.id, list);
  }

  const panelSlugs = new Set(
    accounts
      .filter((account) => account.role === "dj" && account.slug)
      .map((account) => account.slug as string),
  );

  const checkedAt = new Date().toISOString();
  const sites = await Promise.all(
    allTenants.map((tenant) =>
      auditTenant({
        tenants,
        tenant,
        routes: routesByTenant.get(tenant.id) ?? [],
        hasPanelAccount: panelSlugs.has(tenant.slug),
      }),
    ),
  );

  sites.sort((a, b) => a.displayName.localeCompare(b.displayName, "es"));

  return {
    checkedAt,
    totals: summarizeAuditTotals(sites),
    sites,
  };
}
