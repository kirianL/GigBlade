import { unauthorized } from "@/domain/errors";
import { getApp, getRuntime } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { createRequestId } from "@/lib/http/request-id";
import {
  jsonWithTenantCors,
  tenantApiPreflight,
} from "@/lib/http/tenant-api-cors";

export function OPTIONS(request: Request) {
  return tenantApiPreflight(request);
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    if (getRuntime() !== "memory") {
      throw unauthorized("El listado de dominios requiere sesión");
    }

    const sites = await getApp().listPlatformSites();
    return jsonWithTenantCors(request, { sites }, { requestId });
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
