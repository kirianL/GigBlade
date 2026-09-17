import { describe, expect, it } from "vitest";

import { updateTenantSiteContent } from "@/application/tenants/update-tenant-site-content";
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
    bio: "Resident.",
    leftover: true,
    links: { instagram: "https://instagram.com/old" },
  },
  status: "active",
};

const context = {
  tenantId: tenant.id,
  hostname: "demo.localhost",
  canonicalHostname: "demo.localhost",
};

describe("updateTenantSiteContent", () => {
  it("guarda plantilla, perfil y enlaces sanitizados sin cruzar tenant", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);

    const publicTenant = await updateTenantSiteContent(tenants, context, {
      templateId: "pista",
      displayName: "Nox",
      tagline: "Claro y directo",
      city: "San José",
      bio: "Bio nueva",
      links: {
        instagram: "@nox",
        spotify: "https://open.spotify.com/artist/nox",
        soundcloud: "javascript:alert(1)",
      },
    });

    expect(publicTenant).toMatchObject({
      slug: "nox",
      templateId: "pista",
      appearance: "light",
      profile: {
        displayName: "Nox",
        tagline: "Claro y directo",
        city: "San José",
        bio: "Bio nueva",
        links: {
          instagram: "https://instagram.com/nox",
          spotify: "https://open.spotify.com/artist/nox",
        },
      },
    });

    const stored = await tenants.findById(tenant.id);
    expect(stored?.themeConfig).toMatchObject({ leftover: true });
    expect(stored?.themeConfig.links).not.toHaveProperty("soundcloud");

    await expect(
      updateTenantSiteContent(
        tenants,
        { ...context, tenantId: "22222222-2222-4222-8211-222222222222" },
        { templateId: "festival" },
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("guarda el color de marca del sitio", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);

    const publicTenant = await updateTenantSiteContent(tenants, context, {
      templateId: "after",
      brandColor: "#1D4ED8",
    });

    expect(publicTenant.profile.brandColor).toBe("#1d4ed8");
    const stored = await tenants.findById(tenant.id);
    expect(stored?.themeConfig.brandColor).toBe("#1d4ed8");
  });

  it("no borra el perfil si solo cambia el color", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);

    const publicTenant = await updateTenantSiteContent(tenants, context, {
      templateId: "after",
      brandColor: "#0f766e",
    });

    expect(publicTenant.profile).toMatchObject({
      displayName: "Nox",
      tagline: "Sets nocturnos",
      city: "San José",
      bio: "Resident.",
      brandColor: "#0f766e",
      links: { instagram: "https://instagram.com/old" },
    });
  });

  it("rechaza un color de marca inválido", async () => {
    await expect(
      updateTenantSiteContent(new InMemoryTenantRepository([tenant]), context, {
        templateId: "after",
        brandColor: "red",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });

  it("rechaza un id de plantilla fuera del catálogo", async () => {
    await expect(
      updateTenantSiteContent(new InMemoryTenantRepository([tenant]), context, {
        templateId: "neon",
      }),
    ).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
  });
});
