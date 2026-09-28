import { describe, expect, it } from "vitest";

import type { PublicTenant } from "@/domain/tenant";
import {
  buildTenantMetadata,
  platformSitemap,
  resolveIndexedHostname,
  tenantCanonicalRedirectUrl,
  tenantMetaDescription,
  tenantPageTitle,
  tenantShouldIndex,
  tenantStructuredData,
} from "@/lib/tenant/site-seo";

const site: PublicTenant = {
  slug: "marco",
  domain: "djmarco.com",
  templateId: "pista",
  appearance: "light",
  profile: {
    displayName: "DJ Marco",
    tagline: "Sets de club y after",
    city: "San José",
    bio: "Sets de club y after. Página lista para que las productoras te encuentren.",
    links: {
      instagram: "https://instagram.com/djmarco",
      spotify: "https://open.spotify.com/artist/marco",
    },
    photos: ["/sites/marco/hero.jpg"],
    events: [
      {
        date: "2026-11-02",
        venue: "Club 8",
        location: "San José",
        ticketUrl: "https://tickets.example/club8",
      },
    ],
  },
};

describe("SEO de sitios DJ", () => {
  it("arma un título propio, sin la marca de la plataforma", () => {
    expect(tenantPageTitle(site.profile)).toBe("DJ Marco en San José");
    expect(tenantPageTitle({ displayName: "Nox", city: "Heredia" })).toBe(
      "Nox | DJ en Heredia",
    );
  });

  it("describe al DJ con su ciudad y recorta textos largos", () => {
    expect(tenantMetaDescription(site.profile)).toContain("San José");
    expect(tenantMetaDescription(site.profile).length).toBeLessThanOrEqual(155);
  });

  it("no indexa previews ni alias, y sí el dominio canónico", () => {
    expect(
      tenantShouldIndex({
        requestHostname: "djmarco.com",
        canonicalHostname: "djmarco.com",
      }),
    ).toBe(true);
    expect(
      tenantShouldIndex({
        requestHostname: "marco.localhost",
        canonicalHostname: "marco.localhost",
      }),
    ).toBe(false);
    expect(
      tenantShouldIndex({
        requestHostname: "www.djmarco.com",
        canonicalHostname: "djmarco.com",
      }),
    ).toBe(false);
  });

  it("canonical y Open Graph apuntan al dominio del DJ", () => {
    const metadata = buildTenantMetadata(site, "djmarco.com");
    expect(metadata.title).toEqual({ absolute: "DJ Marco en San José" });
    expect(metadata.metadataBase).toEqual(new URL("https://djmarco.com"));
    expect(metadata.alternates).toEqual({ canonical: "https://djmarco.com" });
    expect(metadata.openGraph).toMatchObject({
      title: { absolute: "DJ Marco en San José" },
      url: "https://djmarco.com",
      siteName: "DJ Marco",
    });
  });

  it("publica Persona, enlaces y la fecha visible", () => {
    const data = tenantStructuredData(site);
    const graph = data["@graph"] as Array<Record<string, unknown>>;
    expect(graph.map((item) => item["@type"])).toEqual([
      "WebSite",
      "ProfilePage",
      "Person",
      "MusicEvent",
    ]);
    expect(graph[2]).toMatchObject({
      name: "DJ Marco",
      jobTitle: "DJ",
      sameAs: [
        "https://instagram.com/djmarco",
        "https://open.spotify.com/artist/marco",
      ],
    });
    expect(graph[3]).toMatchObject({
      startDate: "2026-11-02",
      name: "DJ Marco en Club 8",
    });
  });

  it("redirige un alias público al canónico y deja el preview quieto", () => {
    expect(
      resolveIndexedHostname({
        requestHostname: "www.djmarco.com",
        isCanonical: false,
        canonicalHostname: "djmarco.com",
      }),
    ).toBe("djmarco.com");
    expect(
      resolveIndexedHostname({
        requestHostname: "marco.localhost",
        isCanonical: false,
        canonicalHostname: "djmarco.com",
      }),
    ).toBe("marco.localhost");

    const redirect = tenantCanonicalRedirectUrl(
      new URL("http://www.djmarco.com/agenda"),
      "www.djmarco.com",
      "djmarco.com",
    );
    expect(redirect?.toString()).toBe("https://djmarco.com/agenda");
    expect(
      tenantCanonicalRedirectUrl(
        new URL("http://marco.localhost/"),
        "marco.localhost",
        "djmarco.com",
      ),
    ).toBeNull();
  });
});

describe("SEO de GigBlade", () => {
  it("lista solo páginas públicas e indexables", () => {
    expect(platformSitemap("https://gigblade.com").map((entry) => entry.url)).toEqual([
      "https://gigblade.com",
      "https://gigblade.com/pricing",
      "https://gigblade.com/acceso",
      "https://gigblade.com/terms",
      "https://gigblade.com/privacy",
    ]);
  });
});
