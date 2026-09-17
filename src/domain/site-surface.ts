import {
  isLocalHostname,
  isLocalNetworkHostname,
  isMarketingHostname,
  normalizeHostname,
} from "./hostname";

export function isTenantPreviewHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return normalized.endsWith(".localhost") && normalized !== "localhost";
}

export function servesTenantSiteSurface(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);

  if (isMarketingHostname(normalized)) {
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
    pathname.startsWith("/dashboard")
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
