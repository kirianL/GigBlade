import {
  isDashboardHostname,
  isLocalHostname,
  isLocalNetworkHostname,
  isMarketingHostname,
  normalizeHostname,
} from "./hostname";

export function isTenantPreviewHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  if (isDashboardHostname(normalized)) {
    return false;
  }
  return normalized.endsWith(".localhost") && normalized !== "localhost";
}

export function servesTenantSiteSurface(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);

  if (isMarketingHostname(normalized) || isDashboardHostname(normalized)) {
    return false;
  }

  if (isTenantPreviewHostname(normalized)) {
    return true;
  }

  if (isLocalHostname(normalized) || isLocalNetworkHostname(normalized)) {
    return false;
  }

  return true;
}

export function tenantSiteRewritePath(pathname: string): string | null {
  if (
    pathname.startsWith("/api/") ||
    pathname === "/api" ||
    pathname.startsWith("/site") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/overview") ||
    pathname.startsWith("/djs") ||
    pathname.startsWith("/referidos") ||
    pathname.startsWith("/distribucion") ||
    pathname.startsWith("/distribution") ||
    pathname.startsWith("/bookings") ||
    pathname.startsWith("/lista") ||
    pathname.startsWith("/domains") ||
    pathname.startsWith("/health") ||
    pathname.startsWith("/plan") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/studio") ||
    pathname === "/login" ||
    pathname.startsWith("/sign-in")
  ) {
    return null;
  }

  if (pathname.includes(".")) {
    return null;
  }

  if (pathname === "/") {
    return "/site";
  }

  return `/site${pathname}`;
}
