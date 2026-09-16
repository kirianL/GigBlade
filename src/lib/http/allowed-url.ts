import { validationError } from "@/domain/errors";

const ALLOWED_HOSTS = new Set(["api.vercel.com", "api.cloudflare.com"]);

export function assertAllowedUrl(raw: string): URL {
  let url: URL;

  try {
    url = new URL(raw);
  } catch {
    throw validationError("URL no válida");
  }

  if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) {
    throw validationError("URL no permitida");
  }

  return url;
}
