import { AppError } from "@/domain/errors";
import { createRequestId } from "@/lib/http/request-id";

type ErrorBody = {
  code: string;
  message: string;
  requestId: string;
};

export function errorResponse(error: unknown, requestId = createRequestId()) {
  const body: ErrorBody =
    error instanceof AppError
      ? { code: error.code, message: error.message, requestId }
      : {
          code: "INTERNAL_ERROR",
          message: "Error interno",
          requestId,
        };

  const status = error instanceof AppError ? error.status : 500;
  const headers = new Headers({ "x-request-id": requestId });

  if (error instanceof AppError && error.retryAfterSeconds) {
    headers.set("Retry-After", String(error.retryAfterSeconds));
  }

  return Response.json(body, { status, headers });
}
