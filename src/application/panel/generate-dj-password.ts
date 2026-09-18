import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import { forbidden, notFound } from "@/domain/errors";
import {
  assertPanelEmail,
  generatePanelPassword,
  hashPassword,
  publicPanelUser,
  requirePlatform,
  type PanelPublicUser,
} from "@/domain/panel-auth";
import { normalizeSlug } from "@/domain/tenant";

export async function generateDjPassword(
  store: PanelAuthStore,
  tenants: TenantRepository,
  actor: PanelPublicUser,
  input: { slug: unknown; email: unknown; name: unknown },
) {
  requirePlatform(actor);

  const slug = normalizeSlug(String(input.slug ?? ""));
  const tenant = (await tenants.list()).find((item) => item.slug === slug);
  if (!tenant) throw notFound("No encontramos esa página.");

  const email = assertPanelEmail(String(input.email ?? ""));
  const existing = await store.findAccount(email);
  if (existing?.role === "platform") {
    throw forbidden("Ese correo pertenece a la plataforma.");
  }

  const password = generatePanelPassword();
  const name =
    String(input.name ?? "").trim() ||
    existing?.name ||
    slug;

  await store.upsertAccount({
    email,
    name,
    role: "dj",
    slug,
    passwordHash: hashPassword(password),
    passwordSetAt: new Date().toISOString(),
  });
  await store.deleteSessionsForEmail(email);

  return {
    email,
    name,
    slug,
    password,
    user: publicPanelUser({
      email,
      name,
      role: "dj",
      slug,
      passwordHash: "",
      passwordSetAt: new Date().toISOString(),
    }),
  };
}
