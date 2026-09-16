import { headers } from "next/headers";

import { resolveTrustedTenantContext } from "@/application/tenants/resolve-trusted-tenant-context";
import { getApp } from "@/lib/composition/app";

export async function getTenantContext() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "";

  return resolveTrustedTenantContext(getApp().routing, host);
}
