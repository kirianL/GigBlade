import "server-only";

import type {
  DomainCheckResult,
  DomainRegistrar,
} from "@/application/ports/domain-registrar";
import { getCloudflareAccountConfig } from "@/infrastructure/cloudflare/account";

export class CloudflareRegistrar implements DomainRegistrar {
  async check(domain: string): Promise<DomainCheckResult> {
    getCloudflareAccountConfig();
    throw new Error(`Cloudflare Registrar no está conectado todavía: ${domain}`);
  }

  async register(domain: string): Promise<{ workflowUrl?: string }> {
    getCloudflareAccountConfig();
    throw new Error(`Cloudflare Registrar no está conectado todavía: ${domain}`);
  }
}
