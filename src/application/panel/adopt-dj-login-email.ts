import type { PanelAuthStore } from "@/application/ports/panel-auth-store";
import { conflict, forbidden } from "@/domain/errors";
import {
  assertPanelEmail,
  PLATFORM_EMAIL,
} from "@/domain/panel-auth";

export async function adoptDjLoginEmail(
  store: PanelAuthStore,
  slug: string,
  email: string,
): Promise<string> {
  const next = assertPanelEmail(email);
  if (next === PLATFORM_EMAIL) {
    throw forbidden("Ese correo pertenece a la plataforma.");
  }

  const accounts = await store.listAccounts();
  const current = accounts.find(
    (account) => account.role === "dj" && account.slug === slug,
  );
  if (!current || current.email === next) return next;

  const taken = accounts.find((account) => account.email === next);
  if (taken && taken.slug !== slug) {
    if (taken.role === "platform") {
      throw forbidden("Ese correo pertenece a la plataforma.");
    }
    throw conflict("Ese correo ya tiene una página.");
  }

  await store.renameAccountEmail(current.email, next);
  return next;
}
