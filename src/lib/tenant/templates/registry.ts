import type { SiteTemplateId } from "@/domain/site-template";
import AfterSite from "@/lib/tenant/templates/after";
import FestivalSite from "@/lib/tenant/templates/festival";
import PistaSite from "@/lib/tenant/templates/pista";
import type { SiteTemplateRenderer } from "@/lib/tenant/templates/types";

const renderers: Record<SiteTemplateId, SiteTemplateRenderer> = {
  pista: PistaSite,
  festival: FestivalSite,
  after: AfterSite,
};

export function getSiteTemplateRenderer(templateId: SiteTemplateId) {
  return renderers[templateId];
}
