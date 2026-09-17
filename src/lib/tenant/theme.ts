import { readSiteProfile, type SiteProfile } from "@/domain/site-profile";

export type LandingTheme = SiteProfile;

export function readLandingTheme(
  slug: string,
  themeConfig: Record<string, unknown>,
): LandingTheme {
  return readSiteProfile(slug, themeConfig);
}
