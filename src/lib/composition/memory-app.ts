import { join } from "node:path";

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
import { createTenantRouting, type Tenant } from "@/domain/tenant";
import { InMemoryPanelAuthStore } from "@/infrastructure/memory/in-memory-panel-auth-store";
import { InMemorySiteVisitStore } from "@/infrastructure/memory/in-memory-site-visit-store";
import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import { InMemoryTenantRoutingStore } from "@/infrastructure/memory/in-memory-tenant-routing-store";
import { InMemoryWaitlistRepository } from "@/infrastructure/memory/in-memory-waitlist-repository";
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
    mixes: seed.mixes,
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
  const waitlist = new InMemoryWaitlistRepository();
  const visits = new InMemorySiteVisitStore(
    join(process.cwd(), ".next", "memory-site-visits.json"),
  );
  const panelAuth = new InMemoryPanelAuthStore(
    join(process.cwd(), ".next", "memory-panel-auth.json"),
    process.env.GIGBLADE_PANEL_PASSWORD?.trim() || "gigblade",
  );

  return {
    tenants,
    routing,
    visits,
    panelAuth,
    getPublicTenant: (context: Parameters<typeof getPublicTenant>[1]) =>
      getPublicTenant(tenants, context),
    updateTenantSiteContent: (
      context: Parameters<typeof updateTenantSiteContent>[1],
      input: unknown,
    ) => updateTenantSiteContent(tenants, context, input),
    resolveTenantRouting: (hostname: string) =>
      resolveTenantRouting(routing, hostname),
    recordSiteVisit: (
      context: Parameters<typeof recordSiteVisit>[1],
      visitorKey: string,
    ) => recordSiteVisit(visits, context, visitorKey),
    getSiteVisitStats: (context: Parameters<typeof getSiteVisitStats>[1]) =>
      getSiteVisitStats(visits, context),
    listPlatformSites: () => listPlatformSites(tenants, routing, visits, panelAuth),
    auditPlatformSites: () => auditPlatformSites(tenants, routing, panelAuth),
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
      return createDj({ tenants, routing, panelAuth }, actor, body);
    },
    deleteDj: (
      actor: Parameters<typeof deleteDj>[1],
      input: unknown,
    ) => {
      const body = (input ?? {}) as { slug: unknown };
      return deleteDj(
        {
          tenants,
          routing,
          visits,
          panelAuth,
        },
        actor,
        body,
      );
    },
    joinWaitlist: (input: unknown) => joinWaitlist(waitlist, input),
  };
}
