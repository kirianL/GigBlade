import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import type { SiteVisitStore } from "@/application/ports/site-visit-store";
import {
  applyUniqueVisit,
  emptySiteVisitStats,
  type SiteVisitStats,
} from "@/domain/site-visits";

function readStored(path: string): SiteVisitStats[] | null {
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as SiteVisitStats[]) : null;
  } catch {
    return null;
  }
}

function isStats(value: unknown): value is SiteVisitStats {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Partial<SiteVisitStats>;
  return typeof row.tenantId === "string" && Array.isArray(row.visitorKeys);
}

export class InMemorySiteVisitStore implements SiteVisitStore {
  private readonly stats = new Map<string, SiteVisitStats>();
  private readonly persistPath?: string;

  constructor(persistPath?: string) {
    this.persistPath = persistPath;
    this.hydrate();
  }

  async get(tenantId: string): Promise<SiteVisitStats> {
    this.hydrate();
    return this.stats.get(tenantId) ?? emptySiteVisitStats(tenantId);
  }

  async record(tenantId: string, visitorKey: string): Promise<SiteVisitStats> {
    this.hydrate();
    const next = applyUniqueVisit(
      this.stats.get(tenantId) ?? emptySiteVisitStats(tenantId),
      visitorKey,
    );
    this.stats.set(tenantId, next);
    this.flush();
    return next;
  }

  async list(): Promise<SiteVisitStats[]> {
    this.hydrate();
    return [...this.stats.values()];
  }

  private hydrate() {
    if (!this.persistPath) return;
    const stored = readStored(this.persistPath);
    if (!stored) return;
    for (const entry of stored) {
      if (isStats(entry)) this.stats.set(entry.tenantId, entry);
    }
  }

  private flush() {
    if (!this.persistPath) return;
    mkdirSync(dirname(this.persistPath), { recursive: true });
    writeFileSync(this.persistPath, JSON.stringify([...this.stats.values()]));
  }
}
