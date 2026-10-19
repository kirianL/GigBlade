import type {
  ProjectDnsTargets,
  ProjectDomainAddOptions,
  ProjectDomains,
  ProjectDomainStatus,
} from "@/application/ports/project-domains";
import {
  GIGBLADE_TARGET_CNAME,
  GIGBLADE_TARGET_IP,
} from "@/domain/domain-automation";

export class InMemoryProjectDomains implements ProjectDomains {
  private readonly domains = new Map<string, ProjectDomainStatus>();

  constructor() {
    // Seed default demo domains
    this.domains.set("djmarco.com", {
      name: "djmarco.com",
      verified: true,
      configured: true,
    });
    this.domains.set("lunaset.com", {
      name: "lunaset.com",
      verified: false,
      configured: false,
    });
  }

  async add(
    domain: string,
    _options?: ProjectDomainAddOptions,
  ): Promise<ProjectDomainStatus> {
    const existing = this.domains.get(domain);
    if (existing) return existing;

    const status: ProjectDomainStatus = {
      name: domain,
      verified: domain.endsWith(".localhost") || domain === "djmarco.com",
      configured: true,
    };
    this.domains.set(domain, status);
    return status;
  }

  async getStatus(domain: string): Promise<ProjectDomainStatus> {
    return (
      this.domains.get(domain) ?? {
        name: domain,
        verified: domain.endsWith(".localhost") || domain === "djmarco.com",
        configured: true,
      }
    );
  }

  async verify(domain: string): Promise<ProjectDomainStatus> {
    const current = await this.getStatus(domain);
    const verified: ProjectDomainStatus = {
      ...current,
      verified: true,
      configured: true,
    };
    this.domains.set(domain, verified);
    return verified;
  }

  async getDnsTargets(_domain: string): Promise<ProjectDnsTargets> {
    return { a: GIGBLADE_TARGET_IP, cname: GIGBLADE_TARGET_CNAME };
  }
}
