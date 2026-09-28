import type { Metadata, MetadataRoute } from "next";

import { hasSiteSectionContent, type SiteProfile } from "@/domain/site-profile";
import { isValidPublicHostname, normalizeHostname } from "@/domain/hostname";
import { isPreviewHostname } from "@/domain/site-visits";
import { getSiteTemplateSections } from "@/domain/site-template";
import type { PublicTenant } from "@/domain/tenant";

const PRIVATE_PATHS = [
  "/login",
  "/sign-in",
  "/overview",
  "/studio",
  "/dashboard",
  "/api/",
  "/site",
];

export function tenantSiteOrigin(hostname: string): string {
  const host = normalizeHostname(hostname);
  const local =
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "127.0.0.1";
  return `${local ? "http" : "https"}://${host}`;
}

export function resolveIndexedHostname(input: {
  requestHostname: string;
  isCanonical: boolean;
  canonicalHostname?: string | null;
}): string {
  const requestHost = normalizeHostname(input.requestHostname);
  if (input.isCanonical || isPreviewHostname(requestHost)) {
    return requestHost;
  }

  const preferred = input.canonicalHostname
    ? normalizeHostname(input.canonicalHostname)
    : "";
  if (preferred && !isPreviewHostname(preferred) && isValidPublicHostname(preferred)) {
    return preferred;
  }

  return requestHost;
}

export function tenantCanonicalRedirectUrl(
  currentUrl: URL,
  requestHostname: string,
  canonicalHostname: string,
): URL | null {
  const requestHost = normalizeHostname(requestHostname);
  const canonicalHost = normalizeHostname(canonicalHostname);
  if (!canonicalHost || requestHost === canonicalHost) return null;
  if (isPreviewHostname(requestHost) || isPreviewHostname(canonicalHost)) {
    return null;
  }
  if (!isValidPublicHostname(canonicalHost)) return null;

  const url = new URL(currentUrl.toString());
  url.protocol = "https:";
  url.hostname = canonicalHost;
  url.port = "";
  return url;
}

export function tenantShouldIndex(input: {
  requestHostname: string;
  canonicalHostname: string;
  blockIndexing?: boolean;
}): boolean {
  if (input.blockIndexing) return false;
  const requestHost = normalizeHostname(input.requestHostname);
  const canonicalHost = normalizeHostname(input.canonicalHostname);
  if (!requestHost || requestHost !== canonicalHost) return false;
  if (isPreviewHostname(requestHost)) return false;
  return isValidPublicHostname(requestHost);
}

export function tenantPageTitle(profile: Pick<SiteProfile, "displayName" | "city">): string {
  const name = profile.displayName.trim();
  const city = profile.city.trim();
  const namedAsDj = /\bdj\b/i.test(name);
  const titled = city
    ? namedAsDj
      ? `${name} en ${city}`
      : `${name} | DJ en ${city}`
    : namedAsDj
      ? name
      : `${name} | DJ`;

  if (titled.length <= 60) return titled;
  if (name.length <= 60) return name;
  return `${name.slice(0, 57).trimEnd()}…`;
}

export function tenantMetaDescription(profile: SiteProfile): string {
  const name = profile.displayName.trim() || "DJ";
  const city = profile.city.trim();
  const tagline = profile.tagline.trim();
  const bio = profile.bio.trim();
  const lead = tagline || bio || `Sitio oficial de ${name}`;
  const place = city ? ` en ${city}` : "";
  const withRole = /\bdj\b/i.test(lead) ? lead : `${lead}. DJ${place}`;
  const withPlace =
    city && !withRole.toLowerCase().includes(city.toLowerCase())
      ? `${withRole.replace(/[.]+$/, "")}${place}.`
      : withRole;

  const sentence = /[.!?…]$/.test(withPlace) ? withPlace : `${withPlace}.`;
  return clampMetaDescription(sentence);
}

export function clampMetaDescription(value: string, max = 155): string {
  const text = value.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  const base = (space > 80 ? cut.slice(0, space) : cut).replace(/[.,;:]+$/, "").trim();
  return `${base}…`;
}

function absoluteAsset(origin: string, value: string | undefined): string | undefined {
  if (!value) return undefined;
  if (value.startsWith("https://") || value.startsWith("http://")) return value;
  if (value.startsWith("/")) return `${origin}${value}`;
  return undefined;
}

