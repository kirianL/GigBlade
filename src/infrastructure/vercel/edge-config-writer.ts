import "server-only";

import type { EdgeConfigWriter } from "@/application/ports/edge-config-writer";
import { edgeConfigKey, type TenantRouting } from "@/domain/tenant";
import { patchEdgeConfigItems } from "@/infrastructure/vercel/edge-config-items";

export class VercelEdgeConfigWriter implements EdgeConfigWriter {
  async upsertTenantRouting(hostname: string, routing: TenantRouting) {
    await patchEdgeConfigItems([
      {
        operation: "upsert",
        key: edgeConfigKey(hostname),
        value: routing,
      },
    ]);
  }

  async deleteTenantRouting(hostname: string) {
    await patchEdgeConfigItems([
      {
        operation: "delete",
        key: edgeConfigKey(hostname),
      },
    ]);
  }
}
