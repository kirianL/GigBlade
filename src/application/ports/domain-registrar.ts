export type DomainCheckResult = {
  domain: string;
  registrable: boolean;
  price?: string;
};

export interface DomainRegistrar {
  check(domain: string): Promise<DomainCheckResult>;
  register(domain: string): Promise<{ workflowUrl?: string }>;
}
