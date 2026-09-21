import { serviceUnavailable } from "@/domain/errors";
import { assertRegisteredTemplate } from "@/domain/site-template";
import type { Tenant, TenantPlan, TenantStatus } from "@/domain/tenant";
import {
  readPostgrestResult,
  type PostgrestQueryContext,
} from "@/infrastructure/supabase/postgrest";
import { logPlatformEvent, raisePlatformAlert } from "@/lib/http/log";

export type TenantReadContext = PostgrestQueryContext & {
  operation:
    | "tenants.findById"
    | "tenants.list"
    | "tenants.create"
    | "tenants.updateSiteContent";
};

const PLANS = new Set<TenantPlan>(["all_inclusive"]);
const STATUSES = new Set<TenantStatus>(["active", "suspended", "canceled"]);

export function readTenantQueryResult(
  result: {
    data: unknown;
    error: { code?: string; message?: string } | null;
  },
  context: TenantReadContext = { operation: "tenants.findById" },
): Tenant | null {
  const data = readPostgrestResult(result, context);
  if (data == null) {
    return null;
  }

  return mapTenantRow(data, context);
}

export function mapTenantRow(
  data: unknown,
  context: TenantReadContext = { operation: "tenants.findById" },
): Tenant {
  if (!isRecord(data)) {
    failIncompleteTenant(context, ["row"]);
  }

  const missing = missingTenantFields(data);
  if (missing.length > 0) {
    failIncompleteTenant(
      context,
      missing,
      typeof data.id === "string" ? data.id : context.tenantId,
    );
  }

  return {
    id: data.id as string,
    slug: data.slug as string,
    plan: data.plan as TenantPlan,
    templateId: assertRegisteredTemplate(data.template_id as string),
    themeConfig: data.theme_config as Record<string, unknown>,
    status: data.status as TenantStatus,
  };
}

function missingTenantFields(data: Record<string, unknown>): string[] {
  const missing: string[] = [];
  if (typeof data.id !== "string") missing.push("id");
  if (typeof data.slug !== "string") missing.push("slug");
  if (!isPlan(data.plan)) missing.push("plan");
  if (typeof data.template_id !== "string") missing.push("template_id");
  if (!isRecord(data.theme_config)) missing.push("theme_config");
  if (!isStatus(data.status)) missing.push("status");
  return missing;
}

function failIncompleteTenant(
  context: TenantReadContext,
  missingFields: string[],
  tenantId = context.tenantId,
): never {
  const reason = `incomplete_row:${missingFields.join(",")}`;
  logPlatformEvent({
    level: "error",
    event: "postgrest_query_failed",
    operation: context.operation,
    tenantId,
    provider: "postgrest",
    reason,
  });
  raisePlatformAlert({
    operation: context.operation,
    tenantId,
    provider: "postgrest",
    reason,
    immediate: true,
  });
  throw serviceUnavailable("Esquema de tenant incompleto");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlan(value: unknown): value is TenantPlan {
  return typeof value === "string" && PLANS.has(value as TenantPlan);
}

function isStatus(value: unknown): value is TenantStatus {
  return typeof value === "string" && STATUSES.has(value as TenantStatus);
}
