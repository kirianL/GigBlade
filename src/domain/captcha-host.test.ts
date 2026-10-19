import { describe, expect, it } from "vitest";

import {
  isCaptchaFrameOrigin,
  isCaptchaTokenHostnameAllowed,
  parseCaptchaTheme,
  readCaptchaFrameToken,
} from "@/domain/captcha-host";

describe("isCaptchaTokenHostnameAllowed", () => {
  it("acepta gigblades.com en producción", () => {
    expect(isCaptchaTokenHostnameAllowed("gigblades.com", true)).toBe(true);
    expect(isCaptchaTokenHostnameAllowed("www.gigblades.com", true)).toBe(true);
  });

  it("rechaza el dominio del DJ", () => {
    expect(isCaptchaTokenHostnameAllowed("itshndrxx.com", true)).toBe(false);
    expect(isCaptchaTokenHostnameAllowed("dj.kirian.dev", true)).toBe(false);
    expect(isCaptchaTokenHostnameAllowed("localhost", true)).toBe(false);
  });

  it("acepta localhost solo fuera de producción", () => {
    expect(isCaptchaTokenHostnameAllowed("localhost", false)).toBe(true);
    expect(isCaptchaTokenHostnameAllowed("127.0.0.1", false)).toBe(true);
  });
});

describe("isCaptchaFrameOrigin", () => {
  it("acepta el origen de la plataforma", () => {
    expect(isCaptchaFrameOrigin("https://gigblades.com", true)).toBe(true);
    expect(isCaptchaFrameOrigin("https://www.gigblades.com", true)).toBe(true);
    expect(isCaptchaFrameOrigin("https://itshndrxx.com", true)).toBe(false);
  });

  it("acepta localhost en desarrollo", () => {
    expect(isCaptchaFrameOrigin("http://localhost:3000", false)).toBe(true);
    expect(isCaptchaFrameOrigin("http://marco.localhost:3000", false)).toBe(false);
  });
});

describe("parseCaptchaTheme", () => {
  it("acepta light, dark y auto", () => {
    expect(parseCaptchaTheme("dark")).toBe("dark");
    expect(parseCaptchaTheme("otro")).toBe("auto");
    expect(parseCaptchaTheme(undefined)).toBe("auto");
  });
});

describe("readCaptchaFrameToken", () => {
  it("lee el token del mensaje del iframe", () => {
    expect(
      readCaptchaFrameToken({
        source: "gigblade-turnstile",
        event: "token",
        token: "a".repeat(20),
      }),
    ).toBe("a".repeat(20));
  });

  it("ignora mensajes ajenos", () => {
    expect(readCaptchaFrameToken({ source: "other", event: "token", token: "a".repeat(20) })).toBe(
      null,
    );
    expect(
      readCaptchaFrameToken({
        source: "gigblade-turnstile",
        event: "token",
        token: "short",
      }),
    ).toBe(null);
  });
});
