import { validationError } from "@/domain/errors";
import {
  readMixUrl,
  readSoundcloudArtworkFromHtml,
  readSoundcloudArtworkUrl,
} from "@/domain/site-mixes";
import { errorResponse } from "@/lib/http/errors";
import { createRequestId } from "@/lib/http/request-id";

const FETCH_TIMEOUT_MS = 8000;
const CACHE_TTL_MS = 60 * 60 * 1000;
const SOUNDCLOUD_PAGE_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const thumbnailCache = new Map<string, { href: string; expiresAt: number }>();

function isSoundcloudPageUrl(href: string): boolean {
  try {
    const url = new URL(href);
    const host = url.hostname.trim().toLowerCase().replace(/^www\./, "");
    return (
      url.protocol === "https:" &&
      (host === "soundcloud.com" || host === "on.soundcloud.com" || host === "m.soundcloud.com")
    );
  } catch {
    return false;
  }
}

async function fetchSoundcloudArtwork(trackUrl: string, signal: AbortSignal): Promise<string | undefined> {
  try {
    const pageResponse = await fetch(trackUrl, {
      signal,
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent": SOUNDCLOUD_PAGE_UA,
      },
    });
    if (pageResponse.ok && isSoundcloudPageUrl(pageResponse.url)) {
      const html = await pageResponse.text();
      const fromPage = readSoundcloudArtworkFromHtml(html);
      if (fromPage) return fromPage;
    }
  } catch (error) {
    if (signal.aborted) throw error;
  }

  try {
    const oembedResponse = await fetch(
      `https://soundcloud.com/oembed?format=json&url=${encodeURIComponent(trackUrl)}`,
      {
        signal,
        redirect: "error",
        headers: {
          accept: "application/json",
          "user-agent": SOUNDCLOUD_PAGE_UA,
        },
      },
    );
    if (!oembedResponse.ok) return undefined;
    const body = (await oembedResponse.json().catch(() => null)) as {
      thumbnail_url?: unknown;
    } | null;
    return readSoundcloudArtworkUrl(body?.thumbnail_url);
  } catch (error) {
    if (signal.aborted) throw error;
    return undefined;
  }
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const rawUrl = new URL(request.url).searchParams.get("url") ?? "";
    const mix = readMixUrl(rawUrl);
    if (!mix || mix.platform !== "soundcloud") {
      throw validationError("El mix no es un link de SoundCloud.");
    }

    const cached = thumbnailCache.get(mix.url);
    if (cached && cached.expiresAt > Date.now()) {
      return Response.json(
        { thumbnailUrl: cached.href },
        { headers: { "x-request-id": requestId, "cache-control": "public, max-age=3600" } },
      );
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    let thumbnailUrl: string | undefined;
    try {
      thumbnailUrl = await fetchSoundcloudArtwork(mix.url, controller.signal);
    } finally {
      clearTimeout(timer);
    }

    if (!thumbnailUrl) {
      return Response.json(
        { thumbnailUrl: null },
        { headers: { "x-request-id": requestId } },
      );
    }

    thumbnailCache.set(mix.url, {
      href: thumbnailUrl,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });

    return Response.json(
      { thumbnailUrl },
      { headers: { "x-request-id": requestId, "cache-control": "public, max-age=3600" } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
