import "server-only";

import type {
  ProjectDomains,
  ProjectDomainStatus,
} from "@/application/ports/project-domains";
import { getServerEnv } from "@/lib/env/server";

export class VercelProjectDomains implements ProjectDomains {
  async add(domain: string): Promise<ProjectDomainStatus> {
    requireVercelConfig();
    throw new Error(`Vercel Domains API no está conectada todavía: ${domain}`);
  }

  async getStatus(domain: string): Promise<ProjectDomainStatus> {
    requireVercelConfig();
    throw new Error(`Vercel Domains API no está conectada todavía: ${domain}`);
  }
}

function requireVercelConfig() {
  const env = getServerEnv();

  if (!env.PLATFORM_VERCEL_TOKEN || !env.PLATFORM_VERCEL_PROJECT_ID) {
    throw new Error("Faltan PLATFORM_VERCEL_TOKEN o PLATFORM_VERCEL_PROJECT_ID");
  }
}
