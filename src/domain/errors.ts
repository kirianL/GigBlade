export type AppErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "SERVICE_UNAVAILABLE"
  | "CONFLICT";

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(
    code: AppErrorCode,
    message: string,
    status: number,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function validationError(message: string): AppError {
  return new AppError("VALIDATION_ERROR", message, 400);
}

export function notFound(message = "Recurso no encontrado"): AppError {
  return new AppError("NOT_FOUND", message, 404);
}

export function rateLimited(retryAfterSeconds: number): AppError {
  return new AppError(
    "RATE_LIMITED",
    "Demasiadas solicitudes",
    429,
    retryAfterSeconds,
  );
}

export function serviceUnavailable(message = "Servicio no disponible"): AppError {
  return new AppError("SERVICE_UNAVAILABLE", message, 503);
}
