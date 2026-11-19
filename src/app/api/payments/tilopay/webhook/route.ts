import { validationError } from "@/domain/errors";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  assertCombinedRateLimit,
  clientIp,
  requestHost,
} from "@/lib/http/rate-limit";
import { createRequestId } from "@/lib/http/request-id";

const WEBHOOK_RATE_LIMIT = 60;
const WEBHOOK_RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_WEBHOOK_BYTES = 32 * 1024;

function strField(
  data: Record<string, unknown>,
  ...keys: string[]
): string | null {
  for (const k of keys) {
    const val = data[k];
    if (typeof val === "string" && val.trim()) return val.trim();
    if (typeof val === "number" && Number.isFinite(val)) return String(val);
  }
  return null;
}

async function readWebhookPayload(
  request: Request,
): Promise<Record<string, unknown>> {
  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_WEBHOOK_BYTES) {
    throw validationError("La notificación excede el límite permitido");
  }

  const rawText = await request.text();
  if (rawText.length > MAX_WEBHOOK_BYTES) {
    throw validationError("La notificación excede el límite permitido");
  }

  const contentType = (request.headers.get("content-type") ?? "").toLowerCase();
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawText);
    const out: Record<string, unknown> = {};
    for (const [k, v] of params.entries()) {
      out[k] = v;
    }
    return out;
  }

  if (!rawText.trim()) return {};
  try {
    const parsed = JSON.parse(rawText);
    return parsed && typeof parsed === "object"
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    const params = new URLSearchParams(rawText);
    const out: Record<string, unknown> = {};
    for (const [k, v] of params.entries()) {
      out[k] = v;
    }
    return out;
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    assertCombinedRateLimit({
      ip: `${clientIp(request)}:tilopay-webhook`,
      host: requestHost(request),
      limit: WEBHOOK_RATE_LIMIT,
      windowMs: WEBHOOK_RATE_WINDOW_MS,
    });

    const data = await readWebhookPayload(request);
    const orderNumber = strField(data, "orderNumber", "order", "returnData");

    if (!orderNumber) {
      return Response.json(
        { ok: false, ignored: true },
        { status: 200, headers: { "x-request-id": requestId } },
      );
    }

    const result = await getApp().confirmTilopayWaitlistPayment({
      orderNumber,
      callbackCode: strField(data, "code"),
      callbackDescription: strField(data, "description"),
      callbackAuth: strField(data, "auth"),
      callbackTransactionId: strField(
        data,
        "tilopay-transaction",
        "tilopayTransactionId",
        "tpt",
        "id_tilopay",
      ),
    });

    return Response.json(
      { ok: true, confirmed: result.confirmed },
      { status: 200, headers: { "x-request-id": requestId } },
    );
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
