import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { TenantSite } from "@/application/sites/resolve-tenant-site";
import {
  SITE_TEMPLATE_APPEARANCE,
  SITE_TEMPLATE_IDS,
  SITE_TEMPLATE_SECTIONS,
  type SiteTemplateId,
} from "@/domain/site-template";
import { getSiteTemplateRenderer } from "@/lib/tenant/templates/registry";

function siteFor(templateId: SiteTemplateId): TenantSite {
  return {
    slug: "nox",
    domain: "demo.localhost",
    templateId,
    appearance: SITE_TEMPLATE_APPEARANCE[templateId],
    profile: {
      displayName: "Nox",
      tagline: "Sets nocturnos",
      city: "San José",
      bio: "Resident en clubes de la ciudad.",
      links: {
        instagram: "https://instagram.com/nox",
        spotify: "https://open.spotify.com/artist/nox",
        soundcloud: "https://soundcloud.com/nox",
      },
    },
  };
}

function sectionOrder(html: string): string[] {
  return [...html.matchAll(/data-section="([^"]+)"/g)].map((match) => match[1]);
}

describe("site template registry", () => {
  it.each(SITE_TEMPLATE_IDS)(
    "renderiza %s con su orden de secciones y sin cruzar plantilla",
    (templateId) => {
      const Renderer = getSiteTemplateRenderer(templateId);
      const html = renderToStaticMarkup(
        createElement(Renderer, { site: siteFor(templateId) }),
      );

      expect(html).toContain(`data-template="${templateId}"`);
      expect(html).toContain(
        `data-appearance="${SITE_TEMPLATE_APPEARANCE[templateId]}"`,
      );
      expect(sectionOrder(html)).toEqual(SITE_TEMPLATE_SECTIONS[templateId]);
      expect(html).toContain("Nox");
      expect(html).toContain("Sets nocturnos");
      expect(html).toContain("San José");
      expect(html).toContain("Resident en clubes de la ciudad.");
      expect(html).toContain("https://instagram.com/nox");
      expect(html).toContain("https://open.spotify.com/artist/nox");
      expect(html).toContain("https://soundcloud.com/nox");
    },
  );

  it("aplica el color de marca en el shell", () => {
    const site = siteFor("after");
    site.profile.brandColor = "#1d4ed8";
    const Renderer = getSiteTemplateRenderer("after");
    const html = renderToStaticMarkup(createElement(Renderer, { site }));

    expect(html).toContain("#1d4ed8");
    expect(html).toContain("--site-bg");
  });
});
