import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable, validationError } from "@/domain/errors";
import {
  isWaitlistDraft,
  normalizeWaitlistDraft,
  waitlistRequestSchema,
  type WaitlistJoinResult,
} from "@/domain/waitlist";

export async function joinWaitlist(
  waitlist: WaitlistRepository,
  rawInput: unknown,
): Promise<WaitlistJoinResult> {
  const parsed = waitlistRequestSchema.safeParse(
    rawInput && typeof rawInput === "object" ? rawInput : {},
  );
  if (!parsed.success) {
    throw validationError("La solicitud no es válida");
  }
  const draft = normalizeWaitlistDraft(parsed.data);

  if (!isWaitlistDraft(draft)) {
    return { alreadyJoined: false };
  }

  const existing = await waitlist.findByEmail(draft.email);
  if (existing) {
    return { alreadyJoined: true };
  }

  try {
    await waitlist.insert(draft);
  } catch {
    const raced = await waitlist.findByEmail(draft.email);
    if (raced) {
      return { alreadyJoined: true };
    }
    throw serviceUnavailable("No se pudo guardar la inscripción");
  }

  return { alreadyJoined: false };
}