function sameAsLinks(profile: SiteProfile): string[] {
  return Object.values(profile.links).filter(
    (value): value is string => typeof value === "string" && value.startsWith("https://"),
  );
}

function cityIsVisible(site: PublicTenant): boolean {
  if (!site.profile.city.trim()) return false;
  if (site.profile.heroStyle === "poster") return true;
  return (
    getSiteTemplateSections(site.templateId).includes("bio") &&
    hasSiteSectionContent(site.profile, "bio")
  );
}

function agendaIsVisible(site: PublicTenant): boolean {
  return (
    getSiteTemplateSections(site.templateId).includes("agenda") &&
    hasSiteSectionContent(site.profile, "agenda")
  );
}

export function buildTenantMetadata(
  site: PublicTenant,
  requestHostname: string,
  options?: { blockIndexing?: boolean },
): Metadata {
  const canonicalHost = normalizeHostname(site.domain);
  const origin = tenantSiteOrigin(canonicalHost);
  const title = tenantPageTitle(site.profile);
  const description = tenantMetaDescription(site.profile);
  const image = absoluteAsset(
    origin,
    site.profile.heroPhoto || site.profile.photos?.[0],
  );
  const index = tenantShouldIndex({
    requestHostname,
    canonicalHostname: canonicalHost,
    blockIndexing: options?.blockIndexing,
  });

  return {
    metadataBase: new URL(origin),
    title: { absolute: title },
    description,
    applicationName: site.profile.displayName,
    authors: [{ name: site.profile.displayName }],
    alternates: { canonical: origin },
    robots: index
      ? {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: "es_CR",
      url: origin,
      siteName: site.profile.displayName,
      title: { absolute: title },
      description,
      ...(image
        ? {
            images: [
              {
                url: image,
                alt: `Foto de ${site.profile.displayName}`,
              },
            ],
          }
        : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: { absolute: title },
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function tenantStructuredData(
  site: PublicTenant,
): Record<string, unknown> {
  const origin = tenantSiteOrigin(site.domain);
  const profile = site.profile;
  const description = tenantMetaDescription(profile);
  const image = absoluteAsset(origin, profile.heroPhoto || profile.photos?.[0]);
  const visibleText = `${profile.displayName} ${profile.tagline} ${profile.bio}`;
  const jobTitle = /\bdj\b/i.test(visibleText) ? "DJ" : "Artista";
  const sameAs = sameAsLinks(profile);
  const artistId = `${origin}/#artist`;
  const graph: Array<Record<string, unknown>> = [
    {
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: origin,
      name: profile.displayName,
      inLanguage: "es",
    },
    {
      "@type": "ProfilePage",
      "@id": `${origin}/#page`,
      url: origin,
      name: tenantPageTitle(profile),
      description,
      inLanguage: "es",
      isPartOf: { "@id": `${origin}/#website` },
      mainEntity: { "@id": artistId },
    },
    {
      "@type": "Person",
      "@id": artistId,
      name: profile.displayName,
      jobTitle,
      description,
      url: origin,
      ...(image ? { image } : {}),
      ...(sameAs.length > 0 ? { sameAs } : {}),
      ...(cityIsVisible(site)
        ? {
            address: {
              "@type": "PostalAddress",
              addressLocality: profile.city.trim(),
            },
          }
        : {}),
    },
  ];

  if (agendaIsVisible(site)) {
    for (const event of profile.events ?? []) {
      if (!event.venue.trim() || !event.date) continue;
      graph.push({
        "@type": "MusicEvent",
        name: `${profile.displayName} en ${event.venue.trim()}`,
        startDate: event.date,
        eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
        eventStatus: "https://schema.org/EventScheduled",
        location: {
          "@type": "Place",
          name: event.venue.trim(),
          address: event.location.trim() || event.venue.trim(),
        },
        performer: { "@id": artistId },
        url: event.ticketUrl || origin,
      });
    }
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function tenantRobots(
  canonicalHostname: string,
  index: boolean,
): MetadataRoute.Robots {
  const origin = tenantSiteOrigin(canonicalHostname);
  if (!index) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}

export function tenantSitemap(canonicalHostname: string): MetadataRoute.Sitemap {
  return [
    {
      url: tenantSiteOrigin(canonicalHostname),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

export function platformSitemap(siteUrl: string): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/pricing`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/acceso`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

export function platformRobots(
  siteUrl: string,
  blockIndexing = false,
): MetadataRoute.Robots {
  if (blockIndexing) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: PRIVATE_PATHS,
    },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
