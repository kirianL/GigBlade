import { describe, expect, it } from "vitest";

import { onboardWaitlistSignup } from "@/application/waitlist/onboard-waitlist";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { loginPanel, readPanelSession } from "@/application/panel/login-panel";
import { InMemoryPanelAuthStore } from "@/infrastructure/memory/in-memory-panel-auth-store";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";

describe("onboard waitlist", () => {
  it("crea la página con el correo de la solicitud y marca la lista", async () => {
    const waitlist = new InMemoryWaitlistRepository();
    await joinWaitlist(waitlist, {
      artistName: "Luna Set",
      email: "luna@example.com",
      country: "CR",
      city: "San José",
      instagram: "lunaset",
      phone: "88880000",
    });
    const signup = (await waitlist.list())[0];
    const tenants = new InMemoryTenantRepository();
    const routing = new InMemoryTenantRoutingStore();
    const panelAuth = new InMemoryPanelAuthStore(undefined, "clave-local");
    const session = await loginPanel(panelAuth, {
      email: "hola@gigblade.com",
      password: "clave-local",
    });
    const actor = await readPanelSession(panelAuth, session.token);
    const sent: string[] = [];

    const created = await onboardWaitlistSignup(
      {
        waitlist,
        tenants,
        routing,
        panelAuth,
        sendAccessEmail: async (input) => {
          sent.push(input.to);
          return true;
        },
      },
      actor,
      { id: signup?.id },
    );

    expect(created).toMatchObject({
      slug: "luna-set",
      email: "luna@example.com",
      name: "Luna Set",
      emailed: true,
    });
    expect(created.password.length).toBeGreaterThan(8);
    expect(sent).toEqual(["luna@example.com"]);
    await expect(waitlist.findById(signup!.id)).resolves.toMatchObject({
      status: "onboarded",
    });
    const tenant = (await tenants.list()).find((item) => item.slug === "luna-set");
    expect(tenant?.themeConfig).toMatchObject({
      email: "luna@example.com",
      city: "San José",
      phone: "88880000",
      links: { instagram: "https://instagram.com/lunaset" },
    });
  });
});
