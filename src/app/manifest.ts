import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "GigBlade",
    short_name: "GigBlade",
    description: "Presencia digital para DJs: página web, dominio propio y booking.",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon/favicon-48x48.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        src: "/favicon/favicon-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/favicon/favicon-180x180.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
