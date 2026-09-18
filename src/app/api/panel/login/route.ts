import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { readJsonBody } from "@/lib/http/panel-request";
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
    const body = await readJsonBody(request);
    const session = await getApp().loginPanel(body);
    return jsonWithTenantCors(request, session, { requestId });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
