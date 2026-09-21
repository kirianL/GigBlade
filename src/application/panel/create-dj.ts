import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import { generateDjPassword } from "@/application/panel/generate-dj-password";
import { conflict, validationError } from "@/domain/errors";
import {
  assertPanelEmail,
  requirePlatform,
  type PanelPublicUser,
} from "@/domain/panel-auth";
import { DEFAULT_SITE_TEMPLATE_ID } from "@/domain/site-template";
import {
  assertValidSlug,
  createTenantRouting,
} from "@/domain/tenant";

const RESERVED_SLUGS = new Set([
  "www",
  "api",
  "admin",
  "app",
  "panel",
  "studio",
  "health",
  "settings",
  "login",
  "overview",
  "djs",
]);

function assertDjName(value: string): string {
  const name = value.trim().replace(/\s+/g, " ");
  if (name.length < 2 || name.length > 80) {
    throw validationError("Escribí el nombre del DJ.");
  }
  return name;
}

function previewHostname(slug: string): string {
  return `${slug}.localhost`;
}

export async function createDj(
  deps: {
    tenants: TenantRepository;
    routing: TenantRoutingStore;
    panelAuth: PanelAuthStore;
  },
  actor: PanelPublicUser,
  input: { name: unknown; email: unknown; slug: unknown },
) {
  requirePlatform(actor, "Solo la plataforma puede agregar un DJ.");

  const name = assertDjName(String(input.name ?? ""));
  let slug: string;
  try {
    slug = assertValidSlug(String(input.slug ?? ""));
  } catch {
    throw validationError("El slug solo admite letras minúsculas, números y guiones.");
  }
  if (RESERVED_SLUGS.has(slug)) {
    throw validationError("Ese slug está reservado.");
  }
  const email = assertPanelEmail(String(input.email ?? ""));

  const [tenants, existingAccount, takenHost] = await Promise.all([
    deps.tenants.list(),
    deps.panelAuth.findAccount(email),
    deps.routing.get(previewHostname(slug)),
  ]);

  if (tenants.some((tenant) => tenant.slug === slug) || takenHost) {
    throw conflict("Ya hay un DJ con ese slug.");
  }
  if (existingAccount?.role === "platform") {
    throw conflict("Ese correo pertenece a la plataforma.");
  }
  if (existingAccount?.role === "dj" && existingAccount.slug) {
    throw conflict("Ese correo ya tiene una página.");
  }

  const tenant = await deps.tenants.create({
    slug,
    plan: "all_inclusive",
    templateId: DEFAULT_SITE_TEMPLATE_ID,
    themeConfig: { displayName: name },
    status: "active",
  });
  const hostname = previewHostname(slug);

  try {
    await deps.routing.put(hostname, createTenantRouting(tenant, hostname));
  } catch (error) {
    await deps.tenants.deleteById(tenant.id);
    throw error;
  }

  try {
    const access = await generateDjPassword(deps.panelAuth, deps.tenants, actor, {
      slug,
      email,
      name,
    });
    return {
      slug: access.slug,
      email: access.email,
      name: access.name,
      password: access.password,
      site: {
        slug,
        displayName: name,
        domain: "",
        preview: true,
        status: "active" as const,
        visits: 0,
        lastVisitedAt: null,
        email: access.email,
      },
    };
  } catch (error) {
    await deps.routing.deleteByTenantId(tenant.id);
    await deps.tenants.deleteById(tenant.id);
    throw error;
  }
}
