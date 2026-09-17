import { describe, expect, it } from "vitest";

import {
  brandColorCssVars,
  isLightBrandColor,
  mixHex,
  normalizeBrandColor,
} from "@/lib/tenant/brand-color";

describe("brand color", () => {
  it("solo acepta hex de 6 dígitos", () => {
    expect(normalizeBrandColor("#E52B20")).toBe("#e52b20");
    expect(normalizeBrandColor("  #1d4ed8 ")).toBe("#1d4ed8");
    expect(normalizeBrandColor("#fff")).toBeUndefined();
    expect(normalizeBrandColor("red")).toBeUndefined();
    expect(normalizeBrandColor("javascript:alert(1)")).toBeUndefined();
  });

  it("elige texto negro o blanco según el contraste", () => {
    expect(isLightBrandColor("#e52b20")).toBe(true);
    expect(isLightBrandColor("#f5f5f5")).toBe(true);
    expect(isLightBrandColor("#111111")).toBe(false);
    expect(isLightBrandColor("#1d4ed8")).toBe(false);
  });

  it("mezcla hacia negro para la superficie", () => {
    expect(mixHex("#e52b20", "#000000", 0.12)).toBe("#ca261c");
  });

  it("expone variables de sitio con texto legible", () => {
    expect(brandColorCssVars("#1d4ed8")).toMatchObject({
      "--site-bg": "#1d4ed8",
      "--site-nav-bg": "#1d4ed8",
      "--site-fg": "#ffffff",
      "--site-accent": "#ffffff",
    });
    expect(brandColorCssVars("#e52b20")).toMatchObject({
      "--site-bg": "#e52b20",
      "--site-fg": "#000000",
    });
    expect(brandColorCssVars("#f5f5f5")).toMatchObject({
      "--site-bg": "#f5f5f5",
      "--site-fg": "#000000",
    });
  });
});
