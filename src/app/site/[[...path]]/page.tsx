import { loadTenantSite } from "@/lib/tenant/load-site";
import { getSiteTemplateRenderer } from "@/lib/tenant/templates/registry";

export const dynamic = "force-dynamic";

export default async function TenantSitePage() {
  const site = await loadTenantSite();
  const Template = getSiteTemplateRenderer(site.templateId);

  return <Template site={site} />;
}
