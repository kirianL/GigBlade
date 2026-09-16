import { afterEach, describe, expect, it, vi } from "vitest";

import { raisePlatformAlert, resetPlatformAlertStateForTests } from "@/lib/http/log";

afterEach(() => {
  vi.restoreAllMocks();
  resetPlatformAlertStateForTests();
});

function parsedLogs(): Array<Record<string, unknown>> {
  return vi
    .mocked(console.error)
    .mock.calls.map((call) => JSON.parse(String(call[0])) as Record<string, unknown>);
}

describe("raisePlatformAlert", () => {
  it("alerta de inmediato en un fallo de esquema", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    raisePlatformAlert({
      operation: "tenants.findById",
      provider: "postgrest",
      providerCode: "42703",
      reason: "undefined_column",
      immediate: true,
    });

    expect(parsedLogs()).toEqual([
      expect.objectContaining({
        event: "platform_alert",
        reason: "undefined_column",
        providerCode: "42703",
      }),
    ]);
  });

  it("alerta por volumen si el mismo fallo se dispara tres veces en un minuto", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const failure = {
      operation: "waitlist.insert",
      provider: "postgrest",
      reason: "query_failed",
    };

    raisePlatformAlert(failure);
    raisePlatformAlert(failure);
    expect(parsedLogs()).toEqual([]);

    raisePlatformAlert(failure);
    expect(parsedLogs()).toEqual([
      expect.objectContaining({
        event: "platform_alert",
        reason: "volume_spike:query_failed",
      }),
    ]);
  });
});
