const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/;
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function normalizeHostname(value: string): string {
  return value.trim().toLowerCase().replace(/\.$/, "");
}

export function isLocalHostname(hostname: string): boolean {
  return LOCAL_HOSTS.has(hostname);
}

export function isValidPublicHostname(hostname: string): boolean {
  if (isLocalHostname(hostname)) {
    return false;
  }

  return HOSTNAME_PATTERN.test(hostname);
}
