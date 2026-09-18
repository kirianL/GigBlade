import { z } from "zod";

import { normalizeBrandColor } from "@/domain/site-color";
import {
  coerceSiteLinkInput,
  readSiteLinks,
  SITE_LINK_KEYS,
  type SiteLinks,
} from "@/domain/site-links";
import { coerceSiteMixes, readSiteMixes, type SiteMix } from "@/domain/site-mixes";
import {
  SITE_SECTION_IDS,
  SITE_TEMPLATE_IDS,
  type SiteSectionId,
} from "@/domain/site-template";

export const HERO_POSITIONS = [
  "center",
  "top",
  "bottom",
  "left",
  "right",
] as const;

export type HeroPosition = (typeof HERO_POSITIONS)[number];

export type SiteEvent = {
  date: string;
  venue: string;
  location: string;
  ticketUrl?: string;
};

export type SiteProfile = {
  displayName: string;
  tagline: string;
  city: string;
  bio: string;
  email?: string;
  links: SiteLinks;
  mixes?: SiteMix[];
  photos?: string[];
  heroPhoto?: string;
  heroPosition?: HeroPosition;
  events?: SiteEvent[];
  hiddenSections?: SiteSectionId[];
  brandColor?: string;
};

export function hasSiteSectionContent(
  profile: SiteProfile,
  section: SiteSectionId,
): boolean {
  if (section === "intro") return true;
  if (profile.hiddenSections?.includes(section)) return false;
  if (section === "agenda") return Boolean(profile.events?.length);
  if (section === "bio") return Boolean(profile.bio || profile.city);
  if (section === "sets") return Boolean(profile.mixes?.length);
  if (section === "contacto") {
    return Boolean(profile.email || profile.links.instagram);
  }
  return SITE_LINK_KEYS.some((key) => Boolean(profile.links[key]));
}

const brandColorInput = z
  .string()
  .max(7)
  .refine((value) => value === "" || Boolean(normalizeBrandColor(value)), {
    message: "Color inválido",
  });

const optionalPublicEmail = z
  .union([z.literal(""), z.string().max(254)])
  .refine((value) => value === "" || Boolean(readPublicEmail(value)), {
    message: "Correo inválido",
  });

export const siteContentInputSchema = z
  .object({
    templateId: z.enum(SITE_TEMPLATE_IDS),
    displayName: z.string().max(80).optional(),
    tagline: z.string().max(160).optional(),
    city: z.string().max(80).optional(),
    bio: z.string().max(2000).optional(),
    email: optionalPublicEmail.optional(),
    brandColor: brandColorInput.optional(),
    links: z
      .object({
        instagram: z.string().max(300).optional(),
        tiktok: z.string().max(300).optional(),
        youtube: z.string().max(300).optional(),
        facebook: z.string().max(300).optional(),
        x: z.string().max(300).optional(),
        soundcloud: z.string().max(300).optional(),
        spotify: z.string().max(300).optional(),
      })
      .strict()
      .optional(),
    mixes: z
      .array(
        z
          .object({
            title: z.string().max(80).optional(),
            url: z.string().max(500),
          })
          .strict(),
      )
      .max(8)
      .optional(),
    photos: z.array(z.string().max(500)).max(12).optional(),
    heroPosition: z.enum(HERO_POSITIONS).optional(),
    events: z
      .array(
        z
          .object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            venue: z.string().max(100),
            location: z.string().max(120),
            ticketUrl: z.string().max(500).optional(),
          })
          .strict(),
      )
      .max(12)
      .optional(),
    hiddenSections: z.array(z.enum(SITE_SECTION_IDS)).max(5).optional(),
  })
  .strict();

export type SiteContentInput = z.infer<typeof siteContentInputSchema>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function readPublicEmail(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const email = value.trim().toLowerCase();
  if (!email) return undefined;
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return undefined;
  return email;
}

function readPhotos(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => {
        if (typeof item === "string") return readPhotoUrl(item) ?? null;
        if (
          typeof item === "object" &&
          item !== null &&
          "url" in item &&
          typeof (item as { url: unknown }).url === "string"
        ) {
          return readPhotoUrl((item as { url: string }).url) ?? null;
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
    return list.length > 0 ? list : undefined;
  }
  return undefined;
}

function readHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}

function readPhotoUrl(value: unknown): string | undefined {
  if (
    typeof value === "string" &&
    /^\/(?:images|sites)\/[a-zA-Z0-9._~!$&'()*+,;=:@%/-]+$/.test(value.trim())
  ) {
    return value.trim();
  }
  const url = readHttpUrl(value);
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === "localhost" &&
      parsed.port === "3000" &&
      parsed.pathname.startsWith("/sites/")
    ) {
      return parsed.pathname;
    }
  } catch {
    return undefined;
  }
  return url;
}

