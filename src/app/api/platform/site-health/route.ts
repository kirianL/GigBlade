import { unauthorized } from "@/domain/errors";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { readBearerToken } from "@/lib/http/panel-request";
import { createRequestId } from "@/lib/http/request-id";
import {
  jsonWithTenantCors,
  tenantApiPreflight,
  withTenantCors,
} from "@/lib/http/tenant-api-cors";

export function OPTIONS(request: Request) {
  return tenantApiPreflight(request);
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    if (actor.role !== "platform") {
      throw unauthorized("Solo la plataforma puede auditar sitios.");
    }

    const report = await getApp().auditPlatformSites();
    return jsonWithTenantCors(request, report, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
