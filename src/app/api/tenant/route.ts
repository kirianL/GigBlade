import { unauthorized } from "@/domain/errors";
import { getApp, getRuntime } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { createRequestId } from "@/lib/http/request-id";
import {
  jsonWithTenantCors,
  tenantApiPreflight,
} from "@/lib/http/tenant-api-cors";
import { getTenantContext } from "@/lib/tenant/from-headers";

export function OPTIONS(request: Request) {
  return tenantApiPreflight(request);
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    const context = await getTenantContext();
    const tenant = await getApp().getPublicTenant(context);

    return jsonWithTenantCors(request, tenant, { requestId });
  } catch (error) {
    return withCors(request, errorResponse(error, requestId));
  }
}

export async function PATCH(request: Request) {
  const requestId = createRequestId();

  try {
    if (getRuntime() !== "memory") {
      throw unauthorized("El editor de contenido requiere sesión");
    }

    const context = await getTenantContext();
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
