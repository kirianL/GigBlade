import { getApp } from "@/lib/composition/app";
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
import { getRequestTenantContext } from "@/lib/tenant/request-context";

export function OPTIONS(request: Request) {
  return tenantApiPreflight(request);
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    assertCombinedRateLimit({
      ip: clientIp(request),
      host: requestHost(request),
      limit: 15,
      windowMs: 10 * 60 * 1000,
    });

    const context = await getRequestTenantContext(request);
    const body = await request.json().catch(() => null);
    const booking = await getApp().createBooking(
      context,
      body,
      clientIp(request),
    );

    return jsonWithTenantCors(
      request,
      {
        success: true,
        booking: {
          id: booking.id,
          name: booking.name,
          eventType: booking.eventType,
          eventDate: booking.eventDate,
          createdAt: booking.createdAt,
        },
      },
      { requestId, status: 201 },
    );
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
