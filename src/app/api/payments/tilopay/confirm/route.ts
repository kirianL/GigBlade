import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  assertValidPublicOrigin,
  readPublicJsonBody,
} from "@/lib/http/public-post";
import {
  assertCombinedRateLimit,
  clientIp,
  requestHost,
} from "@/lib/http/rate-limit";
import { createRequestId } from "@/lib/http/request-id";
import {
  clearTilopayOrderCookieHeader,
  readCookieFromHeader,
  TILOPAY_ORDER_COOKIE,
  verifyTilopayOrderCookie,
} from "@/infrastructure/tilopay/signed-order-cookie";

const CONFIRM_RATE_LIMIT = 25;
const CONFIRM_RATE_WINDOW_MS = 10 * 60 * 1000;

function optionalStr(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const ip = clientIp(request);
    assertCombinedRateLimit({
      ip: `${ip}:tilopay-confirm`,
      host: requestHost(request),
      limit: CONFIRM_RATE_LIMIT,
      windowMs: CONFIRM_RATE_WINDOW_MS,
    });
    assertValidPublicOrigin(request);

    const body = (await readPublicJsonBody(request)) as Record<string, unknown>;
    const rawCookie = readCookieFromHeader(
      request.headers.get("cookie"),
      TILOPAY_ORDER_COOKIE,
    );
    const fallbackOrder = verifyTilopayOrderCookie(rawCookie);

    const orderNumber =
      optionalStr(body.orderNumber) ||
      optionalStr(body.order) ||
      optionalStr(body.returnData) ||
      fallbackOrder?.orderNumber ||
      "";

    const result = await getApp().confirmTilopayWaitlistPayment({
      orderNumber,
      fallbackOrder,
      callbackCode: optionalStr(body.code),
      callbackDescription: optionalStr(body.description),
      callbackAuth: optionalStr(body.auth),
      callbackTransactionId:
        optionalStr(body.tilopayTransactionId) ||
        optionalStr(body["tilopay-transaction"]),
    });

    const headers = new Headers({
      "x-request-id": requestId,
      "Cache-Control": "no-store, max-age=0",
    });

    if (result.confirmed) {
      headers.set("Set-Cookie", clearTilopayOrderCookieHeader());
    }

    return Response.json(result, { status: 200, headers });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
