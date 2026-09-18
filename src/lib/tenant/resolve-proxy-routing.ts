import {
  canResolveHostname,
  normalizeHostname,
} from "../../domain/hostname";
import {
  MEMORY_DEMO_ROUTING,
  type MemoryTenantRouting,
} from "./memory-demo-routing";

async function getEdgeConfigRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  const connection = process.env.EDGE_CONFIG;
  if (!connection) return undefined;

  const url = new URL(connection);
  const basePath = url.pathname.replace(/\/$/, "");
  url.pathname = `${basePath}/item/${encodeURIComponent(`tenant_${hostname}`)}`;

  const response = await fetch(url);
  if (!response.ok) return undefined;
  return (await response.json()) as MemoryTenantRouting;
}

async function getSupabaseRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return undefined;

  const endpoint = new URL("/rest/v1/tenant_domains", supabaseUrl);
  endpoint.searchParams.set("hostname", `eq.${hostname}`);
  endpoint.searchParams.set("select", "tenant_id,hostname,status");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) return undefined;

  const rows = (await response.json()) as Array<{
    tenant_id: string;
    hostname: string;
    status: "active" | "suspended";
  }>;
  const row = rows[0];
  if (!row) return undefined;

  return {
    id: row.tenant_id,
    status: row.status,
    canonicalHostname: row.hostname,
  };
}

async function getRealRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  return (
    (await getEdgeConfigRouting(hostname)) ??
    (await getSupabaseRouting(hostname)) ??
    MEMORY_DEMO_ROUTING[hostname]
  );
}

export async function resolveProxyRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  const normalized = normalizeHostname(hostname);

  if (!canResolveHostname(normalized)) {
    return undefined;
  }

  if (process.env.APP_RUNTIME === "real") {
    return getRealRouting(normalized);
  }

  return MEMORY_DEMO_ROUTING[normalized];
}
