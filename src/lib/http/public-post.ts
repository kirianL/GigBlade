import { validationError } from "@/domain/errors";
import { requestHost } from "@/lib/http/rate-limit";

const DEFAULT_MAX_BODY_BYTES = 8 * 1024;

export async function readPublicJsonBody(
  request: Request,
  maxBytes = DEFAULT_MAX_BODY_BYTES,
): Promise<unknown> {
  const length = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(length) && length > maxBytes) {
    throw validationError("La solicitud es demasiado grande");
  }

  try {
    return await request.json();
  } catch {
    throw validationError("El cuerpo no es JSON válido");
  }
}

export function isAllowedPublicOriginHost(
  originHost: string,
  targetHost: string,
): boolean {
  const cleanOrigin = originHost.toLowerCase();
  const cleanTarget = targetHost.replace(/:\d+$/, "").toLowerCase();
  return (
    cleanOrigin === cleanTarget ||
    cleanOrigin.endsWith(".gigblades.com") ||
    cleanOrigin === "gigblades.com" ||
    cleanOrigin === "localhost" ||
    cleanOrigin === "127.0.0.1"
  );
}

export function assertValidPublicOrigin(request: Request): void {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite === "cross-site") {
    throw validationError("Solicitud bloqueada por política de seguridad");
  }

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originHost = new URL(origin).hostname;
      if (!isAllowedPublicOriginHost(originHost, requestHost(request))) {
        throw validationError("Origen no autorizado");
      }
    } catch (err) {
      if (err && typeof err === "object" && "code" in err) throw err;
      throw validationError("Origen inválido");
    }
  }
}

export function resolveSafeRequestOrigin(request: Request): string {
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      // Fallback below
    }
  }

  const forwardedHost =
    request.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    requestHost(request);
  const forwardedProto = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const isLocal =
    forwardedHost.startsWith("localhost") ||
    forwardedHost.startsWith("127.0.0.1");
  const protocol = forwardedProto || (isLocal ? "http" : "https");
  const safeHost =
    forwardedHost && forwardedHost !== "unknown"
      ? forwardedHost
      : "gigblades.com";
  return `${protocol}://${safeHost}`;
}
