import type { WaitlistDraft, WaitlistSignup } from "@/domain/waitlist";

export interface WaitlistRepository {
  findByEmail(email: string): Promise<WaitlistSignup | null>;
  insert(draft: WaitlistDraft): Promise<WaitlistSignup>;
}
