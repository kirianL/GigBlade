import type { Metadata } from "next";
import type { ReactNode } from "react";

import { loadTenantSite } from "@/lib/tenant/load-site";

export const dynamic = "force-dynamic";

type SiteLayoutProps = Readonly<{
  children: ReactNode;
}>;

export async function generateMetadata(): Promise<Metadata> {
  const site = await loadTenantSite();

  return {
    title: site.profile.displayName,
    description: site.profile.tagline,
    applicationName: site.profile.displayName,
    robots: { index: true, follow: true },
  };
}

export default function TenantSiteLayout({ children }: SiteLayoutProps) {
  return children;
}