function readHeroPosition(value: unknown): HeroPosition | undefined {
  return HERO_POSITIONS.includes(value as HeroPosition)
    ? (value as HeroPosition)
    : undefined;
}

function readEvents(value: unknown): SiteEvent[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const event = item as Record<string, unknown>;
    const date = readString(event.date);
    const venue = readString(event.venue);
    const location = readString(event.location);
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !venue || !location) {
      return [];
    }
    const ticketUrl = readHttpUrl(event.ticketUrl);
    return [{ date, venue, location, ...(ticketUrl ? { ticketUrl } : {}) }];
  });
}

function readHiddenSections(value: unknown): SiteSectionId[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is SiteSectionId =>
      typeof item === "string" &&
      item !== "intro" &&
      SITE_SECTION_IDS.includes(item as SiteSectionId),
  );
}

export function readSiteProfile(
  slug: string,
  themeConfig: Record<string, unknown>,
): SiteProfile {
  const photos = readPhotos(themeConfig.photos);
  const heroPhoto = readPhotoUrl(themeConfig.heroPhoto) ?? photos?.[0];
  const brandColor = normalizeBrandColor(
    typeof themeConfig.brandColor === "string" ? themeConfig.brandColor : "",
  );
  const email = readPublicEmail(themeConfig.email);
  const mixes = readSiteMixes(themeConfig);
  const events = readEvents(themeConfig.events);
  const hiddenSections = readHiddenSections(themeConfig.hiddenSections);

  return {
    displayName: readString(themeConfig.displayName) ?? slug,
    tagline:
      readString(themeConfig.tagline) ?? "Sitio oficial del artista",
    city: readString(themeConfig.city) ?? "",
    bio: readString(themeConfig.bio) ?? "",
    links: readSiteLinks(themeConfig),
    ...(readHeroPosition(themeConfig.heroPosition)
      ? { heroPosition: readHeroPosition(themeConfig.heroPosition) }
      : {}),
    ...(events.length > 0 ? { events } : {}),
    ...(hiddenSections.length > 0 ? { hiddenSections } : {}),
    ...(photos ? { photos } : {}),
    ...(heroPhoto ? { heroPhoto } : {}),
    ...(brandColor ? { brandColor } : {}),
    ...(email ? { email } : {}),
    ...(mixes.length > 0 ? { mixes } : {}),
  };
}

export function buildSiteThemeConfig(
  current: Record<string, unknown>,
  slug: string,
  input: SiteContentInput,
): Record<string, unknown> {
  const next: Record<string, unknown> = { ...current };

  if (input.displayName !== undefined) {
    next.displayName = readString(input.displayName) ?? slug;
  }
  if (input.tagline !== undefined) {
    next.tagline =
      readString(input.tagline) ?? "Sitio oficial del artista";
  }
  if (input.city !== undefined) {
    next.city = readString(input.city) ?? "";
  }
  if (input.bio !== undefined) {
    next.bio = readString(input.bio) ?? "";
  }
  if (input.email !== undefined) {
    const email = readPublicEmail(input.email);
    if (email) next.email = email;
    else delete next.email;
  }
  if (input.links !== undefined) {
    const rawLinks: Record<string, unknown> = {};
    for (const key of SITE_LINK_KEYS) {
      const value = input.links[key];
      if (typeof value === "string" && value.trim()) {
        rawLinks[key] = coerceSiteLinkInput(key, value);
      }
    }
    next.links = readSiteLinks({ links: rawLinks });
  }
  if (input.mixes !== undefined) {
    const mixes = coerceSiteMixes(input.mixes);
    if (mixes.length > 0) next.mixes = mixes;
    else delete next.mixes;
  }
  if (input.brandColor !== undefined) {
    const brandColor = normalizeBrandColor(input.brandColor);
    if (brandColor) next.brandColor = brandColor;
    else delete next.brandColor;
  }
  if (input.photos !== undefined) {
    const photos = input.photos
      .map(readPhotoUrl)
      .filter((photo): photo is string => Boolean(photo));
    if (photos.length > 0) {
      next.photos = photos;
      next.heroPhoto = photos[0];
    } else {
      delete next.photos;
      delete next.heroPhoto;
    }
  }
  if (input.heroPosition !== undefined) {
    next.heroPosition = input.heroPosition;
  }
  if (input.events !== undefined) {
    const events = readEvents(input.events);
    if (events.length > 0) next.events = events;
    else delete next.events;
  }
  if (input.hiddenSections !== undefined) {
    const hiddenSections = readHiddenSections(input.hiddenSections);
    if (hiddenSections.length > 0) next.hiddenSections = hiddenSections;
    else delete next.hiddenSections;
  }

  return next;
}
