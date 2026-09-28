import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import type { WaitlistSignup } from "@/domain/waitlist";

export async function listWaitlist(
  waitlist: WaitlistRepository,
): Promise<WaitlistSignup[]> {
  return waitlist.list();
}
