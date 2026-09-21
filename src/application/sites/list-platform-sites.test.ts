import { describe, expect, it } from "vitest";

import { listPlatformSites } from "@/application/sites/list-platform-sites";
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
});
