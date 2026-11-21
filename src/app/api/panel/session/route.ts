import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  assertPanelCsrf,
  assertTrustedOrigin,
  createCsrfToken,
  panelCsrfClearCookie,
  panelCsrfSetCookie,
  panelSessionClearCookie,
  readPanelCsrfCookie,
  readPanelSessionToken,
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
    const token = readPanelSessionToken(request);
    const user = await getApp().readPanelSession(token);
    const existingCsrf = readPanelCsrfCookie(request);
    const csrfToken = existingCsrf || createCsrfToken();

    const response = jsonWithTenantCors(
      request,
      { user, csrfToken },
      { requestId, durationMs: performance.now() - startedAt },
    );
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    headers.append("Vary", "Cookie");
    if (!existingCsrf) {
      headers.append("Set-Cookie", panelCsrfSetCookie(request, csrfToken));
    }
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    const response = withTenantCors(request, errorResponse(error, requestId));
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, {
      status: response.status,
      headers,
    });
  }
}

export async function DELETE(request: Request) {
  const requestId = createRequestId();
  try {
    assertTrustedOrigin(request);
    let token: string | null = null;
    try {
      token = readPanelSessionToken(request);
    } catch {
      token = null;
    }
    if (token) {
      assertPanelCsrf(request);
      await getApp().logoutPanel(token);
    }
  } catch (error) {
    return withTenantCors(request, errorResponse(error, requestId));
  }

  const response = jsonWithTenantCors(request, { ok: true }, { requestId });
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.append("Set-Cookie", panelSessionClearCookie(request));
  headers.append("Set-Cookie", panelCsrfClearCookie(request));
  headers.append("Set-Cookie", "logged_in_hint=; Path=/; Max-Age=0; SameSite=Lax");
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
