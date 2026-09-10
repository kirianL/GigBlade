import { type NextRequest, NextResponse } from "next/server";

import { isLocalHostname, isLocalNetworkHostname, normalizeHostname } from "@/domain/hostname";
import { getApp } from "@/lib/composition/app";
import {
  TENANT_CANONICAL_HEADER,
  TENANT_HOSTNAME_HEADER,
  TENANT_ID_HEADER,
} from "@/lib/tenant/headers";

export async function proxy(request: NextRequest) {
  const hostname = normalizeHostname(
    request.headers.get("host") || request.nextUrl.hostname,
  );

  if (isLocalNetworkHostname(hostname) && !isLocalHostname(hostname)) {
    return NextResponse.next();
  }

  let tenant;

  try {
    tenant = await getApp().resolveTenantRouting(hostname);
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
  requestHeaders.set(TENANT_ID_HEADER, tenant.id);
  requestHeaders.set(TENANT_HOSTNAME_HEADER, hostname);
  requestHeaders.set(TENANT_CANONICAL_HEADER, tenant.canonicalHostname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
