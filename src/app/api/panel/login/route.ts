import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  assertTrustedOrigin,
  createCsrfToken,
  panelCsrfSetCookie,
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
    assertTrustedOrigin(request);
    assertCombinedRateLimit({
      ip: clientIp(request),
      host: requestHost(request),
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    const body = await readJsonBody(request);
    const session = await getApp().loginPanel(body);
    const csrfToken = createCsrfToken();
    const response = jsonWithTenantCors(
      request,
      { user: session.user, csrfToken },
      {
        requestId,
        durationMs: performance.now() - startedAt,
      },
    );
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    headers.append(
      "Set-Cookie",
      panelSessionSetCookie(request, session.token),
    );
    headers.append("Set-Cookie", panelCsrfSetCookie(request, csrfToken));
    headers.append("Set-Cookie", "logged_in_hint=; Path=/; Max-Age=0; SameSite=Lax");
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }
}
