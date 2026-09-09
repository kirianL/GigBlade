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

  constructor(code: AppErrorCode, message: string, status: number) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
  }
}

export function notFound(message = "Recurso no encontrado"): AppError {
  return new AppError("NOT_FOUND", message, 404);
}

export function serviceUnavailable(message = "Servicio no disponible"): AppError {
  return new AppError("SERVICE_UNAVAILABLE", message, 503);
}
