import { unauthorized, validationError } from "@/domain/errors";
import { getApp } from "@/lib/composition/app";
import { scanDomainDns } from "@/infrastructure/domains/detector";
import {
  calculateRecommendedDnsRecords,
  detectProviderFromNameservers,
  generateProviderOneClickUrl,
  getProviderLabel,
  GIGBLADE_TARGET_IP,
  isApexDomain,
} from "@/domain/domain-automation";
import { errorResponse } from "@/lib/http/errors";
import { readJsonBody, requirePanelActor } from "@/lib/http/panel-request";
import { createRequestId } from "@/lib/http/request-id";
import {
  jsonWithTenantCors,
  tenantApiPreflight,
  withTenantCors,
} from "@/lib/http/tenant-api-cors";

export function OPTIONS(request: Request) {
  return tenantApiPreflight(request);
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await requirePanelActor(request);
    if (actor.role !== "platform" && actor.role !== "dj") {
      throw unauthorized("No autorizado para diagnosticar dominios.");
    }

    const body = (await readJsonBody(request)) as { domain?: unknown };
    if (typeof body.domain !== "string" || !body.domain.trim()) {
      throw validationError("Dominio requerido");
    }

    const domain = body.domain.trim().toLowerCase();
    const scan = await scanDomainDns(domain);
    const provider = detectProviderFromNameservers(scan.nameservers);
    const providerLabel = getProviderLabel(provider);
    const isApex = isApexDomain(domain);
    const oneClickUrl = generateProviderOneClickUrl(domain, provider);
    const recommendedRecords = calculateRecommendedDnsRecords(domain);
    let targetIp = GIGBLADE_TARGET_IP;
    let targetCname = "cname.vercel-dns.com";

    const app = getApp();
    if (app.projectDomains) {
      try {
        const targets = await app.projectDomains.getDnsTargets(domain);
        targetIp = targets.a;
        targetCname = targets.cname;
        for (const record of recommendedRecords) {
          if (record.type === "A") record.value = targets.a;
          if (record.type === "CNAME") record.value = targets.cname;
        }
      } catch {
        // Keep the published Vercel defaults.
      }
    }

    if (app.projectDomains) {
      try {
        const vercelStatus = await app.projectDomains.getStatus(domain);
        if (vercelStatus?.verification && vercelStatus.verification.length > 0) {
          const parts = domain.split(".");
          const apex =
            parts.length > 2 ? parts.slice(parts.length - 2).join(".") : domain;

          for (const ch of vercelStatus.verification) {
            if (ch.type.toUpperCase() === "TXT") {
              const chDomain = ch.domain.toLowerCase().replace(/\.$/, "");
              const normApex = apex.toLowerCase().replace(/\.$/, "");
              const recName =
                chDomain === normApex
                  ? "@"
                  : chDomain.endsWith("." + normApex)
                  ? chDomain.slice(0, -(normApex.length + 1))
                  : chDomain;

              if (
                !recommendedRecords.some(
                  (r) => r.type === "TXT" && r.name === recName,
                )
              ) {
                recommendedRecords.push({
                  type: "TXT",
                  name: recName,
                  value: ch.value,
                });
              }
            }
          }
        }
      } catch {
        // ignore
      }
    }

    return jsonWithTenantCors(
      request,
      {
        scan: {
          hostname: domain,
          provider,
          providerLabel,
          isApex,
          currentIps: scan.ips,
          currentCnames: scan.cnames,
          nameservers: scan.nameservers,
          targetIp,
          targetCname,
          pointsToGigBlade: scan.pointsToGigBlade,
          oneClickUrl,
          recommendedRecords,
        },
      },
      { requestId },
    );
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
