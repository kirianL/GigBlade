import { unauthorized } from "@/domain/errors";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { readBearerToken } from "@/lib/http/panel-request";
import { createRequestId } from "@/lib/http/request-id";
import {
  jsonWithTenantCors,
  tenantApiPreflight,
} from "@/lib/http/tenant-api-cors";
import { getRequestTenantContext } from "@/lib/tenant/request-context";

export function OPTIONS(request: Request) {
  return tenantApiPreflight(request);
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const context = await getRequestTenantContext(request);
    const tenant = await getApp().getPublicTenant(context);

    return jsonWithTenantCors(request, tenant, { requestId });
  } catch (error) {
    return withCors(request, errorResponse(error, requestId));
  }
}

export async function PATCH(request: Request) {
  const requestId = createRequestId();

  try {
    const actor = await getApp().readPanelSession(readBearerToken(request));
    const context = await getRequestTenantContext(request);
    const current = await getApp().getPublicTenant(context);
    if (actor.role !== "platform" && actor.slug !== current.slug) {
      throw unauthorized("No podés editar este sitio.");
    }
    const input = await request.json().catch(() => null);
    const tenant = await getApp().updateTenantSiteContent(context, input);

    return jsonWithTenantCors(request, tenant, { requestId });
  } catch (error) {
    return withCors(request, errorResponse(error, requestId));
  }
}

function withCors(request: Request, response: Response): Response {
  const cors = tenantApiPreflight(request).headers;
  const headers = new Headers(response.headers);
  cors.forEach((value, key) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
