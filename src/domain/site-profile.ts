import { z } from "zod";

import {
  coerceSiteLinkInput,
  readSiteLinks,
  SITE_LINK_KEYS,
  type SiteLinks,
} from "@/domain/site-links";
import { normalizeBrandColor } from "@/domain/site-color";
import { SITE_TEMPLATE_IDS } from "@/domain/site-template";

export type SiteProfile = {
  displayName: string;
  tagline: string;
  city: string;
  bio: string;
  links: SiteLinks;
  photos?: string[];
  heroPhoto?: string;
  brandColor?: string;
};

const brandColorInput = z
  .string()
  .max(7)
  .refine((value) => value === "" || Boolean(normalizeBrandColor(value)), {
    message: "Color inválido",
  });

export const siteContentInputSchema = z
  .object({
    templateId: z.enum(SITE_TEMPLATE_IDS),
    displayName: z.string().max(80).optional(),
    tagline: z.string().max(160).optional(),
    city: z.string().max(80).optional(),
    bio: z.string().max(2000).optional(),
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
  })
  .strict();

export type SiteContentInput = z.infer<typeof siteContentInputSchema>;

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readPhotos(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const list = value
      .map((item) => {
        if (typeof item === "string" && item.trim()) return item.trim();
        if (
          typeof item === "object" &&
          item !== null &&
          "url" in item &&
          typeof (item as { url: unknown }).url === "string"
        ) {
          return (item as { url: string }).url.trim();
        }
        return null;
      })
      .filter((item): item is string => Boolean(item));
    return list.length > 0 ? list : undefined;
  }
  return undefined;
}

export function readSiteProfile(
  slug: string,
  themeConfig: Record<string, unknown>,
): SiteProfile {
  const photos = readPhotos(themeConfig.photos);
  const heroPhoto = readString(themeConfig.heroPhoto) ?? photos?.[0];
  const brandColor = normalizeBrandColor(
    typeof themeConfig.brandColor === "string" ? themeConfig.brandColor : "",
  );

  return {
    displayName: readString(themeConfig.displayName) ?? slug,
    tagline:
      readString(themeConfig.tagline) ?? "Sitio oficial del artista",
    city: readString(themeConfig.city) ?? "",
    bio: readString(themeConfig.bio) ?? "",
    links: readSiteLinks(themeConfig),
    ...(photos ? { photos } : {}),
    ...(heroPhoto ? { heroPhoto } : {}),
    ...(brandColor ? { brandColor } : {}),
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
  if (input.brandColor !== undefined) {
    const brandColor = normalizeBrandColor(input.brandColor);
    if (brandColor) next.brandColor = brandColor;
    else delete next.brandColor;
  }

  return next;
}
