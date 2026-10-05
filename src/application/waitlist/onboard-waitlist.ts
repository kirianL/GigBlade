import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import type { TenantRepository } from "@/application/ports/tenant-repository";
import type { TenantRoutingStore } from "@/application/ports/tenant-routing-store";
import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { createDj } from "@/application/panel/create-dj";
import { conflict, notFound, validationError } from "@/domain/errors";
import { requirePlatform, type PanelPublicUser } from "@/domain/panel-auth";

function slugFromName(name: string): string {
  const slug = name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  if (!slug) throw validationError("Escribí el nombre del DJ.");
  return slug;
}

export async function onboardWaitlistSignup(
  deps: {
    waitlist: WaitlistRepository;
    tenants: TenantRepository;
    routing: TenantRoutingStore;
    panelAuth: PanelAuthStore;
    sendAccessEmail?: (input: {
      to: string;
      name: string;
      password: string;
    }) => Promise<boolean>;
  },
  actor: PanelPublicUser,
  input: { id: unknown },
) {
  requirePlatform(actor, "Solo la plataforma puede crear una página desde la lista.");

  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!id) throw validationError("Falta la solicitud.");

  const signup = await deps.waitlist.findById(id);
  if (!signup) throw notFound("No encontramos esa solicitud.");
  if (signup.status === "onboarded") {
    throw conflict("Esa solicitud ya tiene página.");
  }

  const created = await createDj(
    {
      tenants: deps.tenants,
      routing: deps.routing,
      panelAuth: deps.panelAuth,
    },
    actor,
    {
      name: signup.artistName,
      email: signup.email,
      slug: slugFromName(signup.artistName),
      city: signup.city,
      phone: signup.phone,
      instagram: signup.instagram,
    },
  );

  await deps.waitlist.markOnboarded(signup.id);

  let emailed = false;
  if (deps.sendAccessEmail) {
    try {
      emailed = await deps.sendAccessEmail({
        to: created.email,
        name: created.name,
        password: created.password,
      });
    } catch {
      emailed = false;
    }
  }

  return { ...created, emailed };
}
