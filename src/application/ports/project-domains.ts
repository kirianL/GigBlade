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

export type ProjectDomainAddOptions = {
  redirect?: string;
  redirectStatusCode?: 301 | 302 | 307 | 308;
};

export type ProjectDnsTargets = {
  a: string;
  cname: string;
};

export interface ProjectDomains {
  add(domain: string, options?: ProjectDomainAddOptions): Promise<ProjectDomainStatus>;
  getStatus(domain: string): Promise<ProjectDomainStatus>;
  verify(domain: string): Promise<ProjectDomainStatus>;
  getDnsTargets(domain: string): Promise<ProjectDnsTargets>;
}

