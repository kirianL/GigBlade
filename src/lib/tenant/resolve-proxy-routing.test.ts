import { describe, expect, it } from "vitest";

import { MEMORY_TENANT_ID } from "@/lib/tenant/memory-demo-routing";
import { resolveProxyRouting } from "@/lib/tenant/resolve-proxy-routing";

describe("resolveProxyRouting", () => {
  it("resuelve el preview local sin cargar el stack real", async () => {
    await expect(resolveProxyRouting("demo.localhost")).resolves.toEqual({
      id: MEMORY_TENANT_ID,
      status: "active",
      canonicalHostname: "demo.localhost",
    });
    await expect(resolveProxyRouting("unknown.test")).resolves.toBeUndefined();
  });

  it("deja localhost para marketing y sirve cada DJ en slug.localhost", async () => {
    await expect(resolveProxyRouting("localhost")).resolves.toBeUndefined();
    await expect(resolveProxyRouting("127.0.0.1")).resolves.toBeUndefined();
    await expect(resolveProxyRouting("marco.localhost")).resolves.toEqual({
      id: "22222222-2222-4222-8222-222222222222",
      status: "active",
      canonicalHostname: "marco.localhost",
    });
    await expect(resolveProxyRouting("luna.localhost")).resolves.toEqual({
      id: "33333333-3333-4333-8333-333333333333",
      status: "active",
      canonicalHostname: "luna.localhost",
    });
    await expect(resolveProxyRouting("nox.localhost")).resolves.toEqual({
      id: MEMORY_TENANT_ID,
      status: "active",
      canonicalHostname: "nox.localhost",
    });
  });
});
