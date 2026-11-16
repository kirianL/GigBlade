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
const SLOTS_RATE_LIMIT = 40;
const SLOTS_RATE_WINDOW_MS = 60 * 1000;

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

function assertValidRequestOrigin(request: Request): void {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite === "cross-site") {
    throw validationError("Solicitud bloqueada por política de seguridad");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).hostname.toLowerCase();
      const targetHost = requestHost(request)
        .replace(/:\d+$/, "")
        .toLowerCase();
      if (
        originHost !== targetHost &&
        !originHost.endsWith(".gigblades.com") &&
        originHost !== "gigblades.com" &&
        originHost !== "localhost" &&
        originHost !== "127.0.0.1"
      ) {
        throw validationError("Origen no autorizado");
      }
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) throw err;
      throw validationError("Origen inválido");
    }
  }
}

export async function GET(request: Request) {
  const requestId = createRequestId();

  try {
    assertCombinedRateLimit({
      ip: `${clientIp(request)}:waitlist-slots`,
      host: requestHost(request),
      limit: SLOTS_RATE_LIMIT,
      windowMs: SLOTS_RATE_WINDOW_MS,
    });

    const signups = await getApp().listWaitlist();
    const now = Date.now() - 30 * 60 * 1000;
    const bookedSlots = signups
      .filter((s) => s.status !== "declined" && Boolean(s.meetingAt))
      .map((s) => s.meetingAt as string)
      .filter((iso) => {
        const t = new Date(iso).getTime();
        return !Number.isNaN(t) && t >= now;
      });

    return Response.json(
      { bookedSlots },
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
    assertValidRequestOrigin(request);

    const body = await readJsonBody(request);
    const result = await getApp().joinWaitlist(body, ip);

    return Response.json(result, {
      status: 201,
      headers: { "x-request-id": requestId },
    });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
