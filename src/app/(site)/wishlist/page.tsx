import type { Metadata } from "next";

import { getApp } from "@/lib/composition/app";
import { getTenantContext } from "@/lib/tenant/from-headers";
import { readLandingTheme } from "@/lib/tenant/theme";
import WishlistPage, {
  metadata as landingMetadata,
} from "../../../../ui/landing/app/(site)/wishlist/page";

export const metadata: Metadata = landingMetadata;

const fallbackTheme = {
  displayName: "GigBlade",
  tagline: "Página, dominio y un canal formal para bookings",
  city: "",
};

async function loadTheme() {
  try {
    const context = await getTenantContext();
    const tenant = await getApp().getPublicTenant(context);
    return readLandingTheme(tenant.slug, tenant.themeConfig);
  } catch {
    return fallbackTheme;
  }
}

export default async function Page() {
  const theme = await loadTheme();

  return (
    <WishlistPage
      artistName={theme.displayName}
      tagline={theme.tagline}
      city={theme.city}
    />
  );
}
