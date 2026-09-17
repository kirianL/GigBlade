import { describe, expect, it } from "vitest";

import { resolveTenantSite } from "@/application/sites/resolve-tenant-site";
import type { Tenant } from "@/domain/tenant";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "nox",
  plan: "all_inclusive",
  templateId: "after",
  themeConfig: {
    displayName: "Nox",
    tagline: "Sets nocturnos",
    city: "San José",
  },
  status: "active",
};

const context = {
  tenantId: tenant.id,
  hostname: "demo.localhost",
  canonicalHostname: "demo.localhost",
};

describe("resolveTenantSite", () => {
  it("arma el sitio público con plantilla y perfil, sin id interno", async () => {
    const site = await resolveTenantSite(
      new InMemoryTenantRepository([tenant]),
      context,
    );

    expect(site).toEqual({
      slug: "nox",
      domain: "demo.localhost",
      templateId: "after",
      appearance: "party",
      profile: {
        displayName: "Nox",
        tagline: "Sets nocturnos",
        city: "San José",
        bio: "",
        links: {},
      },
    });
    expect(site).not.toHaveProperty("id");
  });

  it("no cruza el tenant de otro contexto", async () => {
    await expect(
      resolveTenantSite(new InMemoryTenantRepository([tenant]), {
        ...context,
        tenantId: "22222222-2222-4222-8211-222222222222",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("oculta un tenant con plantilla desconocida", async () => {
    await expect(
      resolveTenantSite(
        new InMemoryTenantRepository([
          { ...tenant, templateId: "neon" as Tenant["templateId"] },
        ]),
        context,
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
