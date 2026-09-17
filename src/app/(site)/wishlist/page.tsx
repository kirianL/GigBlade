import type { Metadata } from "next";

import { getApp } from "@/lib/composition/app";
import { getTenantContext } from "@/lib/tenant/from-headers";
import WishlistPage, {
  metadata as landingMetadata,
} from "../../../../ui/landing/app/(site)/wishlist/page";

export const metadata: Metadata = landingMetadata;

const fallbackTheme = {
  displayName: "GigBlade",
  tagline: "Página y dominio propios, contacto por Instagram o mail",
  city: "",
};

async function loadTheme() {
  try {
    const context = await getTenantContext();
    const tenant = await getApp().getPublicTenant(context);
    return tenant.profile;
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
