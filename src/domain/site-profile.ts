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

export const HERO_STYLES = ["cinematic", "poster", "band", "type", "duo"] as const;
export const HERO_ALIGNS = ["start", "center"] as const;
export const SURFACE_STYLES = ["plain", "gradient", "bands", "frame"] as const;
export const AGENDA_STYLES = ["list", "cards"] as const;
export const BIO_STYLES = ["quote", "columns"] as const;
export const MIX_STYLES = ["grid", "row", "list"] as const;
export const LINK_STYLES = ["cards", "icons"] as const;
export const BUTTON_STYLES = ["pill", "square", "text"] as const;
export const CORNER_STYLES = ["round", "sharp"] as const;
export const TITLE_STYLES = ["tight", "wide", "spaced"] as const;

export type HeroStyle = (typeof HERO_STYLES)[number];
export type HeroAlign = (typeof HERO_ALIGNS)[number];
export type SurfaceStyle = (typeof SURFACE_STYLES)[number];
export type AgendaStyle = (typeof AGENDA_STYLES)[number];
export type BioStyle = (typeof BIO_STYLES)[number];
export type MixStyle = (typeof MIX_STYLES)[number];
export type LinkStyle = (typeof LINK_STYLES)[number];
export type ButtonStyle = (typeof BUTTON_STYLES)[number];
export type CornerStyle = (typeof CORNER_STYLES)[number];
export type TitleStyle = (typeof TITLE_STYLES)[number];

export const BACKGROUND_PATTERNS = [
  "none",
  "dots",
  "grid",
  "diagonal",
  "grain",
] as const;

export type BackgroundPattern = (typeof BACKGROUND_PATTERNS)[number];

export type SiteEvent = {
  date: string;
  venue: string;
  location: string;
  ticketUrl?: string;
  photo?: string;
};

