import { describe, expect, it } from "vitest";

import {
  assertRegisteredTemplate,
  DEFAULT_SITE_TEMPLATE_ID,
  isSiteTemplateId,
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
});
