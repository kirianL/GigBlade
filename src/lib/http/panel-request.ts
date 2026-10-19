import { unauthorized } from "@/domain/errors";
import type { PanelPublicUser } from "@/domain/panel-auth";

export const PANEL_SESSION_COOKIE = "gigblade_panel_token";

function readCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (key !== name) continue;
    const raw = part.slice(eq + 1).trim();
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

export function readBearerToken(request: Request): string {
  const header = request.headers.get("authorization");
  if (header?.toLowerCase().startsWith("bearer ")) {
    const token = header.slice(7).trim();
    if (token) return token;
  }
  const cookieToken = readCookie(
    request.headers.get("cookie"),
    PANEL_SESSION_COOKIE,
  );
  if (cookieToken) return cookieToken;
  throw unauthorized();
}

function cookieDomainForRequest(request: Request): string | undefined {
  const explicit = (
    process.env.PANEL_SESSION_COOKIE_DOMAIN ||
    process.env.PANEL_SESSION_COOKIE_Domain
  )?.trim();
  if (explicit) return explicit;
  try {
    const { hostname } = new URL(request.url);
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname.endsWith(".localhost") ||
      hostname.endsWith(".vercel.app")
    ) {
      return undefined;
    }
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join(".")}`;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function panelSessionSetCookie(
  request: Request,
  token: string,
): string {
  const secure = new URL(request.url).protocol === "https:";
  const sameSite = secure ? "None" : "Lax";
  const domain = cookieDomainForRequest(request);
  const maxAge = 60 * 60 * 24 * 30;
  return [
    `${PANEL_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAge}`,
    `SameSite=${sameSite}`,
    ...(secure ? ["Secure"] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export function panelSessionClearCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:";
  const sameSite = secure ? "None" : "Lax";
  const domain = cookieDomainForRequest(request);
  return [
    `${PANEL_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    `SameSite=${sameSite}`,
    ...(secure ? ["Secure"] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export async function requirePanelActor(
  request: Request,
): Promise<PanelPublicUser> {
  const { getApp } = await import("@/lib/composition/app");
  return getApp().readPanelSession(readBearerToken(request));
}

export async function requirePlatformActor(
  request: Request,
  message = "Solo la plataforma tiene acceso a esta acción.",
): Promise<PanelPublicUser> {
  const actor = await requirePanelActor(request);
  if (actor.role !== "platform") {
    throw unauthorized(message);
  }
  return actor;
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
