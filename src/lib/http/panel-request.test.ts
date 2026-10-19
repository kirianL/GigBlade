import { describe, expect, it } from "vitest";

import {
  PANEL_SESSION_COOKIE,
  panelSessionSetCookie,
  readBearerToken,
} from "@/lib/http/panel-request";

describe("readBearerToken", () => {
  it("lee el token desde Authorization Bearer", () => {
    const req = new Request("http://localhost:3000/api/panel/session", {
      headers: { authorization: "Bearer tok-123" },
    });
    expect(readBearerToken(req)).toBe("tok-123");
  });

  it("cae en la cookie HttpOnly cuando no hay header", () => {
    const req = new Request("http://localhost:3000/api/panel/session", {
      headers: { cookie: `foo=1; ${PANEL_SESSION_COOKIE}=tok-cookie` },
    });
    expect(readBearerToken(req)).toBe("tok-cookie");
  });

  it("arma Set-Cookie con Domain en dominios propios", () => {
    const req = new Request("https://gigblades.com/api/panel/login");
    const header = panelSessionSetCookie(req, "abc");
    expect(header).toContain(`${PANEL_SESSION_COOKIE}=abc`);
    expect(header).toContain("HttpOnly");
    expect(header).toContain("Secure");
    expect(header).toContain("Domain=.gigblades.com");
  });
});
