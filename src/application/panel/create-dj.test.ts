import { describe, expect, it } from "vitest";

import { createDj } from "@/application/panel/create-dj";
import { loginPanel, readPanelSession } from "@/application/panel/login-panel";
import { InMemoryPanelAuthStore } from "@/infrastructure/memory/in-memory-panel-auth-store";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";

async function platformActor(store = new InMemoryPanelAuthStore(undefined, "clave-local")) {
  const session = await loginPanel(store, {
    email: "hola@gigblade.com",
    password: "clave-local",
  });
  return {
    store,
    actor: await readPanelSession(store, session.token),
  };
}

describe("create dj", () => {
  it("crea la página, el preview y una contraseña de acceso", async () => {
    const tenants = new InMemoryTenantRepository();
    const routing = new InMemoryTenantRoutingStore();
    const { store: panelAuth, actor } = await platformActor();

    const created = await createDj(
      { tenants, routing, panelAuth },
      actor,
      {
        name: "DJ Marco",
        email: "marco@gigblade.dev",
        slug: "marco",
      },
    );

    expect(created).toMatchObject({
      slug: "marco",
      email: "marco@gigblade.dev",
      name: "DJ Marco",
      site: {
        slug: "marco",
        domain: "",
        preview: true,
        status: "active",
      },
    });
    expect(created.password).toHaveLength(12);

    await expect(tenants.list()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: "marco" })]),
    );
    await expect(routing.get("marco.localhost")).resolves.toMatchObject({
      canonicalHostname: "marco.localhost",
      status: "active",
    });
    await expect(panelAuth.findAccount("marco@gigblade.dev")).resolves.toMatchObject({
      role: "dj",
      slug: "marco",
    });
  });

  it("no duplica slug ni correo", async () => {
    const tenants = new InMemoryTenantRepository();
    const routing = new InMemoryTenantRoutingStore();
    const { store: panelAuth, actor } = await platformActor();
    const input = {
      name: "DJ Marco",
      email: "marco@gigblade.dev",
      slug: "marco",
    };
    await createDj({ tenants, routing, panelAuth }, actor, input);

    await expect(
      createDj({ tenants, routing, panelAuth }, actor, input),
    ).rejects.toThrow("Ya hay un DJ con ese slug.");

    await expect(
      createDj(
        { tenants, routing, panelAuth },
        actor,
        { name: "Otra", email: "marco@gigblade.dev", slug: "otra" },
      ),
    ).rejects.toThrow("Ese correo ya tiene una página.");
  });

  it("no deja que un DJ cree otro", async () => {
    const tenants = new InMemoryTenantRepository();
    const routing = new InMemoryTenantRoutingStore();
    const { store: panelAuth, actor } = await platformActor();
    const created = await createDj(
      { tenants, routing, panelAuth },
      actor,
      {
        name: "Nox",
        email: "nox@gigblade.dev",
        slug: "nox",
      },
    );
    const dj = await loginPanel(panelAuth, {
      email: created.email,
      password: created.password,
    });
    const djActor = await readPanelSession(panelAuth, dj.token);

    await expect(
      createDj(
        { tenants, routing, panelAuth },
        djActor,
        { name: "Luna", email: "luna@gigblade.dev", slug: "luna" },
      ),
    ).rejects.toThrow("Solo la plataforma puede agregar un DJ.");
  });
});
