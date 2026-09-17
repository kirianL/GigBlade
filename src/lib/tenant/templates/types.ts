import type { TenantSite } from "@/application/sites/resolve-tenant-site";
import type { ComponentType } from "react";

export type SiteTemplateProps = {
  site: TenantSite;
};

export type SiteTemplateRenderer = ComponentType<SiteTemplateProps>;
