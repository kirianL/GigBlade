import { describe, expect, it } from "vitest";

import { auditPlatformSites } from "@/application/sites/audit-platform-sites";
import { createTenantRouting, type Tenant } from "@/domain/tenant";
import { InMemoryPanelAuthStore } from "@/infrastructure/memory/in-memory-panel-auth-store";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "nox",
  plan: "all_inclusive",
  templateId: "after",
  themeConfig: {
    displayName: "Nox",
    tagline: "Sets",
    city: "San José",
    bio: "Bio",
    links: { instagram: "https://instagram.com/nox" },
  },
  status: "active",
};

describe("auditPlatformSites", () => {
  it("marca warn si falta cuenta de panel o el dominio público", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);
    const routing = new InMemoryTenantRoutingStore([
      ["nox.localhost", createTenantRouting(tenant, "nox.localhost")],
    ]);
    const panelAuth = new InMemoryPanelAuthStore();

    const report = await auditPlatformSites(tenants, routing, panelAuth);

    expect(report.sites).toHaveLength(1);
    const site = report.sites[0];
    expect(site.slug).toBe("nox");
    expect(site.checks.find((item) => item.id === "panel_access")?.level).toBe("warn");
    expect(site.checks.find((item) => item.id === "routing")?.level).toBe("warn");
    expect(site.checks.find((item) => item.id === "routing")?.label).toBe(
      "Dominio en preparación",
    );
    expect(site.checks.find((item) => item.id === "api_online")?.level).toBe("ok");
  });
});
