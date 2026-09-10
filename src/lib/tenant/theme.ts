export type LandingTheme = {
  displayName: string;
  tagline: string;
  city: string;
};

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function readLandingTheme(
  slug: string,
  themeConfig: Record<string, unknown>,
): LandingTheme {
  return {
    displayName: readString(themeConfig.displayName) ?? slug,
    tagline:
      readString(themeConfig.tagline) ?? "Sitio oficial del artista",
    city: readString(themeConfig.city) ?? "",
  };
}
