import { serviceUnavailable } from "@/domain/errors";
import { logPlatformEvent, raisePlatformAlert } from "@/lib/http/log";

export type PostgrestError = {
  code?: string;
  message?: string;
};

export type PostgrestQueryContext = {
  operation: string;
  tenantId?: string;
};

const SCHEMA_CODES: Record<string, string> = {
  "42703": "undefined_column",
  "42P01": "undefined_table",
  PGRST204: "schema_cache_column",
  PGRST205: "schema_cache_table",
};

export function postgrestFailureReason(code: string | undefined): string {
  if (code && SCHEMA_CODES[code]) {
    return SCHEMA_CODES[code];
  }
  return "query_failed";
}

export function isPostgrestSchemaFailure(code: string | undefined): boolean {
  return Boolean(code && SCHEMA_CODES[code]);
}

export function readPostgrestResult<T>(
  result: { data: T | null; error: PostgrestError | null },
  context: PostgrestQueryContext,
): T | null {
  if (result.error) {
    failPostgrestQuery(result.error, context);
  }

  return result.data ?? null;
}

export function failPostgrestQuery(
  error: PostgrestError,
  context: PostgrestQueryContext,
): never {
  const reason = postgrestFailureReason(error.code);

  logPlatformEvent({
    level: "error",
    event: "postgrest_query_failed",
    operation: context.operation,
    tenantId: context.tenantId,
    provider: "postgrest",
    providerCode: error.code,
    reason,
  });

  raisePlatformAlert({
    operation: context.operation,
    tenantId: context.tenantId,
    provider: "postgrest",
    providerCode: error.code,
    reason,
    immediate: isPostgrestSchemaFailure(error.code),
  });

  if (error.code === "PGRST301" || /unregistered api key|jwt/i.test(error.message ?? "")) {
    throw serviceUnavailable(
      "Supabase rechazó la API key. En Vercel, SUPABASE_SERVICE_ROLE_KEY tiene que ser la secret actual (sb_secret_…), no la publishable.",
    );
  }

  throw serviceUnavailable("No se pudo completar la operación");
}
