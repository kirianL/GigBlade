import { readAllowedHttpsUrl } from "@/domain/site-links";

export const MIX_PLATFORMS = ["youtube", "soundcloud"] as const;

export type MixPlatform = (typeof MIX_PLATFORMS)[number];

export type SiteMix = {
  title: string;
  url: string;
  platform: MixPlatform;
};

export const MAX_SITE_MIXES = 8;

const MIX_HOSTS: Record<MixPlatform, readonly string[]> = {
  youtube: ["youtube.com", "youtu.be", "m.youtube.com", "music.youtube.com"],
  soundcloud: ["soundcloud.com", "on.soundcloud.com"],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeHostname(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, "");
}

function platformFromHostname(hostname: string): MixPlatform | undefined {
  const host = normalizeHostname(hostname);
  if ((MIX_HOSTS.youtube as readonly string[]).includes(host)) return "youtube";
  if ((MIX_HOSTS.soundcloud as readonly string[]).includes(host)) {
    return "soundcloud";
  }
  return undefined;
}

function isDirectMixPath(url: URL, platform: MixPlatform): boolean {
  const parts = url.pathname.split("/").filter(Boolean);
  if (platform === "youtube") {
    const host = normalizeHostname(url.hostname);
    if (host === "youtu.be") return parts.length === 1;
    const path = url.pathname.toLowerCase();
    if (path.startsWith("/watch")) return url.searchParams.has("v");
    if (path.startsWith("/shorts/")) return parts.length >= 2;
    if (path.startsWith("/embed/")) return parts.length >= 2;
    if (path.startsWith("/live/")) return parts.length >= 2;
    return false;
  }

  const host = normalizeHostname(url.hostname);
  if (host === "on.soundcloud.com") return parts.length >= 1;
  return parts.length >= 2;
}

function titleFromUrl(url: URL, platform: MixPlatform): string {
  if (platform === "youtube") {
    if (url.searchParams.get("v") || normalizeHostname(url.hostname) === "youtu.be") {
      return "YouTube mix";
    }
  }

  const last = url.pathname.split("/").filter(Boolean).pop() ?? "Mix";
  try {
    return decodeURIComponent(last).replace(/[-_]+/g, " ").slice(0, 80);
  } catch {
    return last.replace(/[-_]+/g, " ").slice(0, 80);
  }
}

export function readMixUrl(value: unknown): SiteMix | undefined {
  if (typeof value !== "string") return undefined;
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    return undefined;
  }

  const platform = platformFromHostname(parsed.hostname);
  if (!platform) return undefined;

  const href = readAllowedHttpsUrl(value, MIX_HOSTS[platform]);
  if (!href) return undefined;

  const sanitized = new URL(href);
  if (!isDirectMixPath(sanitized, platform)) return undefined;

  return {
    title: titleFromUrl(sanitized, platform),
    url: href,
    platform,
  };
}

export function readSiteMixes(
  themeConfig: Record<string, unknown>,
): SiteMix[] {
  const raw = themeConfig.mixes;
  if (!Array.isArray(raw)) return [];

  const mixes: SiteMix[] = [];
  for (const item of raw) {
    if (mixes.length >= MAX_SITE_MIXES) break;
    if (!isRecord(item)) continue;
    const parsed = readMixUrl(item.url);
    if (!parsed) continue;
    const title =
      typeof item.title === "string" && item.title.trim()
        ? item.title.trim().slice(0, 80)
        : parsed.title;
    mixes.push({ ...parsed, title });
  }

  return mixes;
}

export function coerceSiteMixes(
  input: ReadonlyArray<{ title?: string; url: string }>,
): SiteMix[] {
  return readSiteMixes({ mixes: input.slice(0, MAX_SITE_MIXES) });
}

const YOUTUBE_ID = /^[\w-]{11}$/;

export function youtubeVideoId(href: string): string | undefined {
  let url: URL;
  try {
    url = new URL(href);
  } catch {
    return undefined;
  }

  const host = normalizeHostname(url.hostname);
  if (host === "youtu.be") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id && YOUTUBE_ID.test(id) ? id : undefined;
  }

  const fromQuery = url.searchParams.get("v");
  if (fromQuery && YOUTUBE_ID.test(fromQuery)) return fromQuery;

  const parts = url.pathname.split("/").filter(Boolean);
  if (
    (parts[0] === "shorts" || parts[0] === "embed" || parts[0] === "live") &&
    parts[1] &&
    YOUTUBE_ID.test(parts[1])
  ) {
    return parts[1];
  }

  return undefined;
}

export function mixCoverUrl(mix: SiteMix): string | undefined {
  if (mix.platform !== "youtube") return undefined;
  const id = youtubeVideoId(mix.url);
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined;
}

const SOUNDCLOUD_ARTWORK_HOST = /^i\d+\.sndcdn\.com$/i;
const SOUNDCLOUD_ARTWORK_SIZE =
  /-(mini|tiny|small|badge|large|crop|t\d+x\d+|original)\.(jpe?g|png|webp)$/i;

export function upgradeSoundcloudArtworkUrl(href: string): string {
  return href.replace(SOUNDCLOUD_ARTWORK_SIZE, "-t500x500.$2");
}

export function readSoundcloudArtworkUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return undefined;
  }
  if (url.protocol !== "https:") return undefined;
  if (!SOUNDCLOUD_ARTWORK_HOST.test(url.hostname)) return undefined;
  if (!url.pathname.startsWith("/artworks")) return undefined;
  url.username = "";
  url.password = "";
  url.hash = "";
  url.search = "";
  return upgradeSoundcloudArtworkUrl(url.toString());
}

const SOUNDCLOUD_OG_IMAGE = [
  /property=["']og:image["']\s+content=["']([^"']+)["']/i,
  /content=["']([^"']+)["']\s+property=["']og:image["']/i,
  /name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
];

export function readSoundcloudArtworkFromHtml(html: string): string | undefined {
  for (const pattern of SOUNDCLOUD_OG_IMAGE) {
    const href = readSoundcloudArtworkUrl(html.match(pattern)?.[1]);
    if (href) return href;
  }

  const fallback = html.match(/https:\/\/i\d+\.sndcdn\.com\/artworks-[^\s"'<>]+/i);
  return readSoundcloudArtworkUrl(fallback?.[0]);
}
