import type { WaitlistRepository } from "@/application/ports/waitlist-repository";
import type { WaitlistDraft, WaitlistSignup } from "@/domain/waitlist";

export class InMemoryWaitlistRepository implements WaitlistRepository {
  private readonly byEmail = new Map<string, WaitlistSignup>();

  async findByEmail(email: string): Promise<WaitlistSignup | null> {
    return this.byEmail.get(email.toLowerCase()) ?? null;
  }

  async insert(draft: WaitlistDraft): Promise<WaitlistSignup> {
    const signup: WaitlistSignup = {
      ...draft,
      id: crypto.randomUUID(),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.byEmail.set(draft.email, signup);
    return signup;
  }
}
