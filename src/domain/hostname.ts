const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

export function normalizeHostname(value: string): string {
  let host = value.trim().toLowerCase().replace(/\.$/, "");

  if (host.startsWith("[")) {
    const end = host.indexOf("]");
    return end === -1 ? host : host.slice(0, end + 1);
  }

  const colon = host.lastIndexOf(":");
  if (colon !== -1 && /^\d+$/.test(host.slice(colon + 1))) {
    host = host.slice(0, colon);
  }

  return host;
}

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname);
}

/** LAN/loopback IPs used to preview the marketing site from a phone. Not a tenant host. */
export function isLocalNetworkHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  if (isLocalHostname(normalized)) {
    return true;
  }

  if (!IPV4_PATTERN.test(normalized)) {
    return false;
  }

  const [a, b] = normalized.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    a === 169 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

const MARKETING_HOSTS = new Set([
  "gigblade.com",
  "www.gigblade.com",
  "gigblade.vercel.app",
]);

/** Apex, www, and Vercel URLs serve the platform landing, not a tenant site. */
export function isMarketingHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  if (MARKETING_HOSTS.has(normalized)) {
    return true;
  }

  return normalized.endsWith(".vercel.app");
}

export function isValidPublicHostname(hostname: string): boolean {
  if (isLocalHostname(hostname)) {
    return false;
  }

  return HOSTNAME_PATTERN.test(hostname);
}

export function canResolveHostname(hostname: string): boolean {
  const normalized = normalizeHostname(hostname);
  return isLocalHostname(normalized) || isValidPublicHostname(normalized);
}
