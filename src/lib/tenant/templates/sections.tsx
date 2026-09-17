import type { SiteSectionId } from "@/domain/site-template";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { HeroSection } from "@/lib/tenant/templates/hero-section";
import { GallerySection } from "@/lib/tenant/templates/gallery-section";
import { BioSection, AgendaSection } from "@/lib/tenant/templates/content-blocks";
import { EnlacesSection } from "@/lib/tenant/templates/socials-section";
import { ContactoSection } from "@/lib/tenant/templates/booking-section";

type SiteSectionProps = SiteTemplateProps & {
  id: SiteSectionId;
};

export function SiteSection({ id, site }: SiteSectionProps) {
  if (id === "intro") {
    return (
      <div data-section="intro" className="w-full flex flex-col">
        <HeroSection site={site} />
        <GallerySection site={site} />
      </div>
    );
  }

  if (id === "agenda") {
    return <AgendaSection site={site} />;
  }

  if (id === "bio") {
    return <BioSection site={site} />;
  }

  if (id === "enlaces") {
    return <EnlacesSection site={site} />;
  }

  return <ContactoSection site={site} />;
}
