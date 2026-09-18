import { getApp } from "@/lib/composition/app";
import { visitorFingerprint } from "@/application/sites/record-site-visit";
import { publicSiteVisitStats } from "@/domain/site-visits";
import { errorResponse } from "@/lib/http/errors";
import {
  assertCombinedRateLimit,
  clientIp,
  requestHost,
} from "@/lib/http/rate-limit";
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
    const stats = await getApp().getSiteVisitStats(context);
    return jsonWithTenantCors(request, stats, { requestId });
  } catch (error) {
    return withCors(request, errorResponse(error, requestId));
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    assertCombinedRateLimit({
      ip: clientIp(request),
      host: requestHost(request),
      limit: 120,
      windowMs: 10 * 60 * 1000,
    });
    const context = await getTenantContext();
    const stats = await getApp().recordSiteVisit(
      context,
      visitorFingerprint(
        context.tenantId,
        clientIp(request),
        request.headers.get("user-agent") ?? "",
      ),
    );
    return jsonWithTenantCors(request, publicSiteVisitStats(stats), { requestId });
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
