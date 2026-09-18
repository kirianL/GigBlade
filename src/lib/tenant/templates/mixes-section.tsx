import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { MixCover } from "@/lib/tenant/templates/mix-cover";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

const PLATFORM_LABEL = {
  youtube: "YouTube",
  soundcloud: "SoundCloud",
} as const;

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
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {mixes.map((mix, index) => (
            <li key={`${mix.url}-${index}`}>
              <SiteReveal delay={index * 0.04} yOffset={16}>
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
                    <p className="text-sm sm:text-base font-medium text-white truncate">
                      {mix.title}
                    </p>
                    <p className="mt-1 text-[10px] font-mono uppercase tracking-widest text-white/70">
                      {PLATFORM_LABEL[mix.platform]}
                    </p>
                  </div>
                </a>
              </SiteReveal>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
