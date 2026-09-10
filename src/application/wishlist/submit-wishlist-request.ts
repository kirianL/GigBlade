import { validationError } from "@/domain/errors";
import type { TenantContext } from "@/domain/tenant";
import {
  isEventDateAllowed,
  normalizeWishlistInput,
  wishlistRequestInputSchema,
  type SubmitWishlistResult,
  type WishlistRequestInput,
} from "@/domain/wishlist";
import type { WishlistRequestRepository } from "@/application/ports/wishlist-request-repository";

const DUPLICATE_WINDOW_MS = 24 * 60 * 60 * 1000;

export async function submitWishlistRequest(
  repository: WishlistRequestRepository,
  context: TenantContext,
  rawInput: unknown,
): Promise<SubmitWishlistResult> {
  const parsed = wishlistRequestInputSchema.safeParse(rawInput);

  if (!parsed.success) {
    throw validationError("Revisá los datos de la solicitud");
  }

  const input = normalizeWishlistInput(parsed.data as WishlistRequestInput);

  if (!isEventDateAllowed(input.eventDate)) {
    throw validationError("La fecha del evento ya pasó");
  }

  if (input.isHoneypot) {
    return { id: crypto.randomUUID(), duplicate: false };
  }

  const existing = await repository.findRecentByEmail(
    context.tenantId,
    input.email,
  );

  if (existing) {
    const age = Date.now() - Date.parse(existing.createdAt);

    if (Number.isFinite(age) && age < DUPLICATE_WINDOW_MS) {
      return { id: existing.id, duplicate: true };
    }
  }

  const created = await repository.create({
    tenantId: context.tenantId,
    name: input.name,
    email: input.email,
    eventType: input.eventType,
    city: input.city,
    eventDate: input.eventDate,
    note: input.note,
  });

  return { id: created.id, duplicate: false };
}
