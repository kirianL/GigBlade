"use client";

import { motion, useReducedMotion } from "motion/react";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SITE_LINK_KEYS, type SiteLinkKey } from "@/domain/site-links";
import type { JSX } from "react";

const EMIL_EASE_OUT = [0.23, 1, 0.32, 1] as const;

/* ── Real SVG icons per platform ────────────────────────────── */
const SOCIAL_ICONS: Record<SiteLinkKey, { label: string; icon: (cls?: string) => JSX.Element }> = {
  instagram: {
    label: "Instagram",
    icon: (c = "w-4 h-4") => (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    icon: (c = "w-4 h-4") => (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube",
    icon: (c = "w-4 h-4") => (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook",
    icon: (c = "w-4 h-4") => (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  x: {
    label: "X",
    icon: (c = "w-4 h-4") => (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  soundcloud: {
    label: "SoundCloud",
    icon: (c = "w-4 h-4") => (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor">
        <path d="M1.175 12.225c-.051 0-.094.045-.102.102L.89 15.385l.183 3.036c.008.058.051.103.102.103.059 0 .102-.045.11-.103l.241-3.036-.241-3.058c-.008-.057-.051-.102-.11-.102zm1.096-.948c-.067 0-.125.051-.132.124l-.234 3.982.234 3.923c.007.073.065.124.132.124.073 0 .131-.051.138-.124l.292-3.923-.292-3.982c-.007-.073-.065-.124-.138-.124zm1.19-.387c-.08 0-.146.066-.153.146l-.219 4.368.219 4.31c.007.08.073.146.153.146.08 0 .146-.066.153-.146l.321-4.31-.321-4.368c-.007-.08-.073-.146-.153-.146zm1.212-.511c-.095 0-.168.08-.175.175l-.204 4.887.204 4.82c.007.095.08.175.175.175.095 0 .168-.08.175-.175l.343-4.82-.343-4.887c-.007-.095-.08-.175-.175-.175zm1.219-.78c-.11 0-.197.095-.204.204l-.175 5.667.175 5.61c.007.109.094.204.204.204.102 0 .19-.095.197-.204l.365-5.61-.365-5.667c-.007-.109-.095-.204-.197-.204zm1.248-.482c-.124 0-.226.102-.226.226l-.16 6.149.16 6.091c0 .124.102.226.226.226.117 0 .219-.102.226-.226l.387-6.091-.387-6.149c-.007-.124-.109-.226-.226-.226zm1.27-.409c-.139 0-.248.117-.248.255l-.138 6.558.138 6.514c0 .138.109.255.248.255.131 0 .241-.117.248-.255l.409-6.514-.409-6.558c-.007-.138-.117-.255-.248-.255zm8.59 1.458c-.372 0-.73.066-1.066.182-.27-.78-.898-1.393-1.685-1.634-.307-.095-.635-.146-.971-.146-.35 0-.686.058-.999.168v11.758h4.721c2.612 0 4.728-2.116 4.728-4.728 0-2.612-2.116-6.1-4.728-6.1z" />
      </svg>
    ),
  },
  spotify: {
    label: "Spotify",
    icon: (c = "w-4 h-4") => (
      <svg className={c} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.502 17.31c-.217.355-.678.468-1.033.251-2.827-1.728-6.386-2.12-10.579-1.162-.406.094-.813-.162-.907-.568-.094-.406.162-.813.568-.907 4.587-1.048 8.528-.601 11.699 1.345.356.218.469.679.252 1.041zm1.47-3.268c-.273.444-.855.586-1.299.313-3.235-1.988-8.167-2.564-11.993-1.401-.497.151-1.026-.134-1.177-.631-.151-.497.134-1.026.631-1.177 4.375-1.328 9.815-.688 13.525 1.597.444.273.586.855.313 1.299zm.126-3.41c-3.879-2.303-10.279-2.515-13.98-1.391-.595.18-1.226-.156-1.406-.751-.18-.595.156-1.226.751-1.406 4.254-1.291 11.317-1.042 15.782 1.609.535.318.709 1.015.391 1.55-.318.535-1.015.709-1.538.389z" />
      </svg>
    ),
  },
};

export function HeroSection({ site }: SiteTemplateProps) {
  const profile = site.profile;
  const reduce = useReducedMotion();

  const activeLinks = SITE_LINK_KEYS.filter((key) => Boolean(profile.links[key]));

  // Background image selection: DJ photo or high-res curated DJ performance
  const bgImage = profile.heroPhoto || profile.photos?.[0] || "/images/dj/dj-hero.jpg";

  return (
    <section
      className="relative min-h-[92dvh] w-full flex flex-col justify-end px-5 sm:px-8 md:px-12 pb-12 pt-28 overflow-hidden"
    >
      {/* Background Image with Cinematic Overlays */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none">
        <img
          src={bgImage}
          alt={profile.displayName}
          className="w-full h-full object-cover object-center brightness-75 contrast-110 scale-105 transition-transform duration-1000 ease-out"
        />
        {/* Top gradient — ensures navbar text is always legible */}
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/70 via-black/40 to-transparent" />
        {/* Bottom gradient — ensures hero text is legible */}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--site-bg)] via-[var(--site-bg)]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--site-bg)]/80 via-transparent to-[var(--site-bg)]/40" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-6xl w-full mx-auto">

        {/* DJ Display Name (Editorial Display Typography) */}
        <motion.h1
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(24px) scale(0.98)" }}
          animate={{ opacity: 1, transform: "translateY(0px) scale(1)" }}
          transition={{ duration: 0.5, delay: 0.08, ease: EMIL_EASE_OUT }}
          className="font-display font-bold text-6xl sm:text-8xl md:text-9xl lg:text-[12rem] tracking-tighter text-[var(--site-fg)] leading-[0.8] break-words uppercase"
        >
          {profile.displayName}
        </motion.h1>

        {/* Tagline / Subtitle */}
        {profile.tagline ? (
          <motion.p
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(16px)" }}
            animate={{ opacity: 1, transform: "translateY(0px)" }}
            transition={{ duration: 0.4, delay: 0.16, ease: EMIL_EASE_OUT }}
            className="mt-6 max-w-2xl text-base sm:text-lg md:text-xl text-[var(--site-muted)] leading-relaxed font-light"
          >
            {profile.tagline}
          </motion.p>
        ) : null}

        {/* Action CTA & Social Icon Links */}
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(16px)" }}
          animate={{ opacity: 1, transform: "translateY(0px)" }}
          transition={{ duration: 0.4, delay: 0.24, ease: EMIL_EASE_OUT }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          {/* Quick CTA to Booking */}
          <a
            href="#contacto"
            className="pressable inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--site-fg)] text-[var(--site-bg)] font-medium text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:opacity-90 transition-opacity"
          >
            <span>Reservar DJ</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </a>

          {/* Social Platform Icons — real SVGs */}
          {activeLinks.map((key) => {
            const href = profile.links[key];
            const platform = SOCIAL_ICONS[key];
            if (!href || !platform) return null;
            return (
              <a
                key={key}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={platform.label}
                data-link={key}
                className="pressable inline-flex items-center justify-center w-10 h-10 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] backdrop-blur-md text-[var(--site-fg)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] transition-colors"
              >
                {platform.icon("w-[18px] h-[18px]")}
              </a>
            );
          })}
        </motion.div>
      </div>

      {/* Decorative Bottom Rule */}
      <div className="relative z-10 max-w-6xl w-full mx-auto mt-12 pt-4 border-t border-[var(--site-card-border)] flex justify-between items-center text-[10px] uppercase font-mono text-[var(--site-muted)]">
        <span>Curated Sets &amp; Performances</span>
        <span>Scroll to Explore</span>
      </div>
    </section>
  );
}
