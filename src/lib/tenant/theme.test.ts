import { describe, expect, it } from "vitest";

import { readLandingTheme } from "@/lib/tenant/theme";

describe("readLandingTheme", () => {
  it("usa el slug si no hay displayName y deja bio y links vacíos", () => {
    expect(readLandingTheme("nox", {})).toEqual({
      displayName: "nox",
      tagline: "Sitio oficial del artista",
      city: "",
      bio: "",
      links: {},
    });
  });

  it("lee perfil y enlaces públicos de theme_config", () => {
    expect(
      readLandingTheme("nox", {
        displayName: "Nox",
        tagline: "Sets nocturnos",
        city: "San José",
        bio: "Resident.",
        brandColor: "#E52B20",
        links: {
          instagram: "https://instagram.com/nox",
          spotify: "https://open.spotify.com/artist/nox",
          website: "https://example.com",
        },
      }),
    ).toEqual({
      displayName: "Nox",
      tagline: "Sets nocturnos",
      city: "San José",
      bio: "Resident.",
      brandColor: "#e52b20",
      links: {
        instagram: "https://instagram.com/nox",
        spotify: "https://open.spotify.com/artist/nox",
      },
    });
  });
});
