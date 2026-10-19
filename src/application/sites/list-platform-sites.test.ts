import { describe, expect, it } from "vitest";

import {
  listPlatformSites,
  paginatePlatformSites,
} from "@/application/sites/list-platform-sites";
import { recordSiteVisit } from "@/application/sites/record-site-visit";
import { createTenantRouting, type Tenant } from "@/domain/tenant";
import { InMemorySiteVisitStore } from "@/infrastructure/memory/in-memory-site-visit-store";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "nox",
  plan: "all_inclusive",
  templateId: "after",
  themeConfig: { displayName: "Kiluzie" },
  status: "active",
};

describe("platform sites", () => {
  it("cuenta personas distintas al mes y las lista junto al dominio", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);
    const routing = new InMemoryTenantRoutingStore([
      ["nox.localhost", createTenantRouting(tenant, "nox.localhost")],
    ]);
    const visits = new InMemorySiteVisitStore();
    const context = {
      tenantId: tenant.id,
      hostname: "nox.localhost",
      canonicalHostname: "nox.localhost",
    };

    await recordSiteVisit(visits, context, "visitante-a");
    await recordSiteVisit(visits, context, "visitante-a");
    await recordSiteVisit(visits, context, "visitante-b");
    const sites = await listPlatformSites(tenants, routing, visits);

    expect(sites).toEqual([
      {
        slug: "nox",
        displayName: "Kiluzie",
        domain: "",
        preview: true,
        status: "active",
        visits: 2,
        lastVisitedAt: expect.any(String),
      },
    ]);
  });

  it("lista un DJ aunque todavía no tenga dominio cargado", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);
    const routing = new InMemoryTenantRoutingStore();
    const visits = new InMemorySiteVisitStore();
    const sites = await listPlatformSites(tenants, routing, visits);

    expect(sites).toEqual([
      {
        slug: "nox",
        displayName: "Kiluzie",
        domain: "",
        preview: true,
        status: "active",
        visits: 0,
        lastVisitedAt: null,
      },
    ]);
  });

  it("muestra el dominio propio cuando hay uno público", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);
    const routing = new InMemoryTenantRoutingStore([
      ["nox.localhost", createTenantRouting(tenant, "nox.localhost")],
      ["nox.cr", createTenantRouting(tenant, "nox.cr")],
    ]);
    const visits = new InMemorySiteVisitStore();
    const sites = await listPlatformSites(tenants, routing, visits);

    expect(sites[0]).toMatchObject({
      slug: "nox",
      domain: "nox.cr",
      preview: false,
    });
  });

  it("pagina y filtra sitios devolviendo totales agregados", () => {
    const sample = [
      {
        slug: "luna",
        displayName: "DJ Luna",
        domain: "luna.cr",
        preview: false,
        status: "active" as const,
        visits: 10,
        lastVisitedAt: null,
      },
      {
        slug: "marco",
        displayName: "DJ Marco",
        domain: "",
        preview: true,
        status: "active" as const,
        visits: 5,
        lastVisitedAt: null,
      },
      {
        slug: "nox",
        displayName: "Kiluzie",
        domain: "nox.cr",
        preview: false,
        status: "suspended" as const,
        visits: 3,
        lastVisitedAt: null,
      },
    ];

    const page = paginatePlatformSites(sample, { limit: 2, offset: 0 });
    expect(page.sites.map((s) => s.slug)).toEqual(["luna", "marco"]);
    expect(page.total).toBe(3);
    expect(page.activeCount).toBe(2);
    expect(page.totalVisits).toBe(18);

    const filtered = paginatePlatformSites(sample, { search: "kilu" });
    expect(filtered.sites.map((s) => s.slug)).toEqual(["nox"]);
    expect(filtered.total).toBe(1);
    expect(filtered.activeCount).toBe(2);
  });
});
