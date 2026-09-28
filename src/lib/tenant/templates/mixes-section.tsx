import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { MixCover } from "@/lib/tenant/templates/mix-cover";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

const PLATFORM_LABEL = {
  youtube: "YouTube",
  soundcloud: "SoundCloud",
} as const;

function MixTile({
  mix,
  fallbackCover,
}: {
  mix: NonNullable<SiteTemplateProps["site"]["profile"]["mixes"]>[number];
  fallbackCover: string;
}) {
  return (
    <a
      href={mix.url}
      target="_blank"
      rel="noreferrer"
      className="pressable site-card group relative block aspect-square overflow-hidden rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-surface)]"
    >
      <MixCover mix={mix} fallbackSrc={fallbackCover} />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
        <p className="truncate text-sm font-medium text-white sm:text-base">{mix.title}</p>
        <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/70">
          {PLATFORM_LABEL[mix.platform]}
        </p>
      </div>
    </a>
  );
}

export function MixesSection({ site }: SiteTemplateProps) {
  const mixes = site.profile.mixes ?? [];
  const hasMixes = mixes.length > 0;
  const fallbackCover =
    site.profile.heroPhoto ||
    site.profile.photos?.[0] ||
    "/images/dj/dj-hero.jpg";

  return (
    <section
      id="sets"
      data-section="sets"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-8 md:px-12 max-w-6xl mx-auto border-t border-[var(--site-card-border)]"
    >
      <SiteReveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16">
          <h2 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter text-[var(--site-fg)] uppercase leading-[0.85]">
            Sets
          </h2>
          <span className="text-xs font-mono text-[var(--site-muted)] uppercase tracking-wider">
            YouTube & SoundCloud
          </span>
        </div>
      </SiteReveal>

      {!hasMixes ? (
        <SiteReveal delay={0.08}>
          <div className="p-8 rounded-2xl border border-dashed border-[var(--site-card-border)] text-center text-sm font-mono text-[var(--site-muted)] uppercase tracking-widest">
            Cuando el DJ publique un mix, el link directo aparece acá.
          </div>
        </SiteReveal>
      ) : site.profile.mixStyle === "list" ? (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {mixes.map((mix, index) => (
            <li key={`${mix.url}-${index}`}>
              <SiteReveal delay={index * 0.04} yOffset={16}>
                <a
                  href={mix.url}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable site-card group flex min-h-16 items-center gap-3 rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-surface)] p-2"
                >
                  <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                    <MixCover mix={mix} fallbackSrc={fallbackCover} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-base font-medium text-[var(--site-fg)]">
                      {mix.title}
                    </span>
                    <span className="mt-1 block text-[10px] font-mono uppercase tracking-widest text-[var(--site-muted)]">
                      {PLATFORM_LABEL[mix.platform]}
                    </span>
                  </span>
                </a>
              </SiteReveal>
            </li>
          ))}
        </ul>
      ) : site.profile.mixStyle === "row" ? (
        <ul className="no-scrollbar -mx-5 m-0 flex list-none snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
          {mixes.map((mix, index) => (
            <li key={`${mix.url}-${index}`} className="w-[78%] shrink-0 snap-start sm:w-64">
              <SiteReveal delay={index * 0.04} yOffset={16}>
                <MixTile mix={mix} fallbackCover={fallbackCover} />
              </SiteReveal>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {mixes.map((mix, index) => (
            <li key={`${mix.url}-${index}`}>
              <SiteReveal delay={index * 0.04} yOffset={16}>
                <MixTile mix={mix} fallbackCover={fallbackCover} />
              </SiteReveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
