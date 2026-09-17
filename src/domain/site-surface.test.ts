import { describe, expect, it } from "vitest";

import {
  isTenantPreviewHostname,
  servesTenantSiteSurface,
  tenantSiteRewritePath,
} from "@/domain/site-surface";

describe("site-surface", () => {
  it("reserva localhost y la marca para la landing de GigBlade", () => {
    expect(servesTenantSiteSurface("localhost")).toBe(false);
    expect(servesTenantSiteSurface("127.0.0.1")).toBe(false);
    expect(servesTenantSiteSurface("192.168.50.197")).toBe(false);
    expect(servesTenantSiteSurface("gigblade.com")).toBe(false);
    expect(servesTenantSiteSurface("gigblade.vercel.app")).toBe(false);
  });

  it("sirve el sitio DJ en preview *.localhost y en dominio propio", () => {
    expect(isTenantPreviewHostname("demo.localhost")).toBe(true);
    expect(isTenantPreviewHostname("marco.localhost")).toBe(true);
    expect(isTenantPreviewHostname("localhost")).toBe(false);
    expect(servesTenantSiteSurface("demo.localhost")).toBe(true);
    expect(servesTenantSiteSurface("marco.localhost")).toBe(true);
    expect(servesTenantSiteSurface("djmarco.com")).toBe(true);
  });

  it("reescribe páginas del tenant a /site y deja APIs y estáticos", () => {
    expect(tenantSiteRewritePath("/")).toBe("/site");
    expect(tenantSiteRewritePath("/contacto")).toBe("/site/contacto");
    expect(tenantSiteRewritePath("/api/tenant")).toBeNull();
    expect(tenantSiteRewritePath("/dashboard")).toBeNull();
    expect(tenantSiteRewritePath("/site")).toBeNull();
    expect(tenantSiteRewritePath("/images/og-image.png")).toBeNull();
  });
});
