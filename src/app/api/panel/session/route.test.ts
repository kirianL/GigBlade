import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { POST as loginPost } from "../login/route";
import { DELETE as sessionDelete, GET as sessionGet } from "./route";
import { PANEL_CSRF_COOKIE, PANEL_CSRF_HEADER, PANEL_SESSION_COOKIE } from "@/lib/http/panel-request";

function extractCookieValue(setCookies: string[], name: string): string | null {
  for (const header of setCookies) {
    const prefix = `${name}=`;
    if (header.startsWith(prefix)) {
      return decodeURIComponent(header.slice(prefix.length).split(";")[0] ?? "");
    }
  }
  return null;
}

describe("panel login & session routes (SEC-01)", () => {
  beforeEach(() => {
    process.env.APP_RUNTIME = "memory";
  });

  it("login exitoso devuelve user y csrfToken sin token, setea cookie HttpOnly y persiste tras refresh", async () => {
    const loginReq = new Request("http://localhost:3000/api/panel/login", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost:3000",
        "x-forwarded-for": "127.0.0.10",
      },
      body: JSON.stringify({
        email: "hola@gigblade.com",
        password: process.env.GIGBLADE_PANEL_PASSWORD || "gigblade",
      }),
    });

    const loginRes = await loginPost(loginReq);
    expect(loginRes.status).toBe(200);
    expect(loginRes.headers.get("cache-control")).toBe("no-store");

    const loginBody = (await loginRes.json()) as Record<string, unknown>;
    expect(loginBody.token).toBeUndefined();
    expect(loginBody.user).toMatchObject({ email: "hola@gigblade.com", role: "platform" });
    expect(typeof loginBody.csrfToken).toBe("string");

    const setCookies = loginRes.headers.getSetCookie();
    const sessionToken = extractCookieValue(setCookies, PANEL_SESSION_COOKIE);
    const csrfCookie = extractCookieValue(setCookies, PANEL_CSRF_COOKIE);
    expect(sessionToken).toBeTruthy();
    expect(csrfCookie).toBe(loginBody.csrfToken);

    const sessionCookieHeader = setCookies.find((c: string) =>
      c.startsWith(`${PANEL_SESSION_COOKIE}=`),
    );
    expect(sessionCookieHeader).toContain("HttpOnly");
    expect(sessionCookieHeader).toContain("SameSite=Lax");

    // Simular refresh: GET /api/panel/session usando solo cookie
    const refreshReq = new Request("http://localhost:3000/api/panel/session", {
      method: "GET",
      headers: {
        cookie: `${PANEL_SESSION_COOKIE}=${encodeURIComponent(sessionToken!)}; ${PANEL_CSRF_COOKIE}=${encodeURIComponent(csrfCookie!)}`,
      },
    });
    const refreshRes = await sessionGet(refreshReq);
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.headers.get("cache-control")).toBe("no-store");
    const refreshBody = (await refreshRes.json()) as Record<string, unknown>;
    expect(refreshBody.token).toBeUndefined();
    expect(refreshBody.user).toMatchObject({ email: "hola@gigblade.com" });

    // Logout sin CSRF debe fallar con 403
    const badLogout = await sessionDelete(
      new Request("http://localhost:3000/api/panel/session", {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
          cookie: `${PANEL_SESSION_COOKIE}=${encodeURIComponent(sessionToken!)}; ${PANEL_CSRF_COOKIE}=${encodeURIComponent(csrfCookie!)}`,
        },
      }),
    );
    expect(badLogout.status).toBe(403);

    // Logout válido con Origin + CSRF invalida la sesión en el servidor
    const logoutRes = await sessionDelete(
      new Request("http://localhost:3000/api/panel/session", {
        method: "DELETE",
        headers: {
          origin: "http://localhost:3000",
          [PANEL_CSRF_HEADER]: csrfCookie!,
          cookie: `${PANEL_SESSION_COOKIE}=${encodeURIComponent(sessionToken!)}; ${PANEL_CSRF_COOKIE}=${encodeURIComponent(csrfCookie!)}`,
        },
      }),
    );
    expect(logoutRes.status).toBe(200);

    // Tras logout, la misma cookie ya no sirve
    const afterLogout = await sessionGet(refreshReq);
    expect(afterLogout.status).toBe(401);
  });

  it("rechaza credenciales incorrectas con 401 y Origin no autorizado con 403", async () => {
    const badOrigin = await loginPost(
      new Request("http://localhost:3000/api/panel/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "https://attacker.example",
        },
        body: JSON.stringify({ email: "hola@gigblade.com", password: "wrong-password" }),
      }),
    );
    expect(badOrigin.status).toBe(403);

    const badCreds = await loginPost(
      new Request("http://localhost:3000/api/panel/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin: "http://localhost:3000",
          "x-forwarded-for": "127.0.0.11",
        },
        body: JSON.stringify({ email: "hola@gigblade.com", password: "wrong-password" }),
      }),
    );
    expect(badCreds.status).toBe(401);
  });
});
