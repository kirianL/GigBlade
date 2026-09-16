import type { SiteTemplateId } from "@/domain/site-template";

import PlaceholderSite from "@/lib/tenant/templates/placeholder";

const renderers: Record<SiteTemplateId, typeof PlaceholderSite> = {
  pista: PlaceholderSite,
  festival: PlaceholderSite,
  after: PlaceholderSite,
};

export function getSiteTemplateRenderer(templateId: SiteTemplateId) {
  return renderers[templateId];
}
