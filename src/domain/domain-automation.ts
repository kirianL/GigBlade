import { normalizeHostname } from "@/domain/hostname";

export type DomainProvider =
  | "godaddy"
  | "cloudflare"
  | "namecom"
  | "namecheap"
  | "google"
  | "vercel"
  | "other";

export type DomainProvisionStatus =
  | "active"
  | "pending_dns"
  | "verifying"
  | "failed";

export type DomainDnsRecord = {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
};

export type DomainAutomationDetail = {
  hostname: string;
  tenantSlug: string;
  tenantName: string;
  provider: DomainProvider;
  providerLabel: string;
  isApex: boolean;
  currentIps: string[];
  currentCnames: string[];
  nameservers: string[];
  targetIp: string;
  targetCname: string;
  pointsToGigBlade: boolean;
  vercelVerified: boolean;
  edgeConfigSynced: boolean;
  sslActive: boolean;
  oneClickUrl: string | null;
  status: DomainProvisionStatus;
  lastCheckedAt: string;
  recommendedRecords: DomainDnsRecord[];
};

export const GIGBLADE_TARGET_IP = "76.76.21.21";
export const GIGBLADE_TARGET_CNAME = "cname.vercel-dns.com";

/** Vercel asigna CNAMEs como cname.vercel-dns.com o hash.vercel-dns-017.com. */
export function cnamePointsToVercel(cname: string): boolean {
  const host = cname.trim().toLowerCase().replace(/\.$/, "");
  return (
    host === "cname.vercel-dns.com" ||
    host.endsWith(".vercel-dns.com") ||
    /(?:^|\.)vercel-dns-\d+\.com$/.test(host)
  );
}

export function detectProviderFromNameservers(
  nameservers: string[],
): DomainProvider {
  const normalized = nameservers.map((ns) => ns.toLowerCase().trim());
  if (normalized.some((ns) => ns.includes("domaincontrol.com") || ns.includes("godaddy.com"))) {
    return "godaddy";
  }
  if (normalized.some((ns) => ns.includes("cloudflare.com"))) {
    return "cloudflare";
  }
  if (normalized.some((ns) => ns.includes("name.com"))) {
    return "namecom";
  }
  if (
    normalized.some(
      (ns) =>
        ns.includes("registrar-servers.com") ||
        ns.includes("namecheaphosting.com") ||
        ns.includes("namecheap.com"),
    )
  ) {
    return "namecheap";
  }
  if (normalized.some((ns) => ns.includes("googledomains.com") || ns.includes("google.com"))) {
    return "google";
  }
  if (normalized.some((ns) => ns.includes("vercel-dns.com") || ns.includes("vercel.com"))) {
    return "vercel";
  }
  return "other";
}

export function getProviderLabel(provider: DomainProvider): string {
  switch (provider) {
    case "godaddy":
      return "GoDaddy";
    case "cloudflare":
      return "Cloudflare";
    case "namecom":
      return "Name.com";
    case "namecheap":
      return "Namecheap";
    case "google":
      return "Google Domains";
    case "vercel":
      return "Vercel DNS";
    case "other":
    default:
      return "Otro registrador";
  }
}

export function isApexDomain(hostname: string): boolean {
  const parts = normalizeHostname(hostname).split(".");
  return parts.length === 2;
}

export function generateProviderOneClickUrl(
  domain: string,
  provider: DomainProvider,
): string | null {
  const clean = normalizeHostname(domain);
  if (provider === "godaddy") {
    // Enlace directo al gestor DNS de GoDaddy para este dominio
    return `https://dcc.godaddy.com/manage/dns?domain=${encodeURIComponent(clean)}`;
  }
  if (provider === "cloudflare") {
    return "https://dash.cloudflare.com/";
  }
  if (provider === "namecom") {
    return `https://www.name.com/account/domain/details/${encodeURIComponent(clean)}`;
  }
  if (provider === "namecheap") {
    return `https://ap.www.namecheap.com/domains/domaincontrolpanel/${encodeURIComponent(clean)}/advancedns`;
  }
  if (provider === "vercel") {
    return "https://vercel.com/dashboard";
  }
  return null;
}

export function calculateRecommendedDnsRecords(
  hostname: string,
): DomainDnsRecord[] {
  const clean = normalizeHostname(hostname);
  const apex = isApexDomain(clean);

  if (apex) {
    return [
      {
        type: "A",
        name: "@",
        value: GIGBLADE_TARGET_IP,
      },
      {
        type: "CNAME",
        name: "www",
        value: GIGBLADE_TARGET_CNAME,
      },
    ];
  }

  // Subdomain like dj.music.com
  const parts = clean.split(".");
  const subdomain = parts[0] || "@";
  return [
    {
      type: "CNAME",
      name: subdomain,
      value: GIGBLADE_TARGET_CNAME,
    },
  ];
}
