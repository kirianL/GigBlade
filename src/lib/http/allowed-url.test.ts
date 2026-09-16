import { describe, expect, it } from "vitest";

import { assertAllowedUrl } from "@/lib/http/allowed-url";

describe("assertAllowedUrl", () => {
  it("acepta hosts de Vercel y Cloudflare por https", () => {
    expect(assertAllowedUrl("https://api.vercel.com/v1/edge-config/x").hostname).toBe(
      "api.vercel.com",
    );
    expect(assertAllowedUrl("https://api.cloudflare.com/client/v4").hostname).toBe(
      "api.cloudflare.com",
    );
  });

  it("rechaza URLs del usuario o protocolos abiertos", () => {
    expect(() => assertAllowedUrl("https://evil.test/steal")).toThrowError();
    expect(() => assertAllowedUrl("http://api.vercel.com/v1")).toThrowError();
    expect(() => assertAllowedUrl("not-a-url")).toThrowError();
  });
});
