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

  if (!env.VERCEL_API_TOKEN || !env.VERCEL_PROJECT_ID) {
    throw new Error("Faltan VERCEL_API_TOKEN o VERCEL_PROJECT_ID");
  }
}
