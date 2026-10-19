import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  panelSessionClearCookie,
  readBearerToken,
} from "@/lib/http/panel-request";
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
  const startedAt = performance.now();

  try {
    const token = readBearerToken(request);
    const user = await getApp().readPanelSession(token);
    return jsonWithTenantCors(
      request,
      { user, token },
      { requestId, durationMs: performance.now() - startedAt },
    );
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();
  const response = jsonWithTenantCors(request, { ok: true }, { requestId });
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", panelSessionClearCookie(request));
  headers.append("Set-Cookie", "logged_in_hint=; Path=/; Max-Age=0; SameSite=Lax");
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
