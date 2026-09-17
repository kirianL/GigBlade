import type { Metadata } from "next";
import { Oswald } from "next/font/google";
import type { ReactNode } from "react";

import { loadTenantSite } from "@/lib/tenant/load-site";
import "@/lib/tenant/templates/site.css";

export const dynamic = "force-dynamic";

const display = Oswald({
  subsets: ["latin"],
  variable: "--font-site-display",
  display: "optional",
});

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
  return <div className={`${display.variable} min-h-full`}>{children}</div>;
}
