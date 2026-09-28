import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { headers } from "next/headers";

import { normalizeHostname } from "@/domain/hostname";
import { loadTenantSite } from "@/lib/tenant/load-site";
import { buildTenantMetadata } from "@/lib/tenant/site-seo";
import { TENANT_HOSTNAME_HEADER } from "@/lib/tenant/headers";
import "@fontsource-variable/oswald";
import "@/lib/tenant/templates/site.css";

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

type SiteLayoutProps = Readonly<{
  children: ReactNode;
}>;

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadTenantSite();
  const requestHeaders = await headers();
  const requestHost = normalizeHostname(
    requestHeaders.get(TENANT_HOSTNAME_HEADER) ||
      requestHeaders.get("host") ||
      site.domain,
  );

  return buildTenantMetadata(site, requestHost, {
    blockIndexing: process.env.VERCEL_ENV === "preview",
  });
}

export default function TenantSiteLayout({ children }: SiteLayoutProps) {
  return <div className="min-h-full">{children}</div>;
}
