import { describe, expect, it } from "vitest";
import { AppError } from "@/domain/errors";
import {
  assertPanelCsrf,
  assertTrustedOrigin,
  createCsrfToken,
  PANEL_CSRF_COOKIE,
  PANEL_CSRF_HEADER,
  PANEL_SESSION_COOKIE,
  panelCsrfSetCookie,
  panelSessionSetCookie,
  readPanelSessionToken,
  requirePanelActor,
} from "@/lib/http/panel-request";

describe("panel-request (SEC-01)", () => {
  it("rechaza Authorization Bearer cuando no hay cookie HttpOnly", () => {
    const req = new Request("http://localhost:3000/api/panel/session", {
      headers: { authorization: "Bearer tok-123" },
    });
    expect(() => readPanelSessionToken(req)).toThrow(AppError);
  });

  it("lee el token exclusivamente desde la cookie HttpOnly", () => {
    const req = new Request("http://localhost:3000/api/panel/session", {
      headers: { cookie: `foo=1; ${PANEL_SESSION_COOKIE}=tok-cookie` },
    });
    expect(readPanelSessionToken(req)).toBe("tok-cookie");
  });

  it("arma Set-Cookie de sesión con HttpOnly, SameSite=Lax, Secure y Domain en dominios propios", () => {
    const req = new Request("https://gigblades.com/api/panel/login");
    const header = panelSessionSetCookie(req, "abc");
    expect(header).toContain(`${PANEL_SESSION_COOKIE}=abc`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Path=/");
    expect(header).toContain("Domain=.gigblades.com");
  });

  it("arma Set-Cookie CSRF sin HttpOnly y con SameSite=Lax", () => {
    const req = new Request("https://app.gigblades.com/api/panel/login");
    const csrf = createCsrfToken();
    const header = panelCsrfSetCookie(req, csrf);
    expect(header).toContain(`${PANEL_CSRF_COOKIE}=${encodeURIComponent(csrf)}`);
    expect(header).not.toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("SameSite=Lax");
    expect(header).toContain("Domain=.gigblades.com");
  });

  it("valida Origin permitido y rechaza orígenes no autorizados o cross-site", () => {
    const okSame = new Request("https://app.gigblades.com/api/panel/sites", {
      method: "POST",
      headers: { origin: "https://app.gigblades.com" },
    });
    expect(() => assertTrustedOrigin(okSame)).not.toThrow();

    const badOrigin = new Request("https://app.gigblades.com/api/panel/sites", {
      method: "POST",
      headers: { origin: "https://evil.example" },
    });
    expect(() => assertTrustedOrigin(badOrigin)).toThrowError(/no autorizado/i);

    const missingOrigin = new Request("https://app.gigblades.com/api/panel/sites", {
      method: "POST",
    });
    expect(() => assertTrustedOrigin(missingOrigin)).toThrowError(/no autorizado/i);

    const crossSite = new Request("https://app.gigblades.com/api/panel/sites", {
      method: "POST",
      headers: {
        origin: "https://app.gigblades.com",
        "sec-fetch-site": "cross-site",
      },
    });
    expect(() => assertTrustedOrigin(crossSite)).toThrowError(/no autorizado/i);
  });

  it("valida doble-submit CSRF en cookie + header", () => {
    const csrf = createCsrfToken();
    const okReq = new Request("https://app.gigblades.com/api/panel/bookings", {
      method: "PATCH",
      headers: {
        cookie: `${PANEL_CSRF_COOKIE}=${csrf}`,
        [PANEL_CSRF_HEADER]: csrf,
      },
    });
    expect(() => assertPanelCsrf(okReq)).not.toThrow();

    const noHeader = new Request("https://app.gigblades.com/api/panel/bookings", {
      method: "PATCH",
      headers: { cookie: `${PANEL_CSRF_COOKIE}=${csrf}` },
    });
    expect(() => assertPanelCsrf(noHeader)).toThrowError(/CSRF/i);

    const mismatch = new Request("https://app.gigblades.com/api/panel/bookings", {
      method: "PATCH",
      headers: {
        cookie: `${PANEL_CSRF_COOKIE}=${csrf}`,
        [PANEL_CSRF_HEADER]: "wrong-token",
      },
    });
    expect(() => assertPanelCsrf(mismatch)).toThrowError(/CSRF/i);
  });

  it("requirePanelActor rechaza mutaciones sin CSRF con 403", async () => {
    const req = new Request("http://localhost:3000/api/panel/bookings", {
      method: "PATCH",
      headers: {
        origin: "http://localhost:3000",
        cookie: `${PANEL_SESSION_COOKIE}=tok-123`,
      },
    });
    await expect(requirePanelActor(req)).rejects.toMatchObject({
      status: 403,
    });
  });
});
