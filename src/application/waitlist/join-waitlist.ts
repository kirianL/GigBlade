import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import { serviceUnavailable } from "@/domain/errors";
import {
  isWaitlistDraft,
  normalizeWaitlistDraft,
  type WaitlistJoinResult,
} from "@/domain/waitlist";

export async function joinWaitlist(
  waitlist: WaitlistRepository,
  rawInput: unknown,
): Promise<WaitlistJoinResult> {
  const input =
    rawInput && typeof rawInput === "object"
      ? (rawInput as Record<string, unknown>)
      : {};
  const draft = normalizeWaitlistDraft(input);

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
