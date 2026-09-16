import { afterEach, describe, expect, it, vi } from "vitest";

import {
  mapTenantRow,
  readTenantQueryResult,
} from "@/infrastructure/supabase/read-tenant-row";
import { resetPlatformAlertStateForTests } from "@/lib/http/log";

const row = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "nox",
  plan: "all_inclusive",
  template_id: "after",
  theme_config: { displayName: "Nox" },
  status: "active",
};

afterEach(() => {
  vi.restoreAllMocks();
  resetPlatformAlertStateForTests();
});

function logsByEvent(event: string): Array<Record<string, unknown>> {
  return vi
    .mocked(console.error)
    .mock.calls.map((call) => JSON.parse(String(call[0])) as Record<string, unknown>)
    .filter((entry) => entry.event === event);
}

describe("readTenantQueryResult", () => {
  it("no trata un error de esquema como tenant ausente", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    try {
      readTenantQueryResult(
        {
          data: null,
          error: {
            code: "42703",
            message: "column tenants.template_id does not exist",
          },
        },
        { operation: "tenants.findById", tenantId: row.id },
      );
    } catch (error) {
      expect(error).toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        status: 503,
      });
    }

    expect(logsByEvent("postgrest_query_failed")).toEqual([
      expect.objectContaining({
        operation: "tenants.findById",
        tenantId: row.id,
        providerCode: "42703",
        reason: "undefined_column",
      }),
    ]);
    expect(logsByEvent("platform_alert")).toEqual([
      expect.objectContaining({
        reason: "undefined_column",
        providerCode: "42703",
      }),
    ]);
  });

  it("devuelve null solo cuando no hay fila y no hay error", () => {
    expect(readTenantQueryResult({ data: null, error: null })).toBeNull();
  });

  it("falla cerrado si la fila llega sin template_id", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { template_id: _omitted, ...withoutTemplate } = row;

    try {
      mapTenantRow(withoutTemplate, {
        operation: "tenants.findById",
        tenantId: row.id,
      });
    } catch (error) {
      expect(error).toMatchObject({
        code: "SERVICE_UNAVAILABLE",
        status: 503,
      });
    }

    expect(logsByEvent("postgrest_query_failed")).toEqual([
      expect.objectContaining({
        reason: "incomplete_row:template_id",
        tenantId: row.id,
      }),
    ]);
  });

  it("no usa pista como fallback de un id fuera de catálogo", () => {
    try {
      mapTenantRow({ ...row, template_id: "neon" });
    } catch (error) {
      expect(error).toMatchObject({ code: "NOT_FOUND", status: 404 });
    }
  });

  it("mapea una fila completa al contrato de dominio", () => {
    expect(mapTenantRow(row)).toEqual({
      id: row.id,
      slug: "nox",
      plan: "all_inclusive",
      templateId: "after",
      themeConfig: { displayName: "Nox" },
      status: "active",
    });
  });
});
