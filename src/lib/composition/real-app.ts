import { getPublicTenant } from "@/application/tenants/get-public-tenant";
import { resolveTenantRouting } from "@/application/tenants/resolve-tenant-routing";
import { updateTenantSiteContent } from "@/application/tenants/update-tenant-site-content";
import { listPlatformSites } from "@/application/sites/list-platform-sites";
import {
  getSiteVisitStats,
  recordSiteVisit,
} from "@/application/sites/record-site-visit";
import { generateDjPassword } from "@/application/panel/generate-dj-password";
import { deleteDj } from "@/application/panel/delete-dj";
import { loginPanel, readPanelSession } from "@/application/panel/login-panel";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { CloudflareRegistrar } from "@/infrastructure/cloudflare/registrar";
import { CloudflareWebAnalytics } from "@/infrastructure/cloudflare/web-analytics";
import { EdgeConfigRoutingStore } from "@/infrastructure/edge-config/edge-config-routing-store";
import { SupabasePanelAuthStore } from "@/infrastructure/supabase/panel-auth-store";
import { SupabaseSiteVisitStore } from "@/infrastructure/supabase/site-visit-store";
import { SupabaseTenantRepository } from "@/infrastructure/supabase/tenant-repository";
import { SupabaseTenantRoutingStore } from "@/infrastructure/supabase/tenant-routing-store";
import { SupabaseWaitlistRepository } from "@/infrastructure/supabase/waitlist-repository";
import { VercelEdgeConfigWriter } from "@/infrastructure/vercel/edge-config-writer";
import { VercelProjectDomains } from "@/infrastructure/vercel/project-domains";
import { deleteSiteMedia } from "@/infrastructure/site-media";

export function createRealApp() {
  const tenants = new SupabaseTenantRepository();
  const domainRouting = new SupabaseTenantRoutingStore();
  const edgeRouting = new EdgeConfigRoutingStore();
  const waitlist = new SupabaseWaitlistRepository();
  const visits = new SupabaseSiteVisitStore();
  const panelAuth = new SupabasePanelAuthStore(
    process.env.GIGBLADE_PANEL_PASSWORD?.trim() || "gigblade",
  );
  const edgeConfigWriter = new VercelEdgeConfigWriter();

  return {
    tenants,
    routing: domainRouting,
    edgeConfigWriter,
    registrar: new CloudflareRegistrar(),
    siteAnalytics: new CloudflareWebAnalytics(),
    projectDomains: new VercelProjectDomains(),
    visits,
    panelAuth,
    getPublicTenant: (context: Parameters<typeof getPublicTenant>[1]) =>
      getPublicTenant(tenants, context),
    updateTenantSiteContent: (
      context: Parameters<typeof updateTenantSiteContent>[1],
      input: unknown,
    ) => updateTenantSiteContent(tenants, context, input),
    resolveTenantRouting: async (hostname: string) => {
      const fromDb = await resolveTenantRouting(domainRouting, hostname);
      if (fromDb) return fromDb;
      // Edge Config sigue disponible como cache/legacy si un dominio
      // todavía no fue migrado a tenant_domains.
      return resolveTenantRouting(edgeRouting, hostname);
    },
    recordSiteVisit: (
      context: Parameters<typeof recordSiteVisit>[1],
      visitorKey: string,
    ) => recordSiteVisit(visits, context, visitorKey),
    getSiteVisitStats: (context: Parameters<typeof getSiteVisitStats>[1]) =>
      getSiteVisitStats(visits, context),
    listPlatformSites: () =>
      listPlatformSites(tenants, domainRouting, visits, panelAuth),
    loginPanel: (input: unknown) => {
      const body = (input ?? {}) as { email: unknown; password: unknown };
      return loginPanel(panelAuth, body);
    },
    readPanelSession: (token: string) => readPanelSession(panelAuth, token),
    generateDjPassword: (
      actor: Parameters<typeof generateDjPassword>[2],
      input: unknown,
    ) => {
      const body = (input ?? {}) as {
        slug: unknown;
        email: unknown;
        name: unknown;
      };
      return generateDjPassword(panelAuth, tenants, actor, body);
    },
    deleteDj: (
      actor: Parameters<typeof deleteDj>[1],
      input: unknown,
    ) => {
      const body = (input ?? {}) as { slug: unknown };
      return deleteDj(
        {
          tenants,
          routing: domainRouting,
          visits,
          panelAuth,
          deleteMedia: (slug) => deleteSiteMedia(slug, "real"),
          deleteRoutingCache: (hostname) =>
            edgeConfigWriter.deleteTenantRouting(hostname),
        },
        actor,
        body,
      );
    },
    joinWaitlist: (input: unknown) => joinWaitlist(waitlist, input),
  };
}
