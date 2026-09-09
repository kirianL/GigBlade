import { get } from "@vercel/edge-config";

import { isLocalHostname } from "@/domain/hostname";
import { edgeConfigKey, type TenantRouting } from "@/domain/tenant";

function readDevFallback(hostname: string): TenantRouting | undefined {
  if (process.env.NODE_ENV === "production") {
    return undefined;
  }

  const tenantId = process.env.TENANT_DEV_ID;
  const expectedHost = (
    process.env.TENANT_DEV_HOSTNAME ?? "localhost"
  ).toLowerCase();

  if (!tenantId || hostname !== expectedHost || !isLocalHostname(hostname)) {
    return undefined;
  }

  return {
    id: tenantId,
    status: "active",
    canonicalHostname: hostname,
  };
}

export async function readTenantRouting(
  hostname: string,
): Promise<TenantRouting | undefined> {
  const developmentFallback = readDevFallback(hostname);

  if (developmentFallback) {
    return developmentFallback;
  }

  return get<TenantRouting>(edgeConfigKey(hostname));
}
