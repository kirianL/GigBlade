import { randomBytes, timingSafeEqual } from "node:crypto";
import { forbidden, unauthorized } from "@/domain/errors";
import {
  PLATFORM_MARKETING_HOST,
  PLATFORM_MARKETING_ORIGIN,
} from "@/domain/hostname";
import type { PanelPublicUser } from "@/domain/panel-auth";
import { isAllowedDashboardOrigin } from "@/lib/http/tenant-api-cors";

export const PANEL_SESSION_COOKIE = "gigblade_panel_token";
export const PANEL_CSRF_COOKIE = "gigblade_csrf";
export const PANEL_CSRF_HEADER = "x-panel-csrf";

const MUTABLE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

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

export function createCsrfToken(): string {
  return randomBytes(32).toString("base64url");
}

export function readPanelSessionToken(request: Request): string {
  const cookieToken = readCookie(
    request.headers.get("cookie"),
    PANEL_SESSION_COOKIE,
  );
  if (cookieToken) return cookieToken;
  throw unauthorized();
}

export function readPanelCsrfCookie(request: Request): string | null {
  return readCookie(request.headers.get("cookie"), PANEL_CSRF_COOKIE);
}

function isTrustedPanelOrigin(request: Request, origin: string): boolean {
  try {
    if (origin === new URL(request.url).origin) return true;
  } catch {
    // ignore
  }
  if (isAllowedDashboardOrigin(origin)) return true;
  if (
    origin === PLATFORM_MARKETING_ORIGIN ||
    origin === `https://www.${PLATFORM_MARKETING_HOST}`
  ) {
    return true;
  }
  return false;
}

export function assertTrustedOrigin(request: Request): void {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    throw forbidden("Origen de solicitud no autorizado.");
  }

  let origin = request.headers.get("origin")?.trim() || null;
  if (!origin) {
    const referer = request.headers.get("referer")?.trim();
    if (referer) {
      try {
        origin = new URL(referer).origin;
      } catch {
        origin = null;
      }
    }
  }

  if (!origin || !isTrustedPanelOrigin(request, origin)) {
    throw forbidden("Origen de solicitud no autorizado.");
  }
}

export function assertPanelCsrf(request: Request): void {
  const cookieToken = readPanelCsrfCookie(request);
  const headerToken = request.headers.get(PANEL_CSRF_HEADER)?.trim() || null;
  if (!cookieToken || !headerToken) {
    throw forbidden("Token CSRF inválido o ausente.");
  }

  const a = Buffer.from(cookieToken, "utf8");
  const b = Buffer.from(headerToken, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    throw forbidden("Token CSRF inválido o ausente.");
  }
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

function isSecureCookieRequest(request: Request): boolean {
  if (process.env.NODE_ENV === "production") return true;
  try {
    return new URL(request.url).protocol === "https:";
  } catch {
    return false;
  }
}

export function panelSessionSetCookie(
  request: Request,
  token: string,
): string {
  const secure = isSecureCookieRequest(request);
  const domain = cookieDomainForRequest(request);
  const maxAge = 60 * 60 * 24 * 30;
  return [
    `${PANEL_SESSION_COOKIE}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export function panelCsrfSetCookie(
  request: Request,
  csrfToken: string,
): string {
  const secure = isSecureCookieRequest(request);
  const domain = cookieDomainForRequest(request);
  const maxAge = 60 * 60 * 24 * 30;
  return [
    `${PANEL_CSRF_COOKIE}=${encodeURIComponent(csrfToken)}`,
    "Path=/",
    `Max-Age=${maxAge}`,
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export function panelSessionClearCookie(request: Request): string {
  const secure = isSecureCookieRequest(request);
  const domain = cookieDomainForRequest(request);
  return [
    `${PANEL_SESSION_COOKIE}=`,
    "Path=/",
    "HttpOnly",
    "Max-Age=0",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export function panelCsrfClearCookie(request: Request): string {
  const secure = isSecureCookieRequest(request);
  const domain = cookieDomainForRequest(request);
  return [
    `${PANEL_CSRF_COOKIE}=`,
    "Path=/",
    "Max-Age=0",
    "SameSite=Lax",
    ...(secure ? ["Secure"] : []),
    ...(domain ? [`Domain=${domain}`] : []),
  ].join("; ");
}

export async function requirePanelActor(
  request: Request,
): Promise<PanelPublicUser> {
  if (MUTABLE_METHODS.has(request.method.toUpperCase())) {
    assertTrustedOrigin(request);
    assertPanelCsrf(request);
  }
  const { getApp } = await import("@/lib/composition/app");
  return getApp().readPanelSession(readPanelSessionToken(request));
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
