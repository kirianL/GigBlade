import { getSiteTemplateSections } from "@/domain/site-template";
import { hasSiteSectionContent } from "@/domain/site-profile";
import { SiteSection } from "@/lib/tenant/templates/sections";
import { SiteShell } from "@/lib/tenant/templates/shell";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";

export default function FestivalSite({ site }: SiteTemplateProps) {
  return (
    <SiteShell site={site}>
      {getSiteTemplateSections("festival")
        .filter((sectionId) => hasSiteSectionContent(site.profile, sectionId))
        .map((sectionId) => (
          <SiteSection key={sectionId} id={sectionId} site={site} />
        ))}
    </SiteShell>
  );
}
