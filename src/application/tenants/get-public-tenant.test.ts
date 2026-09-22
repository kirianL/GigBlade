import { describe, expect, it } from "vitest";

import { getPublicTenant } from "@/application/tenants/get-public-tenant";
import { resolveTrustedTenantContext } from "@/application/tenants/resolve-trusted-tenant-context";
import { resolveTenantRouting } from "@/application/tenants/resolve-tenant-routing";
import { serviceUnavailable } from "@/domain/errors";
import { createTenantRouting, type Tenant } from "@/domain/tenant";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "demo",
  plan: "all_inclusive",
  templateId: "pista",
  themeConfig: { accent: "red" },
  status: "active",
};

describe("tenant application", () => {
  it("devuelve solo datos públicos del tenant activo", async () => {
    const publicTenant = await getPublicTenant(new InMemoryTenantRepository([tenant]), {
      tenantId: tenant.id,
      hostname: "localhost",
      canonicalHostname: "demo.test",
    });

    expect(publicTenant).toEqual({
      slug: "demo",
      domain: "demo.test",
      templateId: "pista",
      appearance: "light",
      profile: {
        displayName: "demo",
        tagline: "Sitio oficial del artista",
        city: "",
        bio: "",
        links: {},
      },
    });
    expect(publicTenant).not.toHaveProperty("id");
    expect(publicTenant).not.toHaveProperty("plan");
    expect(publicTenant).not.toHaveProperty("status");
  });

  it("oculta un tenant suspendido", async () => {
    await expect(
      getPublicTenant(
        new InMemoryTenantRepository([{ ...tenant, status: "suspended" }]),
        {
          tenantId: tenant.id,
          hostname: "localhost",
          canonicalHostname: "demo.test",
        },
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("no resuelve un hostname desconocido", async () => {
    const store = new InMemoryTenantRoutingStore([
      ["localhost", createTenantRouting(tenant, "localhost")],
    ]);

    await expect(resolveTenantRouting(store, "otro.test")).resolves.toBeUndefined();
  });

  it("no resuelve un hostname mal formado aunque exista una clave parecida", async () => {
    const store = new InMemoryTenantRoutingStore([
      ["localhost", createTenantRouting(tenant, "localhost")],
    ]);

    await expect(resolveTenantRouting(store, "not a host")).resolves.toBeUndefined();
    await expect(resolveTenantRouting(store, "http://localhost")).resolves.toBeUndefined();
  });

  it("no convierte un fallo de esquema en tenant ausente", async () => {
    const tenants: TenantRepository = {
      findById: async () => {
        throw serviceUnavailable("No se pudo leer el tenant");
      },
      list: async () => [],
      create: async () => {
        throw serviceUnavailable("No se pudo leer el tenant");
      },
      updateSiteContent: async () => {
        throw serviceUnavailable("No se pudo leer el tenant");
      },
      deleteById: async () => {
        throw serviceUnavailable("No se pudo leer el tenant");
      },
    };

    await expect(
      getPublicTenant(tenants, {
        tenantId: tenant.id,
        hostname: "localhost",
        canonicalHostname: "demo.test",
      }),
    ).rejects.toMatchObject({ code: "SERVICE_UNAVAILABLE", status: 503 });
  });

  it("resuelve el tenant por hostname y no por un id inventado", async () => {
    const store = new InMemoryTenantRoutingStore([
      ["localhost", createTenantRouting(tenant, "localhost")],
    ]);

    await expect(resolveTrustedTenantContext(store, "localhost")).resolves.toEqual({
      tenantId: tenant.id,
      hostname: "localhost",
      canonicalHostname: "localhost",
    });
    await expect(
      resolveTrustedTenantContext(store, "gigblade.com"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      resolveTrustedTenantContext(store, "otro.test"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
