import { headers } from "next/headers";

import { notFound } from "@/domain/errors";
import type { TenantContext } from "@/domain/tenant";
import {
  TENANT_CANONICAL_HEADER,
  TENANT_HOSTNAME_HEADER,
  TENANT_ID_HEADER,
} from "@/lib/tenant/headers";

export async function getTenantContext(): Promise<TenantContext> {
  const requestHeaders = await headers();
  const tenantId = requestHeaders.get(TENANT_ID_HEADER);
  const hostname = requestHeaders.get(TENANT_HOSTNAME_HEADER);
  const canonicalHostname =
    requestHeaders.get(TENANT_CANONICAL_HEADER) ?? hostname;

  if (!tenantId || !hostname || !canonicalHostname) {
    throw notFound("Tenant no resuelto");
  }

  return { tenantId, hostname, canonicalHostname };
}
