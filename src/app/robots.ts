import type { MetadataRoute } from "next";
import { headers } from "next/headers";

import { normalizeHostname } from "@/domain/hostname";
import { SITE_URL } from "@/lib/seo";
import {
  TENANT_CANONICAL_HEADER,
  TENANT_HOSTNAME_HEADER,
  TENANT_ID_HEADER,
} from "@/lib/tenant/headers";
import {
  platformRobots,
  tenantRobots,
  tenantShouldIndex,
} from "@/lib/tenant/site-seo";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const requestHeaders = await headers();
  const tenantId = requestHeaders.get(TENANT_ID_HEADER);
  const blockIndexing = process.env.VERCEL_ENV === "preview";

  if (tenantId) {
    const requestHost = normalizeHostname(
      requestHeaders.get(TENANT_HOSTNAME_HEADER) ||
        requestHeaders.get("host") ||
        "",
    );
    const canonicalHost = normalizeHostname(
      requestHeaders.get(TENANT_CANONICAL_HEADER) || requestHost,
    );
    return tenantRobots(
      canonicalHost,
      tenantShouldIndex({
        requestHostname: requestHost,
        canonicalHostname: canonicalHost,
        blockIndexing,
      }),
    );
  }

  return platformRobots(SITE_URL, blockIndexing);
}
