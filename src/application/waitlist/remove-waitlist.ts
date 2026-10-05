import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { notFound, validationError } from "@/domain/errors";
import { requirePlatform, type PanelPublicUser } from "@/domain/panel-auth";

const ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function removeWaitlistSignup(
  waitlist: WaitlistRepository,
  actor: PanelPublicUser,
  input: { id: unknown },
): Promise<{ id: string }> {
  requirePlatform(actor, "Solo la plataforma puede eliminar una solicitud.");

  const id = typeof input.id === "string" ? input.id.trim() : "";
  if (!ID_PATTERN.test(id)) {
    throw validationError("La solicitud no es válida");
  }

  const removed = await waitlist.deleteById(id);
  if (!removed) {
    throw notFound("No encontramos esa solicitud.");
  }

  return { id };
}
