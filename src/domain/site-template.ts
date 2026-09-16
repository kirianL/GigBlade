import { notFound } from "@/domain/errors";

export const SITE_TEMPLATE_IDS = ["pista", "festival", "after"] as const;

export type SiteTemplateId = (typeof SITE_TEMPLATE_IDS)[number];

export const DEFAULT_SITE_TEMPLATE_ID: SiteTemplateId = "pista";

const TEMPLATE_IDS = new Set<string>(SITE_TEMPLATE_IDS);

export function isSiteTemplateId(value: string): value is SiteTemplateId {
  return TEMPLATE_IDS.has(value);
}

export function assertRegisteredTemplate(value: string): SiteTemplateId {
  if (!isSiteTemplateId(value)) {
    throw notFound("Plantilla no disponible");
  }

  return value;
}
