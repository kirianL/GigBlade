const DEFAULT_DASHBOARD_ORIGIN = "http://localhost:3001";

function allowedDashboardOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "") ||
    DEFAULT_DASHBOARD_ORIGIN
  );
}

export function tenantApiCorsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  if (origin && origin === allowedDashboardOrigin()) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET, PATCH, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "content-type");
  }
  return headers;
}

export function tenantApiPreflight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: tenantApiCorsHeaders(request),
  });
}

export function jsonWithTenantCors(
  request: Request,
  body: unknown,
  init: { status?: number; requestId: string },
): Response {
  const headers = tenantApiCorsHeaders(request);
  headers.set("content-type", "application/json");
  headers.set("x-request-id", init.requestId);
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}
