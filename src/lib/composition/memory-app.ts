import { getPublicTenant } from "@/application/tenants/get-public-tenant";
import { resolveTenantRouting } from "@/application/tenants/resolve-tenant-routing";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { submitWishlistRequest } from "@/application/wishlist/submit-wishlist-request";
import { createTenantRouting, type Tenant } from "@/domain/tenant";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";
import { InMemoryWishlistRepository } from "@/infrastructure/memory/in-memory-wishlist-repository";

export const MEMORY_TENANT_ID = "11111111-1111-4111-8111-111111111111";

export const memoryDemoTenant: Tenant = {
  id: MEMORY_TENANT_ID,
  slug: "demo",
  plan: "all_inclusive",
  themeConfig: {
    displayName: "Nox",
    tagline: "Sets nocturnos para pistas que no cierran",
    city: "San José",
  },
  status: "active",
};

export function createMemoryApp() {
  const tenants = new InMemoryTenantRepository([memoryDemoTenant]);
  const routing = new InMemoryTenantRoutingStore([
    ["localhost", createTenantRouting(memoryDemoTenant, "localhost")],
  ]);
  const wishlist = new InMemoryWishlistRepository();
  const waitlist = new InMemoryWaitlistRepository();

  return {
    tenants,
    routing,
    getPublicTenant: (context: Parameters<typeof getPublicTenant>[1]) =>
      getPublicTenant(tenants, context),
    resolveTenantRouting: (hostname: string) =>
      resolveTenantRouting(routing, hostname),
    submitWishlistRequest: (
      context: Parameters<typeof submitWishlistRequest>[1],
      input: unknown,
    ) => submitWishlistRequest(wishlist, context, input),
    joinWaitlist: (input: unknown) => joinWaitlist(waitlist, input),
  };
}
