import type { SiteVisitStats } from "@/domain/site-visits";

export interface SiteVisitStore {
  get(tenantId: string): Promise<SiteVisitStats>;
  record(tenantId: string, visitorKey: string): Promise<SiteVisitStats>;
  list(): Promise<SiteVisitStats[]>;
}
