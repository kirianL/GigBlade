import { getPublicTenant } from "@/application/tenants/get-public-tenant";
import { resolveTenantRouting } from "@/application/tenants/resolve-tenant-routing";
import { updateTenantSiteContent } from "@/application/tenants/update-tenant-site-content";
import { auditPlatformSites } from "@/application/sites/audit-platform-sites";
import { listPlatformSites } from "@/application/sites/list-platform-sites";
import {
  getSiteVisitStats,
  recordSiteVisit,
} from "@/application/sites/record-site-visit";
import { generateDjPassword } from "@/application/panel/generate-dj-password";
import { createDj } from "@/application/panel/create-dj";
import { deleteDj } from "@/application/panel/delete-dj";
import { loginPanel, readPanelSession } from "@/application/panel/login-panel";
import { joinWaitlist } from "@/application/waitlist/join-waitlist";
import { listWaitlist } from "@/application/waitlist/list-waitlist";
import { onboardWaitlistSignup } from "@/application/waitlist/onboard-waitlist";
import { removeWaitlistSignup } from "@/application/waitlist/remove-waitlist";
import { sendDjAccessEmail } from "@/infrastructure/mail/send-dj-access-email";
import { CloudflareRegistrar } from "@/infrastructure/cloudflare/registrar";
import { CloudflareWebAnalytics } from "@/infrastructure/cloudflare/web-analytics";
import { EdgeConfigRoutingStore } from "@/infrastructure/edge-config/edge-config-routing-store";
import { createBooking } from "@/application/bookings/create-booking";
import { listTenantBookings } from "@/application/bookings/list-tenant-bookings";
import { updateBookingStatus } from "@/application/bookings/update-booking-status";
import { SupabaseBookingRepository } from "@/infrastructure/supabase/booking-repository";
import { SupabasePanelAuthStore } from "@/infrastructure/supabase/panel-auth-store";
import { SupabaseReferralRepository } from "@/infrastructure/supabase/supabase-referral-repository";
import { SupabaseSiteVisitStore } from "@/infrastructure/supabase/site-visit-store";
import { SupabaseTenantRepository } from "@/infrastructure/supabase/tenant-repository";
import { SupabaseTenantRoutingStore } from "@/infrastructure/supabase/tenant-routing-store";
import { SupabaseWaitlistRepository } from "@/infrastructure/supabase/waitlist-repository";
import { VercelEdgeConfigWriter } from "@/infrastructure/vercel/edge-config-writer";
import { VercelProjectDomains } from "@/infrastructure/vercel/project-domains";
import { deleteSiteMedia } from "@/infrastructure/site-media";
import { assignPlatformDomain } from "@/application/domains/assign-platform-domain";
import { listPlatformDomains } from "@/application/domains/list-platform-domains";
import { removePlatformDomain } from "@/application/domains/remove-platform-domain";
import { verifyPlatformDomain } from "@/application/domains/verify-platform-domain";

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
  const bookings = new SupabaseBookingRepository();
  const projectDomains = new VercelProjectDomains();
  const referrals = new SupabaseReferralRepository();

  return {
    tenants,
    routing: domainRouting,
    edgeConfigWriter,
    registrar: new CloudflareRegistrar(),
    siteAnalytics: new CloudflareWebAnalytics(),
    projectDomains,
    visits,
    panelAuth,
    bookings,
    referrals,
    listAffiliates: () => referrals.listAffiliates(),
    createAffiliate: (input: Parameters<typeof referrals.createAffiliate>[0]) =>
      referrals.createAffiliate(input),
    updateAffiliate: (
      id: string,
      input: Parameters<typeof referrals.updateAffiliate>[1],
    ) => referrals.updateAffiliate(id, input),
    getReferralSettings: () => referrals.getSettings(),
    updateReferralSettings: (
      input: Parameters<typeof referrals.updateSettings>[0],
    ) => referrals.updateSettings(input),
    listReferralConversions: (affiliateId?: string) =>
      referrals.listConversions(affiliateId),
    recordReferralConversion: (
      input: Parameters<typeof referrals.recordConversion>[0],
    ) => referrals.recordConversion(input),
    recordReferralPayout: (input: Parameters<typeof referrals.recordPayout>[0]) =>
      referrals.recordPayout(input),
    listReferralPayouts: (affiliateId?: string) =>
      referrals.listPayouts(affiliateId),
    createBooking: (
      context: Parameters<typeof createBooking>[1],
      input: unknown,
      remoteIp?: string | null,
    ) => createBooking(bookings, context, input, remoteIp),
    listTenantBookings: (context: Parameters<typeof listTenantBookings>[1]) =>
      listTenantBookings(bookings, context),
    updateBookingStatus: (
      context: Parameters<typeof updateBookingStatus>[1],
      bookingId: string,
      status: unknown,
    ) => updateBookingStatus(bookings, context, bookingId, status),
    getPublicTenant: (context: Parameters<typeof getPublicTenant>[1]) =>
      getPublicTenant(tenants, context),
    updateTenantSiteContent: (
      context: Parameters<typeof updateTenantSiteContent>[1],
      input: unknown,
    ) => updateTenantSiteContent(tenants, context, input, panelAuth),
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
    auditPlatformSites: () =>
      auditPlatformSites(tenants, domainRouting, panelAuth),
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
    createDj: (
      actor: Parameters<typeof createDj>[1],
      input: unknown,
    ) => {
      const body = (input ?? {}) as {
        name: unknown;
        email: unknown;
        slug: unknown;
      };
      return createDj(
        { tenants, routing: domainRouting, panelAuth },
        actor,
        body,
      );
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
    joinWaitlist: (input: unknown) => joinWaitlist(waitlist, input, referrals),
    listWaitlist: () => listWaitlist(waitlist),
    removeWaitlist: (
      actor: Parameters<typeof removeWaitlistSignup>[1],
      input: { id: unknown },
    ) => removeWaitlistSignup(waitlist, actor, input),
    listPlatformDomains: () =>
      listPlatformDomains(tenants, domainRouting, projectDomains),
    assignPlatformDomain: (input: unknown) =>
      assignPlatformDomain(
        tenants,
        domainRouting,
        projectDomains,
        input,
        edgeConfigWriter,
      ),
    verifyPlatformDomain: (domain: string) =>
      verifyPlatformDomain(
        tenants,
        domainRouting,
        projectDomains,
        domain,
        edgeConfigWriter,
      ),
    removePlatformDomain: (domain: string, slug?: string) =>
      removePlatformDomain(
        tenants,
        domainRouting,
        domain,
        slug,
        edgeConfigWriter,
      ),
    onboardWaitlist: (
      actor: Parameters<typeof onboardWaitlistSignup>[1],
      input: { id: unknown },
    ) =>
      onboardWaitlistSignup(
        {
          waitlist,
          tenants,
          routing: domainRouting,
          panelAuth,
          sendAccessEmail: sendDjAccessEmail,
        },
        actor,
        input,
      ),
  };
}
