import { describe, expect, it } from "vitest";

import {
  coerceSiteLinkInput,
  hasSiteLinks,
  readAllowedHttpsUrl,
  readSiteLinks,
} from "@/domain/site-links";

describe("site-links", () => {
  it("solo acepta https del host permitido", () => {
    expect(
      readAllowedHttpsUrl("https://open.spotify.com/artist/nox", [
        "open.spotify.com",
      ]),
    ).toBe("https://open.spotify.com/artist/nox");
    expect(
      readAllowedHttpsUrl("https://www.instagram.com/nox", ["instagram.com"]),
    ).toBe("https://www.instagram.com/nox");
    expect(
      readAllowedHttpsUrl("http://open.spotify.com/artist/nox", [
        "open.spotify.com",
      ]),
    ).toBeUndefined();
    expect(
      readAllowedHttpsUrl("javascript:alert(1)", ["open.spotify.com"]),
    ).toBeUndefined();
    expect(
      readAllowedHttpsUrl("https://evil.example/open.spotify.com", [
        "open.spotify.com",
      ]),
    ).toBeUndefined();
  });

  it("convierte un handle de Instagram en URL https", () => {
    expect(coerceSiteLinkInput("instagram", "@nox")).toBe(
      "https://instagram.com/nox",
    );
    expect(coerceSiteLinkInput("spotify", "https://open.spotify.com/artist/nox")).toBe(
      "https://open.spotify.com/artist/nox",
    );
  });

  it("lee redes y enlaces de música desde theme_config.links", () => {
    expect(
      readSiteLinks({
        links: {
          instagram: "https://instagram.com/nox",
          spotify: "https://open.spotify.com/artist/nox",
          soundcloud: "https://soundcloud.com/nox",
          tiktok: "https://not-tiktok.example/nox",
        },
      }),
    ).toEqual({
      instagram: "https://instagram.com/nox",
      spotify: "https://open.spotify.com/artist/nox",
      soundcloud: "https://soundcloud.com/nox",
    });
  });

  it("ignora un bloque links ausente o vacío", () => {
    expect(readSiteLinks({})).toEqual({});
    expect(hasSiteLinks({})).toBe(false);
    expect(
      hasSiteLinks({ instagram: "https://instagram.com/nox" }),
    ).toBe(true);
  });
});
