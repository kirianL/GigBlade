import { validationError } from "@/domain/errors";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import {
  assertCombinedRateLimit,
  clientIp,
  requestHost,
} from "@/lib/http/rate-limit";
import { createRequestId } from "@/lib/http/request-id";

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

async function readJsonBody(request: Request): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(length) && length > MAX_BODY_BYTES) {
    throw validationError("La solicitud es demasiado grande");
  }

  try {
    return await request.json();
  } catch {
    throw validationError("El cuerpo no es JSON válido");
  }
}

export async function POST(request: Request) {
  const requestId = createRequestId();

  try {
    assertCombinedRateLimit({
      ip: clientIp(request),
      host: requestHost(request),
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });
    const body = await readJsonBody(request);
    const result = await getApp().joinWaitlist(body);

    return Response.json(result, {
      status: 201,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
