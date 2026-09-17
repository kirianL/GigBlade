import {
  canResolveHostname,
  normalizeHostname,
} from "../../domain/hostname";
import {
  MEMORY_DEMO_ROUTING,
  type MemoryTenantRouting,
} from "./memory-demo-routing";

async function getRealRouting(
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
