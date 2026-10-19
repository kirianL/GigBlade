const PLATFORM_CAPTCHA_HOSTS = new Set(["gigblades.com", "www.gigblades.com"]);

const CAPTCHA_THEMES = ["light", "dark", "auto"] as const;

export type CaptchaTheme = (typeof CAPTCHA_THEMES)[number];

export function parseCaptchaTheme(value: string | undefined): CaptchaTheme {
  if (value === "light" || value === "dark" || value === "auto") return value;
  return "auto";
}

/** El token de Turnstile tiene que nacer en gigblades.com, no en el dominio del DJ. */
export function isCaptchaTokenHostnameAllowed(
  hostname: string | undefined,
  isProd: boolean,
): boolean {
  const host = (hostname ?? "").trim().toLowerCase().replace(/\.$/, "");
  if (PLATFORM_CAPTCHA_HOSTS.has(host)) return true;
  if (!isProd && (host === "localhost" || host === "127.0.0.1")) return true;
  return false;
}

/** Origen del iframe que envía el token al formulario. */
export function isCaptchaFrameOrigin(origin: string, isProd: boolean): boolean {
  if (origin === "https://gigblades.com" || origin === "https://www.gigblades.com") {
    return true;
  }
  if (isProd) return false;

  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export function readCaptchaFrameToken(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const message = data as { source?: unknown; event?: unknown; token?: unknown };
  if (message.source !== "gigblade-turnstile" || message.event !== "token") {
    return null;
  }
  if (typeof message.token !== "string") return null;
  const token = message.token.trim();
  if (token.length < 10 || token.length > 2048) return null;
  return token;
}
