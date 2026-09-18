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
    const body = await readJsonBody(request);
    const generated = await getApp().generateDjPassword(actor, body);
    return jsonWithTenantCors(
      request,
      {
        email: generated.email,
        name: generated.name,
        slug: generated.slug,
        password: generated.password,
      },
      { requestId },
    );
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
