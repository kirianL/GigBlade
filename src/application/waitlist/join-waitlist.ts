import type { ReferralRepository } from "@/application/ports/referral-repository";
import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable, validationError } from "@/domain/errors";
import {
  isWaitlistDraft,
  normalizeWaitlistDraft,
  waitlistRequestSchema,
  type WaitlistJoinResult,
  type WaitlistSignup,
} from "@/domain/waitlist";

export async function joinWaitlist(
  waitlist: WaitlistRepository,
  rawInput: unknown,
  referrals?: ReferralRepository,
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

  let inserted: WaitlistSignup | null = null;
  try {
    inserted = await waitlist.insert(draft);
  } catch {
    const raced = await waitlist.findByEmail(draft.email);
    if (raced) {
      return { alreadyJoined: true };
    }
    throw serviceUnavailable("No se pudo guardar la inscripción");
  }

  void inserted;
  void referrals;
  return { alreadyJoined: false };
}
