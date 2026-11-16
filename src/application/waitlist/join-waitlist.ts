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
import { verifyTurnstileToken } from "@/infrastructure/cloudflare/turnstile";

const SLOT_CONFLICT_WINDOW_MS = 25 * 60 * 1000;

export async function joinWaitlist(
  waitlist: WaitlistRepository,
  rawInput: unknown,
  referrals?: ReferralRepository,
  remoteIp?: string | null,
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

  // Cloudflare Turnstile verification when Turnstile is active
  const turnstileConfigured = Boolean(
    process.env.TURNSTILE_SECRET_KEY?.trim() &&
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
  if (turnstileConfigured || draft.turnstileToken) {
    const turnstileCheck = await verifyTurnstileToken({
      token: draft.turnstileToken,
      remoteIp,
    });
    if (!turnstileCheck.success) {
      throw validationError(
        turnstileCheck.error ||
          "Validación de seguridad de Cloudflare fallida. Intentá de nuevo.",
      );
    }
  }

  const existing = await waitlist.findByEmail(draft.email);
  if (existing) {
    return existing.meetingAt
      ? { alreadyJoined: true, meetingAt: existing.meetingAt }
      : { alreadyJoined: true };
  }

  // Verify the selected meeting slot isn't already taken by another DJ
  if (draft.meetingAt) {
    const requestedTime = new Date(draft.meetingAt).getTime();
    if (!Number.isNaN(requestedTime)) {
      try {
        const currentList = await waitlist.list();
        const conflict = currentList.some((item) => {
          if (item.status === "declined" || !item.meetingAt) return false;
          const bookedTime = new Date(item.meetingAt).getTime();
          if (Number.isNaN(bookedTime)) return false;
          return Math.abs(bookedTime - requestedTime) < SLOT_CONFLICT_WINDOW_MS;
        });
        if (conflict) {
          throw validationError(
            "Ese horario acaba de ocuparse. Por favor elegí otra hora disponible.",
          );
        }
      } catch (err) {
        if (err && typeof err === "object" && "code" in err) {
          throw err;
        }
      }
    }
  }

  let inserted: WaitlistSignup | null = null;
  try {
    inserted = await waitlist.insert(draft);
  } catch {
    const raced = await waitlist.findByEmail(draft.email);
    if (raced) {
      return raced.meetingAt
        ? { alreadyJoined: true, meetingAt: raced.meetingAt }
        : { alreadyJoined: true };
    }
    throw serviceUnavailable("No se pudo guardar la inscripción");
  }

  void referrals;
  const resolvedMeetingAt = inserted?.meetingAt ?? draft.meetingAt ?? null;
  return resolvedMeetingAt
    ? { alreadyJoined: false, meetingAt: resolvedMeetingAt }
    : { alreadyJoined: false };
}
