"use client";

import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from "react";
import { getSiteTemplateAppearance, getSiteTemplateSections } from "@/domain/site-template";
import type { SiteSectionId } from "@/domain/site-template";
import { hasSiteSectionContent } from "@/domain/site-profile";
import { brandColorCssVars } from "@/lib/tenant/brand-color";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SmoothScrollProvider } from "@/lib/tenant/templates/smooth-scroll-provider";
import { SiteVisitBeacon } from "@/lib/tenant/templates/site-visit-beacon";
import { ProximitySectionRail } from "@/lib/tenant/templates/proximity-section-rail";

type SiteShellProps = SiteTemplateProps & {
  children: ReactNode;
};

const NAV_LABEL: Partial<Record<SiteSectionId, string>> = {
  agenda: "Fechas",
  bio: "Bio",
  enlaces: "Música",
  sets: "Sets",
};

export function SiteShell({ site, children }: SiteShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const sections = useMemo(
    () =>
      getSiteTemplateSections(site.templateId).flatMap((id) => {
        if (!hasSiteSectionContent(site.profile, id)) return [];
        const label = NAV_LABEL[id];
        return label ? [{ id, label }] : [];
      }),
    [site.profile, site.templateId],
  );
  const hasContact = hasSiteSectionContent(site.profile, "contacto");
  const railSections = useMemo(
    () => [
      { id: "inicio", label: "Inicio" },
      ...sections,
      ...(hasContact ? [{ id: "contacto", label: "Contacto" }] : []),
    ],
    [hasContact, sections],
  );
  const brandStyle = site.profile.brandColor
    ? (brandColorCssVars(site.profile.brandColor) as CSSProperties)
    : undefined;

  return (
    <SmoothScrollProvider>
      <SiteVisitBeacon />
      <div
        data-tenant-site=""
        data-template={site.templateId}
        data-appearance={getSiteTemplateAppearance(site.templateId)}
        style={brandStyle}
        className="relative min-h-[100dvh] flex flex-col bg-[var(--site-bg)] text-[var(--site-fg)] selection:bg-[var(--site-accent)] selection:text-white"
      >
        {/* Accessible Skip Link */}
        <a
          href="#site-main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--site-fg)] focus:text-[var(--site-bg)] focus:rounded-md text-xs font-mono uppercase"
        >
          Saltar al contenido principal
        </a>

        {/* Floating Translucent Header */}
        <header
          className={`site-header fixed top-0 left-0 right-0 z-50 py-4 transition-[background-color,backdrop-filter] duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            scrolled || mobileMenuOpen
              ? "is-solid bg-[var(--site-nav-bg)]/95 backdrop-blur-md"
              : "is-overlay bg-gradient-to-b from-black/55 via-black/20 to-transparent"
          }`}
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 flex items-center justify-between">
            {/* Brand Wordmark */}
            <a
              href="#site-main"
              className="site-wordmark pressable font-display text-lg sm:text-xl font-bold tracking-tight uppercase text-[var(--site-fg)] relative z-10"
            >
              {site.profile.displayName}
            </a>

            {/* Desktop Navigation Links */}
            <nav aria-label="Secciones" className="hidden md:flex items-center gap-7">
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="site-nav-link text-xs font-mono uppercase tracking-widest"
                >
                  {item.label}
                </a>
              ))}
              {hasContact ? (
                <a
                  href="#contacto"
                  className="pressable site-chip px-4 py-2 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)]"
                >
                  [ Contacto ]
                </a>
              ) : null}
            </nav>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
              className="pressable site-icon md:hidden w-10 h-10 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] flex items-center justify-center text-[var(--site-fg)] relative z-10"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </header>

        {/* Mobile Full-Screen Overlay Menu — separate from header, GPU-accelerated */}
        <div
          className="fixed inset-0 z-40 md:hidden pointer-events-none"
          aria-hidden={!mobileMenuOpen}
        >
          {/* Scrim backdrop */}
          <div
            className="absolute inset-0 bg-black/60 transition-opacity duration-300 ease-out"
            style={{
              opacity: mobileMenuOpen ? 1 : 0,
              pointerEvents: mobileMenuOpen ? "auto" : "none",
            }}
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sliding panel */}
          <nav
            className="absolute top-0 left-0 right-0 bg-[var(--site-bg)] pt-[72px] pb-10 px-6 transition-transform duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform"
            style={{
              transform: mobileMenuOpen ? "translateY(0)" : "translateY(-100%)",
              pointerEvents: mobileMenuOpen ? "auto" : "none",
            }}
          >
            <div className="flex flex-col gap-1 font-mono text-sm uppercase tracking-widest">
              {sections.map((item, i) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="site-menu-item py-4 text-[var(--site-fg)] border-b border-[var(--site-card-border)]/40"
                  style={{
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateY(0)" : "translateY(-12px)",
                    transitionDelay: mobileMenuOpen ? `${80 + i * 50}ms` : "0ms",
                  }}
                >
                  {item.label}
                </a>
              ))}
              {hasContact ? (
                <a
                  href="#contacto"
                  onClick={() => setMobileMenuOpen(false)}
                  className="pressable site-fill mt-6 py-4 text-center bg-[var(--site-fg)] text-[var(--site-bg)] font-medium text-xs tracking-wider uppercase"
                  style={{
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateY(0)" : "translateY(-12px)",
                    transitionDelay: mobileMenuOpen ? `${80 + sections.length * 50}ms` : "0ms",
                  }}
                >
                  Contacto
                </a>
              ) : null}
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <main id="site-main" className="flex-1 w-full">
          {children}
        </main>

        <ProximitySectionRail sections={railSections} />

        {hasContact ? (
          <a
            href="#contacto"
            className="pressable site-mobile-contact fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 z-30 inline-flex min-h-11 -translate-x-1/2 items-center rounded-full bg-[var(--site-fg)] px-5 text-xs font-mono font-medium uppercase tracking-wider text-[var(--site-bg)] shadow-[0_12px_36px_rgba(0,0,0,0.22)] md:hidden"
          >
            Contacto
          </a>
        ) : null}

        {/* Architectural Footer */}
        <footer className="w-full border-t border-[var(--site-card-border)] bg-[var(--site-surface)]/50 py-16 px-5 sm:px-8 md:px-12 mt-12">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-end gap-8">
            <div>
              <p className="text-[10px] font-mono tracking-widest uppercase text-[var(--site-accent)] mb-2">
                Sitio Oficial de Artista
              </p>
              <h4 className="font-display text-3xl sm:text-4xl font-bold uppercase text-[var(--site-fg)] tracking-tight">
                {site.profile.displayName}
              </h4>
              <p className="text-xs font-mono text-[var(--site-muted)] mt-1">
                {site.domain}
              </p>
            </div>

            <div className="flex flex-col sm:items-end gap-3 text-xs font-mono text-[var(--site-muted)]">
              <div className="flex items-center gap-4">
                <a href="#site-main" className="site-nav-link uppercase tracking-wider">
                  Volver Arriba ↑
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </SmoothScrollProvider>
  );
}
