import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  assertValidPublicOrigin,
  readPublicJsonBody,
  resolveSafeRequestOrigin,
} from "@/lib/http/public-post";
import {
  assertCombinedRateLimit,
  clientIp,
  requestHost,
} from "@/lib/http/rate-limit";
import { createRequestId } from "@/lib/http/request-id";
import {
  buildTilopayOrderCookieHeader,
  readCookieFromHeader,
  signTilopayOrderCookie,
  TILOPAY_ORDER_COOKIE,
  verifyTilopayOrderCookie,
} from "@/infrastructure/tilopay/signed-order-cookie";

const SESSION_RATE_LIMIT = 10;
const SESSION_RATE_WINDOW_MS = 10 * 60 * 1000;

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const ip = clientIp(request);
    assertCombinedRateLimit({
      ip: `${ip}:tilopay-session`,
      host: requestHost(request),
      limit: SESSION_RATE_LIMIT,
      windowMs: SESSION_RATE_WINDOW_MS,
    });
    assertValidPublicOrigin(request);

    const priorCookie = readCookieFromHeader(
      request.headers.get("cookie"),
      TILOPAY_ORDER_COOKIE,
    );
    const priorOrder = verifyTilopayOrderCookie(priorCookie);

    const body = await readPublicJsonBody(request);
    const origin = resolveSafeRequestOrigin(request);
    const result = await getApp().startTilopayWaitlistCheckout(
      body,
      origin,
      ip,
      priorOrder?.orderNumber ?? null,
    );

    if (result.discarded) {
      return Response.json(
        { discarded: true },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    if (result.alreadyJoined) {
      return Response.json(
        {
          alreadyJoined: true,
          meetingAt: result.meetingAt,
        },
        {
          status: 200,
          headers: {
            "x-request-id": requestId,
            "Cache-Control": "no-store, max-age=0",
          },
        },
      );
    }

    const signedCookie = signTilopayOrderCookie(result.order);
    const headers = new Headers({
      "x-request-id": requestId,
      "Cache-Control": "no-store, max-age=0",
      "Set-Cookie": buildTilopayOrderCookieHeader(signedCookie),
    });

    return Response.json(
      {
        alreadyJoined: false,
        sdkToken: result.sdkToken,
        orderNumber: result.orderNumber,
        amount: result.amount,
        currency: result.currency,
        amountFormatted: result.amountFormatted,
        redirectUrl: result.redirectUrl,
        webhookUrl: result.webhookUrl,
        billingDefaults: result.billingDefaults,
      },
      { status: 200, headers },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
