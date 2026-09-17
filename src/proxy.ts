import { type NextRequest, NextResponse } from "next/server";

import {
  isLocalHostname,
  isLocalNetworkHostname,
  isMarketingHostname,
  normalizeHostname,
} from "./domain/hostname";
import {
  isTenantPreviewHostname,
  servesTenantSiteSurface,
  tenantSiteRewritePath,
} from "./domain/site-surface";
import {
  TENANT_CANONICAL_HEADER,
  TENANT_HOSTNAME_HEADER,
  TENANT_ID_HEADER,
} from "./lib/tenant/headers";
import { resolveProxyRouting } from "./lib/tenant/resolve-proxy-routing";

function stripClientTenantHeaders(headers: Headers) {
  headers.delete(TENANT_ID_HEADER);
  headers.delete(TENANT_HOSTNAME_HEADER);
  headers.delete(TENANT_CANONICAL_HEADER);
}

export async function proxy(request: NextRequest) {
  const hostname = normalizeHostname(
    request.headers.get("host") || request.nextUrl.hostname,
  );

  if (
    isMarketingHostname(hostname) ||
    ((isLocalHostname(hostname) || isLocalNetworkHostname(hostname)) &&
      !isTenantPreviewHostname(hostname))
  ) {
    const headers = new Headers(request.headers);
    stripClientTenantHeaders(headers);
    return NextResponse.next({ request: { headers } });
  }

  let tenant;

  try {
    tenant = await resolveProxyRouting(hostname);
  } catch {
    return new NextResponse("Service unavailable", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (!tenant || tenant.status !== "active") {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const requestHeaders = new Headers(request.headers);
  stripClientTenantHeaders(requestHeaders);
  requestHeaders.set(TENANT_ID_HEADER, tenant.id);
  requestHeaders.set(TENANT_HOSTNAME_HEADER, hostname);
  requestHeaders.set(TENANT_CANONICAL_HEADER, tenant.canonicalHostname);

  if (servesTenantSiteSurface(hostname)) {
    const rewritePath = tenantSiteRewritePath(request.nextUrl.pathname);
    if (rewritePath) {
      const url = request.nextUrl.clone();
      url.pathname = rewritePath;
      return NextResponse.rewrite(url, {
        request: { headers: requestHeaders },
      });
    }
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/|favicon.ico).*)"],
};
