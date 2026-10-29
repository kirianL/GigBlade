import { describe, expect, it } from "vitest";

import { cnamePointsToVercel, isVercelIp } from "@/domain/domain-automation";

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

describe("isVercelIp", () => {
  it("reconoce la IP Anycast clásica de Vercel 76.76.21.21", () => {
    expect(isVercelIp("76.76.21.21")).toBe(true);
    expect(isVercelIp(" 76.76.21.21 ")).toBe(true);
  });

  it("reconoce la nueva IP Anycast global 216.198.79.1", () => {
    expect(isVercelIp("216.198.79.1")).toBe(true);
  });

  it("reconoce IPs del bloque Anycast de Vercel", () => {
    expect(isVercelIp("76.76.21.98")).toBe(true);
    expect(isVercelIp("216.198.79.25")).toBe(true);
  });

  it("rechaza IPs no pertenecientes a Vercel", () => {
    expect(isVercelIp("1.1.1.1")).toBe(false);
    expect(isVercelIp("142.250.190.46")).toBe(false);
    expect(isVercelIp("")).toBe(false);
  });
});
