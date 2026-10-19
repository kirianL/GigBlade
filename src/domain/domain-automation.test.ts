import { describe, expect, it } from "vitest";

import { cnamePointsToVercel } from "@/domain/domain-automation";

describe("cnamePointsToVercel", () => {
  it("acepta el CNAME genérico y el que asigna Vercel por proyecto", () => {
    expect(cnamePointsToVercel("cname.vercel-dns.com")).toBe(true);
    expect(cnamePointsToVercel("9dfa078a2fa77d57.vercel-dns-017.com.")).toBe(true);
  });

  it("rechaza un CNAME ajeno", () => {
    expect(cnamePointsToVercel("example.com")).toBe(false);
    expect(cnamePointsToVercel("vercel-dns.example.com")).toBe(false);
  });
});
