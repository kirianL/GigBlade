import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  panelSessionSetCookie,
  readJsonBody,
} from "@/lib/http/panel-request";
import {
  assertCombinedRateLimit,
  clientIp,
  requestHost,
} from "@/lib/http/rate-limit";
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
  const startedAt = performance.now();

  try {
    assertCombinedRateLimit({
      ip: clientIp(request),
      host: requestHost(request),
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    const body = await readJsonBody(request);
    const session = await getApp().loginPanel(body);
    const response = jsonWithTenantCors(request, session, {
      requestId,
      durationMs: performance.now() - startedAt,
    });
    const headers = new Headers(response.headers);
    headers.append(
      "Set-Cookie",
      panelSessionSetCookie(request, session.token),
    );
    headers.append("Set-Cookie", "logged_in_hint=1; Path=/; Max-Age=2592000; SameSite=Lax");
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
