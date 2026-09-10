import { rateLimited, validationError } from "@/domain/errors";
import { getApp } from "@/lib/composition/app";
import { errorResponse } from "@/lib/http/errors";
import { createRequestId } from "@/lib/http/request-id";

const MAX_BODY_BYTES = 8 * 1024;
const RATE_LIMIT = 8;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const hits = new Map<string, number[]>();

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  return request.headers.get("x-real-ip") ?? "unknown";
}

function assertRateLimit(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter(
    (stamp) => now - stamp < RATE_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT) {
    throw rateLimited(Math.ceil((RATE_WINDOW_MS - (now - recent[0])) / 1000));
  }

  recent.push(now);
  hits.set(ip, recent);
}

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
    assertRateLimit(clientIp(request));
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
