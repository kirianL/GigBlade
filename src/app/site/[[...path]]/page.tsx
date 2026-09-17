import { notFound } from "next/navigation";

import { loadTenantSite } from "@/lib/tenant/load-site";
import { getSiteTemplateRenderer } from "@/lib/tenant/templates/registry";

export const dynamic = "force-dynamic";

type SitePageParams = Promise<{ path?: string[] }>;

export default async function TenantSitePage({
  params,
}: {
  params: SitePageParams;
}) {
  const { path } = await params;
  if (path && path.length > 0) {
    notFound();
  }

  const site = await loadTenantSite();
  const Template = getSiteTemplateRenderer(site.templateId);

  return <Template site={site} />;
}
