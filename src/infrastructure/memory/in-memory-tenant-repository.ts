import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { TenantRepository } from "@/application/ports/tenant-repository";
import { notFound } from "@/domain/errors";
import type { Tenant, TenantContext } from "@/domain/tenant";

function readStoredTenants(path: string): Tenant[] | null {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as Tenant[]) : null;
  } catch {
    return null;
  }
}

export class InMemoryTenantRepository implements TenantRepository {
  private readonly tenants = new Map<string, Tenant>();
  private readonly persistPath?: string;

  constructor(seed: Tenant[] = [], persistPath?: string) {
    this.persistPath = persistPath;

    for (const tenant of seed) {
      this.tenants.set(tenant.id, tenant);
    }

    this.hydrate();

    if (this.persistPath && !readStoredTenants(this.persistPath)) {
      this.flush();
    }
  }

  async findById(id: string): Promise<Tenant | null> {
    this.hydrate();
    return this.tenants.get(id) ?? null;
  }

  async list(): Promise<Tenant[]> {
    this.hydrate();
    return [...this.tenants.values()];
  }

  async updateSiteContent(
    context: TenantContext,
    next: Pick<Tenant, "templateId" | "themeConfig">,
  ): Promise<Tenant> {
    this.hydrate();
    const current = this.tenants.get(context.tenantId);
    if (!current) {
      throw notFound("Tenant no encontrado");
    }

    const updated: Tenant = {
      ...current,
      templateId: next.templateId,
      themeConfig: next.themeConfig,
    };
    this.tenants.set(context.tenantId, updated);
    this.flush();
    return updated;
  }

  async deleteById(id: string): Promise<void> {
    this.hydrate();
    if (!this.tenants.has(id)) {
      throw notFound("Tenant no encontrado");
    }
    this.tenants.delete(id);
    this.flush();
  }

  private hydrate() {
    if (!this.persistPath) return;
    const stored = readStoredTenants(this.persistPath);
    if (!stored) return;
    for (const tenant of stored) {
      this.tenants.set(tenant.id, tenant);
    }
  }

  private flush() {
    if (!this.persistPath) return;
    mkdirSync(dirname(this.persistPath), { recursive: true });
    writeFileSync(
      this.persistPath,
      JSON.stringify([...this.tenants.values()]),
    );
  }
}
