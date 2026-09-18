import { describe, expect, it } from "vitest";

import {
  assertRegisteredTemplate,
  DEFAULT_SITE_TEMPLATE_ID,
  getSiteTemplateAppearance,
  getSiteTemplateSections,
  isSiteTemplateId,
  SITE_TEMPLATE_APPEARANCE,
  SITE_TEMPLATE_IDS,
  SITE_TEMPLATE_SECTIONS,
} from "@/domain/site-template";

describe("site-template", () => {
  it("acepta solo ids del catálogo", () => {
    expect(isSiteTemplateId("pista")).toBe(true);
    expect(isSiteTemplateId("festival")).toBe(true);
    expect(isSiteTemplateId("after")).toBe(true);
    expect(isSiteTemplateId("Pista")).toBe(false);
    expect(isSiteTemplateId("custom")).toBe(false);
  });

  it("falla cerrado si la plantilla no está registrada", () => {
    expect(assertRegisteredTemplate("pista")).toBe("pista");
    expect(DEFAULT_SITE_TEMPLATE_ID).toBe("pista");
    expect(() => assertRegisteredTemplate("neon")).toThrow();
    try {
      assertRegisteredTemplate("neon");
    } catch (error) {
      expect(error).toMatchObject({ code: "NOT_FOUND" });
    }
  });

  it("asigna modo claro, oscuro y party a las tres plantillas", () => {
    expect(SITE_TEMPLATE_APPEARANCE).toEqual({
      pista: "light",
      festival: "dark",
      after: "party",
    });
    expect(getSiteTemplateAppearance("pista")).toBe("light");
    expect(getSiteTemplateAppearance("festival")).toBe("dark");
    expect(getSiteTemplateAppearance("after")).toBe("party");
  });

  it("define un orden de secciones distinto por plantilla", () => {
    expect(SITE_TEMPLATE_IDS).toEqual(["pista", "festival", "after"]);
    expect(getSiteTemplateSections("pista")).toEqual([
      "intro",
      "agenda",
      "bio",
      "enlaces",
      "sets",
      "contacto",
    ]);
    expect(SITE_TEMPLATE_SECTIONS.festival).toEqual([
      "intro",
      "bio",
      "agenda",
      "enlaces",
      "sets",
      "contacto",
    ]);
    expect(SITE_TEMPLATE_SECTIONS.after).toEqual([
      "intro",
      "enlaces",
      "sets",
      "contacto",
      "agenda",
      "bio",
    ]);
    expect(SITE_TEMPLATE_SECTIONS.pista).not.toEqual(
      SITE_TEMPLATE_SECTIONS.festival,
    );
    expect(SITE_TEMPLATE_SECTIONS.festival).not.toEqual(
      SITE_TEMPLATE_SECTIONS.after,
    );
  });
});
