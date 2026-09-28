import {
  canResolveHostname,
  normalizeHostname,
} from "../../domain/hostname";
import {
  MEMORY_DEMO_ROUTING,
  type MemoryTenantRouting,
} from "./memory-demo-routing";
import { isPreviewHostname } from "../../domain/site-visits";
import { isTenantPreviewHostname } from "../../domain/site-surface";
import { resolveIndexedHostname } from "./site-seo";
import { resolveAppRuntime } from "../env/supabase";

async function getEdgeConfigRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  const connection = process.env.EDGE_CONFIG;
  if (!connection) return undefined;

  const url = new URL(connection);
  const basePath = url.pathname.replace(/\/$/, "");
  url.pathname = `${basePath}/item/${encodeURIComponent(`tenant_${hostname}`)}`;

  const response = await fetch(url, { signal: AbortSignal.timeout(2500) });
  if (!response.ok) return undefined;
  const body = (await response.json()) as MemoryTenantRouting | null;
  if (!body?.id || !body.canonicalHostname) return undefined;
  return body;
}

async function getSupabaseRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceRole =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceRole) return undefined;

  const endpoint = new URL("/rest/v1/tenant_domains", supabaseUrl);
  endpoint.searchParams.set("hostname", `eq.${hostname}`);
  endpoint.searchParams.set("select", "tenant_id,hostname,status,is_canonical");
  endpoint.searchParams.set("limit", "1");

  const response = await fetch(endpoint, {
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(4000),
  });
  if (!response.ok) return undefined;

  const rows = (await response.json()) as Array<{
    tenant_id: string;
    hostname: string;
    status: "active" | "suspended";
    is_canonical: boolean;
  }>;
  const row = rows[0];
  if (!row) return undefined;

  let preferredHostname: string | null = null;
  if (!row.is_canonical && !isPreviewHostname(row.hostname)) {
    const canonicalEndpoint = new URL("/rest/v1/tenant_domains", supabaseUrl);
    canonicalEndpoint.searchParams.set("tenant_id", `eq.${row.tenant_id}`);
    canonicalEndpoint.searchParams.set("is_canonical", "eq.true");
    canonicalEndpoint.searchParams.set("status", "eq.active");
    canonicalEndpoint.searchParams.set("select", "hostname");
    canonicalEndpoint.searchParams.set("limit", "1");
    const canonicalResponse = await fetch(canonicalEndpoint, {
      headers: {
        apikey: serviceRole,
        Authorization: `Bearer ${serviceRole}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    if (canonicalResponse.ok) {
      const canonicalRows = (await canonicalResponse.json()) as Array<{
        hostname: string;
      }>;
      preferredHostname = canonicalRows[0]?.hostname ?? null;
    }
  }

  return {
    id: row.tenant_id,
    status: row.status,
    canonicalHostname: resolveIndexedHostname({
      requestHostname: row.hostname,
      isCanonical: Boolean(row.is_canonical),
      canonicalHostname: preferredHostname,
    }),
  };
}

async function getRealRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  try {
    const edge = await getEdgeConfigRouting(hostname);
    if (edge) return edge;
  } catch (error) {
    if (!isTenantPreviewHostname(hostname)) throw error;
  }

  try {
    const row = await getSupabaseRouting(hostname);
    if (row) return row;
  } catch (error) {
    if (!isTenantPreviewHostname(hostname)) throw error;
  }

  return MEMORY_DEMO_ROUTING[hostname];
}

export async function resolveProxyRouting(
  hostname: string,
): Promise<MemoryTenantRouting | undefined> {
  const normalized = normalizeHostname(hostname);

  if (!canResolveHostname(normalized)) {
    return undefined;
  }

  if (resolveAppRuntime() === "real") {
    return getRealRouting(normalized);
  }

  return MEMORY_DEMO_ROUTING[normalized];
}
