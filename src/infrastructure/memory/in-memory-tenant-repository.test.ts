import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { InMemoryTenantRepository } from "@/infrastructure/memory/in-memory-tenant-repository";
import type { Tenant } from "@/domain/tenant";

const tenant: Tenant = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "marco",
  plan: "all_inclusive",
  templateId: "pista",
  themeConfig: { displayName: "DJ Marco" },
  status: "active",
};

const context = {
  tenantId: tenant.id,
  hostname: "marco.localhost",
  canonicalHostname: "marco.localhost",
};

describe("InMemoryTenantRepository persistencia local", () => {
  it("comparte el contenido entre instancias para el preview", async () => {
    const persistPath = join(mkdtempSync(join(tmpdir(), "gb-tenants-")), "tenants.json");
    const writer = new InMemoryTenantRepository([tenant], persistPath);

    await writer.updateSiteContent(context, {
      templateId: "festival",
      themeConfig: { displayName: "DJ Marco", tagline: "Desde el panel" },
    });

    const reader = new InMemoryTenantRepository([tenant], persistPath);
    await expect(reader.findById(tenant.id)).resolves.toMatchObject({
      templateId: "festival",
      themeConfig: { tagline: "Desde el panel" },
    });

    const stored = JSON.parse(readFileSync(persistPath, "utf8")) as Tenant[];
    expect(stored[0]?.templateId).toBe("festival");
  });
});
