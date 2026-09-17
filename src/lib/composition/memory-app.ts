import { join } from "node:path";

import { getPublicTenant } from "@/application/tenants/get-public-tenant";
import { resolveTenantRouting } from "@/application/tenants/resolve-tenant-routing";
import { updateTenantSiteContent } from "@/application/tenants/update-tenant-site-content";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { listWishlistRequests } from "@/application/wishlist/list-wishlist-requests";
import { submitWishlistRequest } from "@/application/wishlist/submit-wishlist-request";
import { createTenantRouting, type Tenant } from "@/domain/tenant";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";
import { InMemoryWishlistRepository } from "@/infrastructure/memory/in-memory-wishlist-repository";
import {
  MEMORY_DEMO_ROUTING,
  MEMORY_DEMO_SEEDS,
  MEMORY_TENANT_ID,
} from "@/lib/tenant/memory-demo-routing";

export const memoryDemoTenants: Tenant[] = MEMORY_DEMO_SEEDS.map((seed) => ({
  id: seed.id,
  slug: seed.slug,
  plan: "all_inclusive",
  templateId: seed.templateId,
  themeConfig: {
    displayName: seed.displayName,
    tagline: seed.tagline,
    city: seed.city,
    bio: seed.bio,
    links: seed.links,
    photos: seed.photos,
  },
  status: "active",
}));

export const memoryDemoTenant =
  memoryDemoTenants.find((tenant) => tenant.id === MEMORY_TENANT_ID) ??
  memoryDemoTenants[0];

export function createMemoryApp() {
  const tenants = new InMemoryTenantRepository(
    memoryDemoTenants,
    join(process.cwd(), ".next", "memory-tenants.json"),
  );
  const routing = new InMemoryTenantRoutingStore(
    Object.entries(MEMORY_DEMO_ROUTING).map(([hostname, entry]) => {
      const tenant = memoryDemoTenants.find((item) => item.id === entry.id);
      if (!tenant) {
        throw new Error(`Tenant de memoria ausente para ${hostname}`);
      }
      return [hostname, createTenantRouting(tenant, hostname)];
    }),
  );
  const wishlist = new InMemoryWishlistRepository();
  const waitlist = new InMemoryWaitlistRepository();

  return {
    tenants,
    routing,
    getPublicTenant: (context: Parameters<typeof getPublicTenant>[1]) =>
      getPublicTenant(tenants, context),
    updateTenantSiteContent: (
      context: Parameters<typeof updateTenantSiteContent>[1],
      input: unknown,
    ) => updateTenantSiteContent(tenants, context, input),
    resolveTenantRouting: (hostname: string) =>
      resolveTenantRouting(routing, hostname),
    submitWishlistRequest: (
      context: Parameters<typeof submitWishlistRequest>[1],
      input: unknown,
    ) => submitWishlistRequest(wishlist, context, input),
    listWishlistRequests: (tenantId?: string) =>
      listWishlistRequests(wishlist, tenantId),
    joinWaitlist: (input: unknown) => joinWaitlist(waitlist, input),
  };
}
