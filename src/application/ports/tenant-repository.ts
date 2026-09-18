import type { TenantContext, Tenant } from "@/domain/tenant";

export interface TenantRepository {
  /** `null` si no existe. Lanza 503 si el almacenamiento no puede leer el esquema. */
  findById(id: string): Promise<Tenant | null>;
  list(): Promise<Tenant[]>;
  updateSiteContent(
    context: TenantContext,
    next: Pick<Tenant, "templateId" | "themeConfig">,
  ): Promise<Tenant>;
  deleteById(id: string): Promise<void>;
}
