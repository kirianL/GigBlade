export type ProjectDomainVerificationChallenge = {
  type: string;
  domain: string;
  value: string;
  reason?: string;
};

export type ProjectDomainStatus = {
  name: string;
  verified: boolean;
  configured?: boolean;
  verification?: ProjectDomainVerificationChallenge[];
  error?: string;
};

export interface ProjectDomains {
  add(domain: string): Promise<ProjectDomainStatus>;
  getStatus(domain: string): Promise<ProjectDomainStatus>;
  verify(domain: string): Promise<ProjectDomainStatus>;
}

