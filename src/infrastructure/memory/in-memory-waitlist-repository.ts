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

  async list(): Promise<WaitlistSignup[]> {
    return [...this.byEmail.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async findById(id: string): Promise<WaitlistSignup | null> {
    for (const signup of this.byEmail.values()) {
      if (signup.id === id) return signup;
    }
    return null;
  }

  async markOnboarded(id: string): Promise<boolean> {
    for (const signup of this.byEmail.values()) {
      if (signup.id === id) {
        signup.status = "onboarded";
        return true;
      }
    }
    return false;
  }

  async deleteById(id: string): Promise<boolean> {
    for (const [email, signup] of this.byEmail) {
      if (signup.id === id) {
        this.byEmail.delete(email);
        return true;
      }
    }
    return false;
  }
}
