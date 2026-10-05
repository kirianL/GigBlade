import type { WaitlistDraft, WaitlistSignup } from "@/domain/waitlist";

export interface WaitlistRepository {
  findByEmail(email: string): Promise<WaitlistSignup | null>;
  insert(draft: WaitlistDraft): Promise<WaitlistSignup>;
  list(): Promise<WaitlistSignup[]>;
  findById(id: string): Promise<WaitlistSignup | null>;
  markOnboarded(id: string): Promise<boolean>;
  deleteById(id: string): Promise<boolean>;
}
