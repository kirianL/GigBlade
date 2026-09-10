import type { WishlistRequest } from "@/domain/wishlist";

export type NewWishlistRequest = Omit<WishlistRequest, "id" | "createdAt">;

export interface WishlistRequestRepository {
  findRecentByEmail(
    tenantId: string,
    email: string,
  ): Promise<WishlistRequest | null>;
  create(input: NewWishlistRequest): Promise<WishlistRequest>;
}
