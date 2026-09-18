import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

function signalBars(seed: string, count = 52) {
  const values = [...seed].map((letter) => letter.charCodeAt(0));
  return Array.from({ length: count }, (_, index) => {
    const value = values[index % Math.max(values.length, 1)] ?? 71;
    return 18 + ((value * (index + 7) * 13) % 68);
  });
}

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function ArtistSignal({ site }: SiteTemplateProps) {
  const profile = site.profile;
  const bars = signalBars(`${site.slug}-${profile.displayName}`);
  const nextEvent = profile.events?.[0];
  const featuredMix = profile.mixes?.[0];
  const eventAction = nextEvent?.ticketUrl
    ? nextEvent.ticketUrl
    : profile.email
      ? `mailto:${profile.email}`
      : profile.links.instagram;
  const hasDetails = Boolean(featuredMix || nextEvent);

  return (
    <section
      aria-label={`Señal de ${profile.displayName}`}
      className="site-signal relative mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 md:px-12"
    >
      <SiteReveal yOffset={16}>
        <div className="site-signal-card relative isolate overflow-hidden rounded-[1.75rem] border border-(--site-card-border) bg-(--site-surface) p-5 sm:p-7">
          <svg
            aria-hidden="true"
            className="site-signal-vinyl absolute -right-20 -top-36 -z-10 h-112 w-md opacity-20"
            viewBox="0 0 440 440"
            fill="none"
          >
            {Array.from({ length: 13 }, (_, index) => (
              <circle
                key={index}
                cx="220"
                cy="220"
                r={36 + index * 14}
                stroke="currentColor"
                strokeWidth={index % 3 === 0 ? 1.5 : 0.65}
                strokeDasharray={index % 2 === 0 ? "3 7" : undefined}
              />
            ))}
            <circle cx="220" cy="220" r="9" fill="currentColor" />
          </svg>

          <div
            className={
              hasDetails
                ? "grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)] lg:items-center"
                : "grid"
            }
          >
            <div>
              <svg
                aria-hidden="true"
                className="h-28 w-full overflow-visible text-(--site-fg) sm:h-36"
                viewBox={`0 0 ${bars.length * 8} 100`}
                preserveAspectRatio="none"
              >
                {bars.map((height, index) => (
                  <rect
                    key={index}
                    className="site-signal-bar"
                    x={index * 8}
                    y={(100 - height) / 2}
                    width="2.5"
                    height={height}
                    rx="1.25"
                    fill="currentColor"
                    opacity={index % 5 === 0 ? 1 : 0.42}
                    style={{
                      animationDelay: `-${(index * 83) % 1500}ms`,
                      animationDuration: `${1400 + (index % 7) * 120}ms`,
                    }}
                  />
                ))}
              </svg>

            </div>

            {hasDetails ? (
              <div className="grid gap-3">
                {featuredMix ? (
                  <a
                    href={featuredMix.url}
                    target="_blank"
                    rel="noreferrer"
                    className="pressable site-card group flex min-h-28 items-center justify-between gap-4 rounded-2xl border border-(--site-card-border) bg-(--site-bg) p-4 text-(--site-fg)"
                  >
                    <span className="min-w-0">
                      <strong className="block truncate text-base font-medium">
                        {featuredMix.title}
                      </strong>
                      <span className="mt-1 block font-mono text-[10px] uppercase tracking-widest text-(--site-muted)">
                        {featuredMix.platform}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest">
                      Escuchar <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                ) : null}

                {nextEvent ? (
                  <div className="flex min-h-28 items-center justify-between gap-4 rounded-2xl border border-(--site-card-border) bg-(--site-bg) p-4">
                    <div className="min-w-0">
                      <time
                        dateTime={nextEvent.date}
                        className="font-display text-2xl uppercase leading-none text-(--site-fg)"
                      >
                        {formatEventDate(nextEvent.date)}
                      </time>
                      <p className="mt-2 truncate text-sm font-medium text-(--site-fg)">
                        {nextEvent.venue}
                      </p>
                      <p className="truncate font-mono text-[9px] uppercase tracking-widest text-(--site-muted)">
                        {nextEvent.location}
                      </p>
                    </div>
                    {eventAction ? (
                      <a
                        href={eventAction}
                        target={nextEvent.ticketUrl ? "_blank" : undefined}
                        rel={nextEvent.ticketUrl ? "noreferrer" : undefined}
                        className="pressable site-chip shrink-0 rounded-full border border-(--site-card-border) px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-(--site-fg)"
                      >
                        {nextEvent.ticketUrl ? "Entradas" : "Consultar"}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </SiteReveal>
    </section>
  );
}
