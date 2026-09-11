import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "../../ui/landing/app/globals.css";
import "./globals.css";
import RouteTransition from "@/components/route-transition";
import { getSiteUrl } from "@/lib/site-url";
import { cn } from "@/lib/utils";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "optional",
  preload: true,
  adjustFontFallback: true,
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "optional",
  preload: true,
  adjustFontFallback: true,
});

const url = getSiteUrl();

export const metadata: Metadata = {
  title: {
    default: "Página propia para DJs | GigBlade",
    template: "%s | GigBlade",
  },
  description:
    "Presencia digital para DJs: dominio propio, plantilla para eventos y formulario de booking. Hosting y seguridad incluidos. US$ 65 al mes.",
  applicationName: "GigBlade",
  keywords: [
    "página para DJs",
    "booking DJ",
    "dominio para DJ",
    "sitio web DJ",
    "GigBlade",
    "presencia digital",
    "formulario de booking",
  ],
  authors: [{ name: "GigBlade" }],
  creator: "GigBlade",
  metadataBase: new URL(url),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "es_CR",
    url,
    siteName: "GigBlade",
    title: "GigBlade — Página propia para DJs",
    description:
      "Dominio propio, plantillas para eventos y booking formal. Hosting y seguridad incluidos.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "GigBlade — Página propia para DJs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GigBlade — Página propia para DJs",
    description:
      "Dominio propio, plantillas para eventos y booking formal. Hosting y seguridad incluidos.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={cn(
        geistSans.variable,
        geistMono.variable,
        "h-full max-w-full overscroll-x-none bg-black antialiased",
      )}
    >
      <body className="flex min-h-full max-w-full flex-col overscroll-x-none">
        <RouteTransition>{children}</RouteTransition>
      </body>
    </html>
  );
}
