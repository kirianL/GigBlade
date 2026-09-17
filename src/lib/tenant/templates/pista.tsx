import { getSiteTemplateSections } from "@/domain/site-template";
import { SiteSection } from "@/lib/tenant/templates/sections";
import { SiteShell } from "@/lib/tenant/templates/shell";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";

export default function PistaSite({ site }: SiteTemplateProps) {
  return (
    <SiteShell site={site}>
      {getSiteTemplateSections("pista").map((sectionId) => (
        <SiteSection key={sectionId} id={sectionId} site={site} />
      ))}
    </SiteShell>
  );
}
