export type TenantStatus = "active" | "suspended" | "canceled";
export type TenantRoutingStatus = "active" | "suspended";

export type TenantRouting = {
  id: string;
  status: TenantRoutingStatus;
  canonicalHostname: string;
};

export type TenantContext = {
  tenantId: string;
  hostname: string;
  canonicalHostname: string;
};

export type PublicTenant = {
  slug: string;
  domain: string;
  themeConfig: Record<string, unknown>;
};

export function edgeConfigKey(hostname: string): string {
  return `tenant_${hostname}`;
}
