"use client";

import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

export function BioSection({ site }: SiteTemplateProps) {
  const profile = site.profile;
  const hasBio = Boolean(profile.bio);

  return (
    <section
      id="bio"
      data-section="bio"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-8 md:px-12 max-w-6xl mx-auto border-t border-[var(--site-card-border)]"
    >
      <SiteReveal>

        <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-[var(--site-fg)] uppercase leading-[0.85]">
          La narrativa sonora
        </h2>
      </SiteReveal>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">
        {/* Left Column: Big Editorial Quote / Bio */}
        <div className="lg:col-span-8">
          <SiteReveal delay={0.08} yOffset={24}>
            {hasBio ? (
              <p className="text-xl sm:text-2xl md:text-3xl text-[var(--site-fg)] font-light leading-relaxed">
                &ldquo;{profile.bio}&rdquo;
              </p>
            ) : (
              <p className="text-xl sm:text-2xl md:text-3xl text-[var(--site-muted)] font-light leading-relaxed italic">
                &ldquo;Sets diseñados para conectar la pista con la energía pura del sonido. Cada noche una historia irrepetible.&rdquo;
              </p>
            )}
          </SiteReveal>

          {profile.tagline ? (
            <SiteReveal delay={0.16} yOffset={20}>
              <p className="mt-6 text-sm sm:text-base text-[var(--site-muted)] leading-relaxed max-w-xl">
                {profile.tagline}
              </p>
            </SiteReveal>
          ) : null}
        </div>

        <div className="lg:col-span-4 flex flex-col gap-8 mt-8 lg:mt-0">
          <SiteReveal delay={0.12} yOffset={20}>
            <div>
              <p className="text-xl sm:text-2xl font-medium text-[var(--site-fg)] uppercase tracking-tight">
                {profile.city || "San José, Costa Rica"}
              </p>
              <p className="text-sm text-[var(--site-muted)] mt-1 uppercase tracking-widest font-mono">Base de operaciones</p>
            </div>
          </SiteReveal>

          <SiteReveal delay={0.2} yOffset={20}>
            <div>
              <p className="text-xl sm:text-2xl font-medium text-[var(--site-fg)] uppercase tracking-tight">
                DJ Sets & Extended Sets
              </p>
              <p className="text-sm text-[var(--site-muted)] mt-1 uppercase tracking-widest font-mono">Club & Festivales</p>
            </div>
          </SiteReveal>

          <SiteReveal delay={0.28} yOffset={20}>
            <div>
              <p className="text-xl sm:text-2xl font-medium text-[var(--site-fg)] uppercase tracking-tight">
                Booking Abierto
              </p>
              <p className="text-sm text-[var(--site-muted)] mt-1 uppercase tracking-widest font-mono">Disponibilidad</p>
            </div>
          </SiteReveal>
        </div>
      </div>
    </section>
  );
}

export function AgendaSection({ site }: SiteTemplateProps) {
  return (
    <section
      id="agenda"
      data-section="agenda"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-8 md:px-12 max-w-6xl mx-auto border-t border-[var(--site-card-border)]"
    >
      <SiteReveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <div>

            <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-[var(--site-fg)] uppercase leading-[0.85]">
              Próximas Fechas
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--site-muted)] uppercase tracking-wider">
            Temporada 2026 / 2027
          </span>
        </div>
      </SiteReveal>

      {/* Tour dates list with interactive rows */}
      <div className="flex flex-col divide-y divide-[var(--site-card-border)] border-y border-[var(--site-card-border)]">
        {/* Placeholder announcement rows */}
        <SiteReveal delay={0.06}>
          <div className="py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-[var(--site-surface)]/50 px-3 -mx-3 rounded-lg transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <span className="font-mono text-sm sm:text-base text-[var(--site-accent)] font-semibold">
                PRÓXIMAMENTE
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-[var(--site-fg)]">
                  Fechas en anuncio & residencias
                </h3>
                <p className="text-xs sm:text-sm text-[var(--site-muted)]">
                  {site.profile.city || "San José"} · Clubes & Festivales
                </p>
              </div>
            </div>
            <a
              href="#contacto"
              className="pressable inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] transition-colors"
            >
              <span>Consultar Fecha</span>
              <span>→</span>
            </a>
          </div>
        </SiteReveal>

        <SiteReveal delay={0.12}>
          <div className="py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:bg-[var(--site-surface)]/50 px-3 -mx-3 rounded-lg transition-colors">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
              <span className="font-mono text-sm sm:text-base text-[var(--site-muted)]">
                DISPONIBLE
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-medium text-[var(--site-fg)]">
                  Fechas privadas & eventos corporativos
                </h3>
                <p className="text-xs sm:text-sm text-[var(--site-muted)]">
                  Agenda abierta para producciones exclusivas
                </p>
              </div>
            </div>
            <a
              href="#contacto"
              className="pressable inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)] hover:border-[var(--site-accent)] hover:text-[var(--site-accent)] transition-colors"
            >
              <span>Reservar</span>
              <span>→</span>
            </a>
          </div>
        </SiteReveal>
      </div>
    </section>
  );
}
