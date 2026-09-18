import { describe, expect, it } from "vitest";

import { generateDjPassword } from "@/application/panel/generate-dj-password";
import { loginPanel, readPanelSession } from "@/application/panel/login-panel";
import type { Tenant } from "@/domain/tenant";
import {
  generatePanelPassword,
  hashPassword,
  verifyPassword,
} from "@/domain/panel-auth";
import { InMemoryPanelAuthStore } from "@/infrastructure/memory/in-memory-panel-auth-store";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "nox",
  plan: "all_inclusive",
  templateId: "after",
  themeConfig: { displayName: "Kiluzie" },
  status: "active",
};

describe("panel auth", () => {
  it("verifica la contraseña hasheada", () => {
    const stored = hashPassword("gigblade-demo");
    expect(verifyPassword("gigblade-demo", stored)).toBe(true);
    expect(verifyPassword("otra", stored)).toBe(false);
  });

  it("genera una contraseña usable", () => {
    const password = generatePanelPassword();
    expect(password).toHaveLength(12);
    expect(password).toMatch(/^[A-Za-z0-9]+$/);
  });

  it("deja entrar a la plataforma con la contraseña inicial", async () => {
    const store = new InMemoryPanelAuthStore(undefined, "clave-local");
    const session = await loginPanel(store, {
      email: "hola@gigblade.com",
      password: "clave-local",
    });

    expect(session.user.role).toBe("platform");
    await expect(readPanelSession(store, session.token)).resolves.toMatchObject({
      email: "hola@gigblade.com",
      role: "platform",
    });
  });

  it("genera una contraseña para el DJ y esa es la que entra", async () => {
    const store = new InMemoryPanelAuthStore(undefined, "clave-local");
    const tenants = new InMemoryTenantRepository([tenant]);
    const platform = await loginPanel(store, {
      email: "hola@gigblade.com",
      password: "clave-local",
    });
    const actor = await readPanelSession(store, platform.token);

    const generated = await generateDjPassword(store, tenants, actor, {
      slug: "nox",
      email: "nox@gigblade.com",
      name: "Kiluzie",
    });

    expect(generated.password).toHaveLength(12);

    const dj = await loginPanel(store, {
      email: "nox@gigblade.com",
      password: generated.password,
    });
    expect(dj.user).toMatchObject({
      role: "dj",
      slug: "nox",
      email: "nox@gigblade.com",
    });

    const rotated = await generateDjPassword(store, tenants, actor, {
      slug: "nox",
      email: "nox@gigblade.com",
      name: "Kiluzie",
    });

    await expect(
      loginPanel(store, {
        email: "nox@gigblade.com",
        password: generated.password,
      }),
    ).rejects.toThrow("El correo o la contraseña no coinciden.");

    await expect(
      loginPanel(store, {
        email: "nox@gigblade.com",
        password: rotated.password,
      }),
    ).resolves.toMatchObject({ user: { slug: "nox" } });
  });
});