export type SiteProfile = {
  displayName: string;
  tagline: string;
  city: string;
  bio: string;
  email?: string;
  phone?: string;
  links: SiteLinks;
  mixes?: SiteMix[];
  photos?: string[];
  heroPhoto?: string;
  heroPosition?: HeroPosition;
  heroStyle?: HeroStyle;
  heroAlign?: HeroAlign;
  surfaceStyle?: SurfaceStyle;
  agendaStyle?: AgendaStyle;
  bioStyle?: BioStyle;
  mixStyle?: MixStyle;
  linkStyle?: LinkStyle;
  buttonStyle?: ButtonStyle;
  cornerStyle?: CornerStyle;
  titleStyle?: TitleStyle;
  backgroundPattern?: BackgroundPattern;
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
    return Boolean(profile.email || profile.phone || profile.links.instagram);
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

const optionalPublicPhone = z
  .union([z.literal(""), z.string().max(30)])
  .refine((value) => value === "" || Boolean(readPublicPhone(value)), {
    message: "Número inválido",
  });

export const siteContentInputSchema = z
  .object({
    templateId: z.enum(SITE_TEMPLATE_IDS),
    displayName: z.string().max(80).optional(),
    tagline: z.string().max(160).optional(),
    city: z.string().max(80).optional(),
    bio: z.string().max(2000).optional(),
    email: optionalPublicEmail.optional(),
    phone: optionalPublicPhone.optional(),
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
    heroStyle: z.enum(HERO_STYLES).optional(),
    heroAlign: z.enum(HERO_ALIGNS).optional(),
    surfaceStyle: z.enum(SURFACE_STYLES).optional(),
    agendaStyle: z.enum(AGENDA_STYLES).optional(),
    bioStyle: z.enum(BIO_STYLES).optional(),
    mixStyle: z.enum(MIX_STYLES).optional(),
    linkStyle: z.enum(LINK_STYLES).optional(),
    buttonStyle: z.enum(BUTTON_STYLES).optional(),
    cornerStyle: z.enum(CORNER_STYLES).optional(),
    titleStyle: z.enum(TITLE_STYLES).optional(),
    backgroundPattern: z.enum(BACKGROUND_PATTERNS).optional(),
    events: z
      .array(
        z
          .object({
            date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
            venue: z.string().max(100),
            location: z.string().max(120),
            ticketUrl: z.string().max(500).optional(),
            photo: z.string().max(500).optional(),
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

export function readPublicPhone(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const phone = value.trim().replace(/\s+/g, " ");
  if (!phone || phone.length > 30 || !/^\+?[\d\s().-]+$/.test(phone)) {
    return undefined;
  }
  const digits = phone.replace(/\D/g, "").length;
  if (digits < 7 || digits > 15) return undefined;
  return phone;
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

function readHeroStyle(value: unknown): HeroStyle | undefined {
  return HERO_STYLES.includes(value as HeroStyle)
    ? (value as HeroStyle)
    : undefined;
}

function readBackgroundPattern(value: unknown): BackgroundPattern | undefined {
  return BACKGROUND_PATTERNS.includes(value as BackgroundPattern)
    ? (value as BackgroundPattern)
    : undefined;
}

function readEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
): T | undefined {
  return allowed.includes(value as T) ? (value as T) : undefined;
}

const DESIGN_FIELDS = [
  ["heroAlign", HERO_ALIGNS],
  ["surfaceStyle", SURFACE_STYLES],
  ["agendaStyle", AGENDA_STYLES],
  ["bioStyle", BIO_STYLES],
  ["mixStyle", MIX_STYLES],
  ["linkStyle", LINK_STYLES],
  ["buttonStyle", BUTTON_STYLES],
  ["cornerStyle", CORNER_STYLES],
  ["titleStyle", TITLE_STYLES],
] as const;

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
    const photo = readPhotoUrl(event.photo);
    return [
      {
        date,
        venue,
        location,
        ...(ticketUrl ? { ticketUrl } : {}),
        ...(photo ? { photo } : {}),
      },
    ];
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
  const phone = readPublicPhone(themeConfig.phone);
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
    ...(readHeroStyle(themeConfig.heroStyle)
      ? { heroStyle: readHeroStyle(themeConfig.heroStyle) }
      : {}),
    ...Object.fromEntries(
      DESIGN_FIELDS.flatMap(([key, allowed]) => {
        const value = readEnum(themeConfig[key], allowed);
        return value ? [[key, value]] : [];
      }),
    ),
    ...(readBackgroundPattern(themeConfig.backgroundPattern)
      ? { backgroundPattern: readBackgroundPattern(themeConfig.backgroundPattern) }
      : {}),
    ...(events.length > 0 ? { events } : {}),
    ...(hiddenSections.length > 0 ? { hiddenSections } : {}),
    ...(photos ? { photos } : {}),
    ...(heroPhoto ? { heroPhoto } : {}),
    ...(brandColor ? { brandColor } : {}),
    ...(email ? { email } : {}),
    ...(phone ? { phone } : {}),
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
  if (input.phone !== undefined) {
    const phone = readPublicPhone(input.phone);
    if (phone) next.phone = phone;
    else delete next.phone;
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
  if (input.heroStyle !== undefined) {
    next.heroStyle = input.heroStyle;
  }
  for (const [key] of DESIGN_FIELDS) {
    if (input[key] !== undefined) next[key] = input[key];
  }
  if (input.backgroundPattern !== undefined) {
    next.backgroundPattern = input.backgroundPattern;
  }
  if (input.events !== undefined) {
    const previous = readEvents(current.events);
    const events = input.events.flatMap((event) => {
      const nextEvent = readEvents([event])[0];
      if (!nextEvent) return [];
      if (!Object.hasOwn(event, "photo")) {
        const prior = previous.find(
          (item) => item.date === nextEvent.date && item.venue === nextEvent.venue,
        );
        if (prior?.photo) return [{ ...nextEvent, photo: prior.photo }];
      }
      return [nextEvent];
    });
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
