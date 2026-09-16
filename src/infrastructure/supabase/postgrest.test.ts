import { afterEach, describe, expect, it, vi } from "vitest";

import {
  isPostgrestSchemaFailure,
  postgrestFailureReason,
  readPostgrestResult,
} from "@/infrastructure/supabase/postgrest";
import { resetPlatformAlertStateForTests } from "@/lib/http/log";

afterEach(() => {
  vi.restoreAllMocks();
  resetPlatformAlertStateForTests();
});

describe("readPostgrestResult", () => {
  it("no trata un error de esquema como fila ausente", () => {
    resetPlatformAlertStateForTests();
    vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() =>
      readPostgrestResult(
        {
          data: null,
          error: { code: "42703", message: "column tenants.template_id does not exist" },
        },
        { operation: "tenants.findById", tenantId: "tenant-1" },
      ),
    ).toThrow();

    try {
      readPostgrestResult(
        { data: null, error: { code: "PGRST204" } },
        { operation: "waitlist.findByEmail" },
      );
    } catch (error) {
      expect(error).toMatchObject({ code: "SERVICE_UNAVAILABLE", status: 503 });
    }
  });

  it("devuelve null solo cuando no hay fila y no hay error", () => {
    expect(
      readPostgrestResult(
        { data: null, error: null },
        { operation: "tenants.findById" },
      ),
    ).toBeNull();
  });

  it("devuelve la fila cuando la consulta es correcta", () => {
    expect(
      readPostgrestResult(
        { data: { id: "1" }, error: null },
        { operation: "tenants.findById" },
      ),
    ).toEqual({ id: "1" });
  });

  it("clasifica códigos de esquema de PostgREST", () => {
    expect(isPostgrestSchemaFailure("42703")).toBe(true);
    expect(isPostgrestSchemaFailure("42P01")).toBe(true);
    expect(isPostgrestSchemaFailure("PGRST204")).toBe(true);
    expect(isPostgrestSchemaFailure("23505")).toBe(false);
    expect(postgrestFailureReason("42703")).toBe("undefined_column");
    expect(postgrestFailureReason("23505")).toBe("query_failed");
  });
});
