import "server-only";

import {
  calculateRecommendedDnsRecords,
  detectProviderFromNameservers,
  generateProviderOneClickUrl,
  getProviderLabel,
  GIGBLADE_TARGET_IP,
  isApexDomain,
  type DomainAutomationDetail,
  type DomainProvisionStatus,
} from "@/domain/domain-automation";
import { normalizeHostname } from "@/domain/hostname";

type DoHRecord = {
  name: string;
  type: number;
  TTL: number;
  data: string;
};

type DoHResponse = {
  Status: number;
  Answer?: DoHRecord[];
  Authority?: DoHRecord[];
};

async function fetchDoh(
  name: string,
  type: "A" | "CNAME" | "NS",
): Promise<DoHResponse | null> {
  // If localhost or local testing domain
  if (name.endsWith(".localhost") || name === "localhost") {
    return {
      Status: 0,
      Answer: [
        {
          name,
          type: type === "A" ? 1 : type === "CNAME" ? 5 : 2,
          TTL: 300,
          data: type === "A" ? GIGBLADE_TARGET_IP : "cname.vercel-dns.com",
        },
      ],
      Authority: [],
    };
  }

  let fallbackData: DoHResponse | null = null;

  // 1. Try Cloudflare DoH
  try {
    const url = new URL("https://cloudflare-dns.com/dns-query");
    url.searchParams.set("name", name);
    url.searchParams.set("type", type);

    const res = await fetch(url.toString(), {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = (await res.json()) as DoHResponse;
      if (data.Status === 0 && (data.Answer?.length || type === "NS")) {
        return data;
      }
      fallbackData = data;
    }
  } catch {
    // ignore and try fallback
  }

  // 2. Fallback to Google DoH
  try {
    const url = new URL("https://dns.google/resolve");
    url.searchParams.set("name", name);
    url.searchParams.set("type", type);

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(3500),
    });

    if (res.ok) {
      const data = (await res.json()) as DoHResponse;
      if (data.Status === 0 && (data.Answer?.length || type === "NS")) {
        return data;
      }
      if (!fallbackData) fallbackData = data;
    }
  } catch {
    // ignore
  }

  return fallbackData;
}

export type DomainDnsScan = {
  hostname: string;
  nameservers: string[];
  ips: string[];
  cnames: string[];
  pointsToGigBlade: boolean;
};

export async function scanDomainDns(hostname: string): Promise<DomainDnsScan> {
  const clean = normalizeHostname(hostname);

  // Extract apex domain for nameserver checks
  const parts = clean.split(".");
  const apex =
    parts.length > 2 ? parts.slice(parts.length - 2).join(".") : clean;

  const [aRes, cnameRes, nsRes] = await Promise.all([
    fetchDoh(clean, "A"),
    fetchDoh(clean, "CNAME"),
    fetchDoh(apex, "NS"),
  ]);

  const ips = (aRes?.Answer ?? [])
    .filter((record) => record.type === 1)
    .map((record) => record.data.trim());

  const cnames = (cnameRes?.Answer ?? [])
    .filter((record) => record.type === 5)
    .map((record) => record.data.replace(/\.$/, "").trim().toLowerCase());

  // Authority or Answer may have NS records
  const nsRecords = [
    ...(nsRes?.Answer ?? []),
    ...(nsRes?.Authority ?? []),
  ].filter((record) => record.type === 2);

  const nameservers = nsRecords.map((record) =>
    record.data.replace(/\.$/, "").trim().toLowerCase(),
  );

  const pointsToGigBlade =
    ips.includes(GIGBLADE_TARGET_IP) ||
    cnames.some((cname) => cname.includes("vercel-dns.com"));

  return {
    hostname: clean,
    nameservers,
    ips,
    cnames,
    pointsToGigBlade,
  };
}

export async function buildDomainAutomationDetail(input: {
  hostname: string;
  tenantSlug: string;
  tenantName: string;
  vercelVerified: boolean;
  edgeConfigSynced: boolean;
}): Promise<DomainAutomationDetail> {
  const { hostname, tenantSlug, tenantName, vercelVerified, edgeConfigSynced } =
    input;
  const scan = await scanDomainDns(hostname);
  const provider = detectProviderFromNameservers(scan.nameservers);
  const providerLabel = getProviderLabel(provider);
  const isApex = isApexDomain(hostname);
  const oneClickUrl = generateProviderOneClickUrl(hostname, provider);
  const recommendedRecords = calculateRecommendedDnsRecords(hostname);

  let status: DomainProvisionStatus = "pending_dns";
  if (vercelVerified && edgeConfigSynced) {
    status = "active";
  } else if (scan.pointsToGigBlade) {
    status = "verifying";
  }

  return {
    hostname,
    tenantSlug,
    tenantName,
    provider,
    providerLabel,
    isApex,
    currentIps: scan.ips,
    currentCnames: scan.cnames,
    nameservers: scan.nameservers,
    targetIp: GIGBLADE_TARGET_IP,
    targetCname: "cname.vercel-dns.com",
    pointsToGigBlade: scan.pointsToGigBlade,
    vercelVerified,
    edgeConfigSynced,
    sslActive: vercelVerified,
    oneClickUrl,
    status,
    lastCheckedAt: new Date().toISOString(),
    recommendedRecords,
  };
}
