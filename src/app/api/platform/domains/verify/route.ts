import { unauthorized, validationError } from "@/domain/errors";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { readBearerToken, readJsonBody } from "@/lib/http/panel-request";
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
    const actor = await getApp().readPanelSession(readBearerToken(request));
    if (actor.role !== "platform" && actor.role !== "dj") {
      throw unauthorized("No autorizado para verificar dominios.");
    }

    const body = (await readJsonBody(request)) as { domain?: unknown };
    if (typeof body.domain !== "string" || !body.domain.trim()) {
      throw validationError("Dominio requerido");
    }

    const domain = body.domain.trim().toLowerCase();
    const verified = await getApp().verifyPlatformDomain(domain);
    return jsonWithTenantCors(request, { domain: verified }, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
