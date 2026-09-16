import type { WishlistRequest } from "@/domain/wishlist";
import type { WishlistRequestRepository } from "@/application/ports/wishlist-request-repository";

export async function listWishlistRequests(
  repository: WishlistRequestRepository,
  tenantId?: string,
): Promise<WishlistRequest[]> {
  if (tenantId) {
    return repository.listByTenant(tenantId);
  }

  return repository.listAll();
}
