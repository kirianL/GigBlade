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
  platformSitemap,
  tenantShouldIndex,
  tenantSitemap,
} from "@/lib/tenant/site-seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const requestHeaders = await headers();
  const tenantId = requestHeaders.get(TENANT_ID_HEADER);

  if (!tenantId) {
    return platformSitemap(SITE_URL);
  }

  const requestHost = normalizeHostname(
    requestHeaders.get(TENANT_HOSTNAME_HEADER) ||
      requestHeaders.get("host") ||
      "",
  );
  const canonicalHost = normalizeHostname(
    requestHeaders.get(TENANT_CANONICAL_HEADER) || requestHost,
  );
  const index = tenantShouldIndex({
    requestHostname: requestHost,
    canonicalHostname: canonicalHost,
    blockIndexing: process.env.VERCEL_ENV === "preview",
  });

  return index ? tenantSitemap(canonicalHost) : [];
}
