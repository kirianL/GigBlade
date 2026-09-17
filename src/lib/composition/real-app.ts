import { getPublicTenant } from "@/application/tenants/get-public-tenant";
import { resolveTenantRouting } from "@/application/tenants/resolve-tenant-routing";
import { updateTenantSiteContent } from "@/application/tenants/update-tenant-site-content";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { listWishlistRequests } from "@/application/wishlist/list-wishlist-requests";
import { submitWishlistRequest } from "@/application/wishlist/submit-wishlist-request";
import { CloudflareRegistrar } from "@/infrastructure/cloudflare/registrar";
import { EdgeConfigRoutingStore } from "@/infrastructure/edge-config/edge-config-routing-store";
import { InMemoryWishlistRepository } from "@/infrastructure/memory/in-memory-wishlist-repository";
import { SupabaseTenantRepository } from "@/infrastructure/supabase/tenant-repository";
import { SupabaseWaitlistRepository } from "@/infrastructure/supabase/waitlist-repository";
import { VercelEdgeConfigWriter } from "@/infrastructure/vercel/edge-config-writer";
import { VercelProjectDomains } from "@/infrastructure/vercel/project-domains";

export function createRealApp() {
  const tenants = new SupabaseTenantRepository();
  const routing = new EdgeConfigRoutingStore();
  // Persistencia SQL de solicitudes queda fuera de alcance; el form funciona
  // con un store efímero hasta la migración de bookings.
  const wishlist = new InMemoryWishlistRepository();
  const waitlist = new SupabaseWaitlistRepository();

  return {
    tenants,
    routing,
    edgeConfigWriter: new VercelEdgeConfigWriter(),
    registrar: new CloudflareRegistrar(),
    projectDomains: new VercelProjectDomains(),
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
