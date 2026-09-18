const DEFAULT_DASHBOARD_ORIGIN = "http://localhost:3001";

function configuredDashboardOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_DASHBOARD_URL?.replace(/\/$/, "") ||
    DEFAULT_DASHBOARD_ORIGIN
  );
}

export function isAllowedDashboardOrigin(origin: string): boolean {
  if (origin === configuredDashboardOrigin()) return true;
  if (origin === DEFAULT_DASHBOARD_ORIGIN) return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" && url.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

export function tenantApiCorsHeaders(request: Request): Headers {
  const headers = new Headers();
  const origin = request.headers.get("origin");
  if (origin && isAllowedDashboardOrigin(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Vary", "Origin");
    headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "content-type, authorization");
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

export function withTenantCors(request: Request, response: Response): Response {
  const cors = tenantApiCorsHeaders(request);
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
