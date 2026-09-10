export type ProjectDomainStatus = {
  name: string;
  verified: boolean;
};

export interface ProjectDomains {
  add(domain: string): Promise<ProjectDomainStatus>;
  getStatus(domain: string): Promise<ProjectDomainStatus>;
}
