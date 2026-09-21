import { describe, expect, it } from "vitest";

import {
  applyUniqueVisit,
  calendarMonth,
  emptySiteVisitStats,
  isPreviewHostname,
  preferredPublicHostname,
} from "@/domain/site-visits";

describe("site-visits", () => {
  it("cuenta una persona al mes, no cada recarga", () => {
    const at = new Date("2026-09-17T18:00:00.000Z");
    const first = applyUniqueVisit(emptySiteVisitStats("t1", at), "visitante-a", at);
    const same = applyUniqueVisit(first, "visitante-a", at);
    const other = applyUniqueVisit(same, "visitante-b", at);

    expect(first.uniqueVisitors).toBe(1);
    expect(same.uniqueVisitors).toBe(1);
    expect(other.uniqueVisitors).toBe(2);
    expect(other.month).toBe(calendarMonth(at));
  });

  it("marca preview local y dominio propio", () => {
    expect(isPreviewHostname("nox.localhost")).toBe(true);
    expect(isPreviewHostname("djmarco.com")).toBe(false);
  });

  it("elige el hostname público y ignora el de preview", () => {
    expect(
      preferredPublicHostname([
        { canonicalHostname: "nox.localhost" },
        { canonicalHostname: "nox.cr" },
      ]),
    ).toBe("nox.cr");
    expect(
      preferredPublicHostname([{ canonicalHostname: "nox.localhost" }]),
    ).toBeNull();
  });
});
