import { cache } from "react";
import { notFound } from "next/navigation";

import { AppError } from "@/domain/errors";
import { resolveTenantSite } from "@/application/sites/resolve-tenant-site";
import type { TenantSite } from "@/application/sites/resolve-tenant-site";
import { getApp } from "@/lib/composition/app";
import { getTenantContext } from "@/lib/tenant/from-headers";

export const loadTenantSite = cache(async (): Promise<TenantSite> => {
  try {
    const context = await getTenantContext();
    return await resolveTenantSite(getApp().tenants, context);
  } catch (error) {
    if (error instanceof AppError && error.code === "SERVICE_UNAVAILABLE") {
      throw error;
    }

    notFound();
  }
});
