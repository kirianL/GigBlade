export const SITE_SOCIAL_LINK_KEYS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "x",
] as const;

export const SITE_MUSIC_LINK_KEYS = ["soundcloud", "spotify"] as const;

export const SITE_LINK_KEYS = [
  "instagram",
  "tiktok",
  "youtube",
  "facebook",
  "x",
  "soundcloud",
  "spotify",
] as const;

export type SiteSocialLinkKey = (typeof SITE_SOCIAL_LINK_KEYS)[number];
export type SiteMusicLinkKey = (typeof SITE_MUSIC_LINK_KEYS)[number];
export type SiteLinkKey = (typeof SITE_LINK_KEYS)[number];
export type SiteLinks = Partial<Record<SiteLinkKey, string>>;

const ALLOWED_HOSTS: Record<SiteLinkKey, readonly string[]> = {
  instagram: ["instagram.com"],
  tiktok: ["tiktok.com"],
  youtube: ["youtube.com", "youtu.be", "m.youtube.com"],
  facebook: ["facebook.com", "fb.com"],
  x: ["x.com", "twitter.com"],
  soundcloud: ["soundcloud.com", "on.soundcloud.com"],
  spotify: ["open.spotify.com", "spotify.com"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

export function readAllowedHttpsUrl(
  value: unknown,
  hosts: readonly string[],
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return undefined;
  }

  if (url.protocol !== "https:") {
    return undefined;
  }

  const hostname = normalizeHostname(url.hostname);
  if (!hosts.includes(hostname)) {
    return undefined;
  }

  url.username = "";
  url.password = "";
  url.hash = "";
  return url.toString();
}

export function readSiteLinks(
  themeConfig: Record<string, unknown>,
): SiteLinks {
  const raw = themeConfig.links;
  const source = isRecord(raw) ? raw : {};
  const links: SiteLinks = {};

  for (const key of SITE_LINK_KEYS) {
    const href = readAllowedHttpsUrl(source[key], ALLOWED_HOSTS[key]);
    if (href) {
      links[key] = href;
    }
  }

  return links;
}

export function hasSiteLinks(links: SiteLinks): boolean {
  return SITE_LINK_KEYS.some((key) => Boolean(links[key]));
}

export function coerceSiteLinkInput(key: SiteLinkKey, value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (key === "instagram" && !trimmed.includes("://")) {
    const handle = trimmed.replace(/^@/, "");
    return `https://instagram.com/${handle}`;
  }

  return trimmed;
}
