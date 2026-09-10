import { describe, expect, it } from "vitest";

import {
  canResolveHostname,
  isLocalNetworkHostname,
  isValidPublicHostname,
  normalizeHostname,
} from "@/domain/hostname";
import { createTenantRouting, type Tenant } from "@/domain/tenant";

const tenant: Tenant = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "demo",
  plan: "all_inclusive",
  themeConfig: {},
  status: "active",
};

describe("hostname", () => {
  it("normaliza mayúsculas y el punto final", () => {
    expect(normalizeHostname("Demo.Example.COM.")).toBe("demo.example.com");
  });

  it("quita el puerto del host", () => {
    expect(normalizeHostname("localhost:3001")).toBe("localhost");
    expect(normalizeHostname("192.168.50.197:3001")).toBe("192.168.50.197");
  });

  it("rechaza hostnames públicos mal formados", () => {
    expect(isValidPublicHostname("localhost")).toBe(false);
    expect(isValidPublicHostname("no spaces.com")).toBe(false);
    expect(isValidPublicHostname("djá.com")).toBe(false);
    expect(isValidPublicHostname("-bad.com")).toBe(false);
    expect(isValidPublicHostname("example.com")).toBe(true);
  });

  it("solo resuelve localhost o un hostname público válido", () => {
    expect(canResolveHostname("localhost")).toBe(true);
    expect(canResolveHostname("example.com")).toBe(true);
    expect(canResolveHostname("not a host")).toBe(false);
    expect(canResolveHostname("http://evil.test")).toBe(false);
  });

  it("detecta IPs de red local para previsualizar la landing", () => {
    expect(isLocalNetworkHostname("192.168.50.197")).toBe(true);
    expect(isLocalNetworkHostname("10.0.0.8")).toBe(true);
    expect(isLocalNetworkHostname("127.0.0.1")).toBe(true);
    expect(isLocalNetworkHostname("example.com")).toBe(false);
  });

  it("no crea routing para un dominio mal formado", () => {
    expect(() => createTenantRouting(tenant, "http://evil.test")).toThrow();
    expect(() => createTenantRouting(tenant, "djá.com")).toThrow();
  });
});
