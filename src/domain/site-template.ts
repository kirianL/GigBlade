import { notFound } from "@/domain/errors";

export const SITE_TEMPLATE_IDS = ["pista", "festival", "after"] as const;

export type SiteTemplateId = (typeof SITE_TEMPLATE_IDS)[number];

export const SITE_TEMPLATE_APPEARANCES = ["light", "dark", "party"] as const;

export type SiteTemplateAppearance =
  (typeof SITE_TEMPLATE_APPEARANCES)[number];

export const SITE_SECTION_IDS = [
  "intro",
  "agenda",
  "bio",
  "enlaces",
  "sets",
  "contacto",
] as const;

export type SiteSectionId = (typeof SITE_SECTION_IDS)[number];

export const DEFAULT_SITE_TEMPLATE_ID: SiteTemplateId = "pista";

export const SITE_TEMPLATE_APPEARANCE: Record<
  SiteTemplateId,
  SiteTemplateAppearance
> = {
  pista: "light",
  festival: "dark",
  after: "party",
};

export const SITE_TEMPLATE_SECTIONS: Record<
  SiteTemplateId,
  readonly SiteSectionId[]
> = {
  pista: ["intro", "agenda", "bio", "enlaces", "sets", "contacto"],
  festival: ["intro", "bio", "agenda", "enlaces", "sets", "contacto"],
  after: ["intro", "enlaces", "sets", "contacto", "agenda", "bio"],
};

export function getSiteTemplateAppearance(
  templateId: SiteTemplateId,
): SiteTemplateAppearance {
  return SITE_TEMPLATE_APPEARANCE[templateId];
}

export function getSiteTemplateSections(
  templateId: SiteTemplateId,
): readonly SiteSectionId[] {
  return SITE_TEMPLATE_SECTIONS[templateId];
}

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
