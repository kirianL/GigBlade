import { type NextRequest, NextResponse } from "next/server";

import { normalizeHostname } from "@/domain/hostname";
import { readTenantRouting } from "@/infrastructure/edge-config/read-tenant";
import {
  TENANT_CANONICAL_HEADER,
  TENANT_HOSTNAME_HEADER,
  TENANT_ID_HEADER,
} from "@/lib/tenant/headers";

export async function proxy(request: NextRequest) {
  const hostname = normalizeHostname(request.nextUrl.hostname);
  let tenant;

  try {
    tenant = await readTenantRouting(hostname);
  } catch {
    return new NextResponse(null, { status: 503 });
  }

  if (!tenant || tenant.status !== "active") {
    return new NextResponse(null, { status: 404 });
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
