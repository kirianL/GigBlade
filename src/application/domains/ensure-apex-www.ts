import type { ProjectDomains } from "@/application/ports/project-domains";
import { isApexDomain } from "@/domain/domain-automation";

/** Apex stays the public site. www is a Vercel 308 so the CNAME the DJ adds actually resolves. */
export async function ensureApexWwwRedirect(
  projectDomains: ProjectDomains,
  domain: string,
): Promise<void> {
  if (!isApexDomain(domain)) return;
  await projectDomains.add(`www.${domain}`, {
    redirect: domain,
    redirectStatusCode: 308,
  });
}
