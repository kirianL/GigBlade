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
      events: [
        {
          date: "2026-11-14",
          venue: "Club Nox",
          location: "San José",
        },
      ],
      mixes: [
        {
          title: "After hours",
          url: "https://soundcloud.com/nox/after-hours",
          platform: "soundcloud",
        },
      ],
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
      expect(html).toContain('data-section="sets"');
      expect(html).not.toContain("<form");
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

  it("muestra el correo solo si el DJ lo cargó", () => {
    const site = siteFor("after");
    site.profile.email = "fechas@nox.cr";
    const Renderer = getSiteTemplateRenderer("after");
    const html = renderToStaticMarkup(createElement(Renderer, { site }));

    expect(html).toContain("mailto:fechas@nox.cr");
  });

  it("lista mixes públicos de YouTube y SoundCloud", () => {
    const site = siteFor("after");
    site.profile.mixes = [
      {
        title: "After hours 04",
        url: "https://soundcloud.com/nox/after-hours-04",
        platform: "soundcloud",
      },
    ];
    const Renderer = getSiteTemplateRenderer("after");
    const html = renderToStaticMarkup(createElement(Renderer, { site }));

    expect(html).toContain("After hours 04");
    expect(html).toContain("https://soundcloud.com/nox/after-hours-04");
    expect(html).toContain("SoundCloud");
  });

  it("oculta secciones vacías o desactivadas", () => {
    const site = siteFor("pista");
    site.profile.events = undefined;
    site.profile.mixes = undefined;
    site.profile.hiddenSections = ["bio"];
    const Renderer = getSiteTemplateRenderer("pista");
    const html = renderToStaticMarkup(createElement(Renderer, { site }));

    expect(sectionOrder(html)).toEqual(["intro", "enlaces", "contacto"]);
    expect(html).not.toContain("Próximamente");
    expect(html).not.toContain("Booking Abierto");
  });

  it("aplica el encuadre y habilita la galería ampliable con fotos reales", () => {
    const site = siteFor("festival");
    site.profile.photos = [
      "https://images.example.com/nox-hero.jpg",
      "https://images.example.com/nox-gallery.jpg",
    ];
    site.profile.heroPhoto = site.profile.photos[0];
    site.profile.heroPosition = "top";
    const Renderer = getSiteTemplateRenderer("festival");
    const html = renderToStaticMarkup(createElement(Renderer, { site }));
    const galleryStart = html.indexOf('data-component="gallery"');
    const galleryHtml = html.slice(
      galleryStart,
      html.indexOf("</section>", galleryStart),
    );

    expect(html).toContain("object-position:top");
    expect(html).toContain("<dialog");
    expect(html).toContain("Ampliar Nox, foto 1");
    expect(galleryHtml).not.toContain("nox-hero.jpg");
  });
});
