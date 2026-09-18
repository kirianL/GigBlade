"use client";

import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

export function BioSection({ site }: SiteTemplateProps) {
  const profile = site.profile;

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
            {profile.bio ? (
              <p className="text-xl sm:text-2xl md:text-3xl text-[var(--site-fg)] font-light leading-relaxed">
                &ldquo;{profile.bio}&rdquo;
              </p>
            ) : null}
          </SiteReveal>

          {profile.tagline ? (
            <SiteReveal delay={0.16} yOffset={20}>
              <p className="mt-6 text-sm sm:text-base text-[var(--site-muted)] leading-relaxed max-w-xl">
                {profile.tagline}
              </p>
            </SiteReveal>
          ) : null}
        </div>

        {profile.city ? (
          <div className="lg:col-span-4 mt-8 lg:mt-0">
            <SiteReveal delay={0.12} yOffset={20}>
            <div>
              <p className="text-xl sm:text-2xl font-medium text-[var(--site-fg)] uppercase tracking-tight">
                {profile.city}
              </p>
              <p className="text-sm text-[var(--site-muted)] mt-1 uppercase tracking-widest font-mono">
                Ciudad
              </p>
            </div>
            </SiteReveal>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AgendaSection({ site }: SiteTemplateProps) {
  const events = site.profile.events ?? [];
  const hasContact = Boolean(site.profile.email || site.profile.links.instagram);

  const formatDate = (date: string) =>
    new Intl.DateTimeFormat("es-CR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${date}T00:00:00Z`));

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
            {events.length} {events.length === 1 ? "fecha" : "fechas"}
          </span>
        </div>
      </SiteReveal>

      {/* Tour dates list with interactive rows */}
      <div className="flex flex-col divide-y divide-[var(--site-card-border)] border-y border-[var(--site-card-border)]">
        {events.map((event, index) => (
          <SiteReveal key={`${event.date}-${event.venue}`} delay={Math.min(index * 0.05, 0.2)}>
            <article className="site-agenda-row py-6 sm:py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group px-3 -mx-3 rounded-lg transition-colors duration-[220ms] ease-[cubic-bezier(0.23,1,0.32,1)]">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-8">
                <time
                  dateTime={event.date}
                  className="font-mono text-sm sm:text-base text-[var(--site-accent)] font-semibold uppercase"
                >
                  {formatDate(event.date)}
                </time>
                <div>
                  <h3 className="text-lg sm:text-xl font-medium text-[var(--site-fg)]">
                    {event.venue}
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--site-muted)]">
                    {event.location}
                  </p>
                </div>
              </div>
              {event.ticketUrl ? (
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable site-chip inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)]"
                >
                  Entradas <span aria-hidden="true">↗</span>
                </a>
              ) : hasContact ? (
                <a
                  href="#contacto"
                  className="pressable site-chip inline-flex items-center gap-1.5 self-start sm:self-auto px-4 py-2 rounded-full border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)]"
                >
                  Consultar
                </a>
              ) : null}
            </article>
          </SiteReveal>
        ))}
      </div>
    </section>
  );
}
