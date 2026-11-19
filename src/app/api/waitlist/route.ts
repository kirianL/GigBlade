import { validationError } from "@/domain/errors";
import { normalizeMeetingAvailability } from "@/domain/meeting-availability";
import { formatTilopayAmount } from "@/domain/tilopay";
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

const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const SLOTS_RATE_LIMIT = 40;
const SLOTS_RATE_WINDOW_MS = 60 * 1000;

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    assertCombinedRateLimit({
      ip: `${clientIp(request)}:waitlist-slots`,
      host: requestHost(request),
      limit: SLOTS_RATE_LIMIT,
      windowMs: SLOTS_RATE_WINDOW_MS,
    });

    const app = getApp();
    const [bookedSlots, settings] = await Promise.all([
      app.listBookedMeetingSlots(),
      app.getReferralSettings(),
    ]);
    const availability = normalizeMeetingAvailability(
      (settings.packagePrices as Record<string, unknown> | undefined)
        ?.meetingAvailability,
    );
    const pricing = app.tilopay.getPricing();

    return Response.json(
      {
        bookedSlots,
        availability,
        payment: {
          required: app.tilopay.isConfigured(),
          amount: pricing.amount,
          currency: pricing.currency,
          amountFormatted: formatTilopayAmount(pricing.amount, pricing.currency),
        },
      },
      {
        status: 200,
        headers: {
          "x-request-id": requestId,
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    const ip = clientIp(request);
    assertCombinedRateLimit({
      ip,
      host: requestHost(request),
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });
    assertValidPublicOrigin(request);

    const app = getApp();
    if (app.tilopay.isConfigured()) {
      throw validationError(
        "Debés completar el pago con Tilopay para reservar tu reunión.",
      );
    }

    const body = await readPublicJsonBody(request);
    const result = await app.joinWaitlist(body, ip);

    return Response.json(result, {
      status: result.alreadyJoined ? 200 : 201,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
