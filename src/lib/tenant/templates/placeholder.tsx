import type { TenantSite } from "@/application/sites/resolve-tenant-site";

type PlaceholderSiteProps = {
  site: TenantSite;
};

export default function PlaceholderSite({ site }: PlaceholderSiteProps) {
  return (
    <main data-tenant-site="" data-template={site.templateId}>
      <h1>{site.profile.displayName}</h1>
      <p>{site.profile.tagline}</p>
      {site.profile.city ? <p>{site.profile.city}</p> : null}
    </main>
  );
}
