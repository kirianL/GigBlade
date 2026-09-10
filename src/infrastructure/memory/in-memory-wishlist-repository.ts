import type {
  NewWishlistRequest,
  WishlistRequestRepository,
} from "@/application/ports/wishlist-request-repository";
import type { WishlistRequest } from "@/domain/wishlist";

export class InMemoryWishlistRepository implements WishlistRequestRepository {
  private readonly requests: WishlistRequest[] = [];

  async findRecentByEmail(
    tenantId: string,
    email: string,
  ): Promise<WishlistRequest | null> {
    const normalized = email.toLowerCase();
    const matches = this.requests.filter(
      (request) =>
        request.tenantId === tenantId && request.email === normalized,
    );

    return matches.at(-1) ?? null;
  }

  async create(input: NewWishlistRequest): Promise<WishlistRequest> {
    const request: WishlistRequest = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    this.requests.push(request);
    return request;
  }
}
