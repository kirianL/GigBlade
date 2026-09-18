import { describe, expect, it } from "vitest";

import { deleteDj } from "@/application/panel/delete-dj";
import { generateDjPassword } from "@/application/panel/generate-dj-password";
import { loginPanel, readPanelSession } from "@/application/panel/login-panel";
import { createTenantRouting, type Tenant } from "@/domain/tenant";
import { InMemoryPanelAuthStore } from "@/infrastructure/memory/in-memory-panel-auth-store";
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

describe("delete dj", () => {
  it("borra la página, el acceso y las visitas", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);
    const routing = new InMemoryTenantRoutingStore([
      ["nox.localhost", createTenantRouting(tenant, "nox.localhost")],
    ]);
    const visits = new InMemorySiteVisitStore();
    const panelAuth = new InMemoryPanelAuthStore(undefined, "clave-local");
    const platform = await loginPanel(panelAuth, {
      email: "hola@gigblade.com",
      password: "clave-local",
    });
    const actor = await readPanelSession(panelAuth, platform.token);

    await generateDjPassword(panelAuth, tenants, actor, {
      slug: "nox",
      email: "nox@gigblade.dev",
      name: "Kiluzie",
    });
    await visits.record(tenant.id, "visitante-a");

    await expect(
      deleteDj({ tenants, routing, visits, panelAuth }, actor, { slug: "nox" }),
    ).resolves.toEqual({ slug: "nox" });

    await expect(tenants.findById(tenant.id)).resolves.toBeNull();
    await expect(routing.get("nox.localhost")).resolves.toBeUndefined();
    await expect(visits.get(tenant.id)).resolves.toMatchObject({
      uniqueVisitors: 0,
    });
    await expect(panelAuth.findAccount("nox@gigblade.dev")).resolves.toBeNull();
  });

  it("no deja que un DJ borre a otro", async () => {
    const tenants = new InMemoryTenantRepository([tenant]);
    const routing = new InMemoryTenantRoutingStore([
      ["nox.localhost", createTenantRouting(tenant, "nox.localhost")],
    ]);
    const visits = new InMemorySiteVisitStore();
    const panelAuth = new InMemoryPanelAuthStore(undefined, "clave-local");
    const platform = await loginPanel(panelAuth, {
      email: "hola@gigblade.com",
      password: "clave-local",
    });
    const actor = await readPanelSession(panelAuth, platform.token);
    const generated = await generateDjPassword(panelAuth, tenants, actor, {
      slug: "nox",
      email: "nox@gigblade.dev",
      name: "Kiluzie",
    });
    const dj = await loginPanel(panelAuth, {
      email: generated.email,
      password: generated.password,
    });
    const djActor = await readPanelSession(panelAuth, dj.token);

    await expect(
      deleteDj({ tenants, routing, visits, panelAuth }, djActor, { slug: "nox" }),
    ).rejects.toThrow("Solo la plataforma puede eliminar un DJ.");
    await expect(tenants.findById(tenant.id)).resolves.toMatchObject({
      slug: "nox",
    });
  });
});
