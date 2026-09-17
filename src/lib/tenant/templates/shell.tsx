"use client";

import { useState, useEffect, type CSSProperties, type ReactNode } from "react";
import { getSiteTemplateAppearance, getSiteTemplateSections } from "@/domain/site-template";
import type { SiteSectionId } from "@/domain/site-template";
import { brandColorCssVars } from "@/lib/tenant/brand-color";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SmoothScrollProvider } from "@/lib/tenant/templates/smooth-scroll-provider";

type SiteShellProps = SiteTemplateProps & {
  children: ReactNode;
};

const NAV_LABEL: Partial<Record<SiteSectionId, string>> = {
  agenda: "Fechas",
  bio: "Bio",
  enlaces: "Música",
  contacto: "Booking",
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

  const sections = getSiteTemplateSections(site.templateId).flatMap((id) => {
    const label = NAV_LABEL[id];
    return label ? [{ id, label }] : [];
  });
  const brandStyle = site.profile.brandColor
    ? (brandColorCssVars(site.profile.brandColor) as CSSProperties)
    : undefined;

  return (
    <SmoothScrollProvider>
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
          className={`fixed top-0 left-0 right-0 z-50 py-4 transition-colors duration-300 ${
            scrolled || mobileMenuOpen
              ? "bg-[var(--site-nav-bg)] backdrop-blur-md border-b border-[var(--site-card-border)]"
              : "bg-transparent border-b border-transparent"
          }`}
        >
          <div className="max-w-6xl mx-auto px-5 sm:px-8 md:px-12 flex items-center justify-between">
            {/* Brand Wordmark */}
            <a
              href="#site-main"
              className="pressable font-display text-lg sm:text-xl font-bold tracking-tight uppercase text-[var(--site-fg)] relative z-10"
            >
              {site.profile.displayName}
            </a>

            {/* Desktop Navigation Links */}
            <nav aria-label="Secciones" className="hidden md:flex items-center gap-6">
              {sections.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="pressable text-xs font-mono uppercase tracking-widest text-[var(--site-muted)] hover:text-[var(--site-fg)] transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#contacto"
                className="pressable px-4 py-2 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] transition-colors"
              >
                [ Booking ]
              </a>
            </nav>

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileMenuOpen}
              className="pressable md:hidden w-10 h-10 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] flex items-center justify-center text-[var(--site-fg)] relative z-10"
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
                  className="py-4 text-[var(--site-fg)] border-b border-[var(--site-card-border)]/40 transition-all duration-300 ease-out"
                  style={{
                    opacity: mobileMenuOpen ? 1 : 0,
                    transform: mobileMenuOpen ? "translateY(0)" : "translateY(-12px)",
                    transitionDelay: mobileMenuOpen ? `${80 + i * 50}ms` : "0ms",
                  }}
                >
                  {item.label}
                </a>
              ))}
              <a
                href="#contacto"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-6 py-4 text-center bg-[var(--site-fg)] text-[var(--site-bg)] font-medium text-xs tracking-wider uppercase transition-all duration-300 ease-out"
                style={{
                  opacity: mobileMenuOpen ? 1 : 0,
                  transform: mobileMenuOpen ? "translateY(0)" : "translateY(-12px)",
                  transitionDelay: mobileMenuOpen ? `${80 + sections.length * 50}ms` : "0ms",
                }}
              >
                Reservar Fecha
              </a>
            </div>
          </nav>
        </div>

        {/* Main Content */}
        <main id="site-main" className="flex-1 w-full">
          {children}
        </main>

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
                <a href="#site-main" className="pressable hover:text-[var(--site-fg)] uppercase tracking-wider">
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
