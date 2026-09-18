import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

function instagramHandle(href: string): string | undefined {
  try {
    const part = new URL(href).pathname.split("/").filter(Boolean)[0];
    if (!part) return undefined;
    return `@${decodeURIComponent(part).replace(/^@/, "")}`;
  } catch {
    return undefined;
  }
}

export function ContactoSection({ site }: SiteTemplateProps) {
  const profile = site.profile;
  const instagram = profile.links.instagram;
  const email = profile.email;
  const handle = instagram ? instagramHandle(instagram) : undefined;
  const hasActions = Boolean(email || instagram);

  return (
    <section
      id="contacto"
      data-section="contacto"
      className="relative w-full py-14 sm:py-20 md:py-28 px-5 sm:px-8 md:px-12 max-w-6xl mx-auto border-t border-[var(--site-card-border)]"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-end lg:gap-12">
        <SiteReveal className="lg:col-span-5">
          <h2 className="font-display text-5xl uppercase leading-[0.85] tracking-tighter text-[var(--site-fg)] sm:text-7xl md:text-8xl">
            Contacto
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--site-muted)] sm:text-base">
            Para fechas, rider y contrataciones, escribile directo al artista.
          </p>
        </SiteReveal>

        <SiteReveal delay={0.08} yOffset={20} className="lg:col-span-7">
          {hasActions ? (
            <ul className="flex flex-col gap-3">
              {email ? (
                <li>
                  <a
                    href={`mailto:${email}`}
                    aria-label={`Enviar correo a ${email}`}
                    className="pressable site-fill flex min-h-[4.75rem] items-center justify-between gap-4 rounded-2xl bg-[var(--site-fg)] px-5 py-4 text-[var(--site-bg)] lg:min-h-[6.5rem]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] font-mono uppercase tracking-widest opacity-70">
                        Correo
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium normal-case tracking-normal sm:text-base">
                        {email}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest">
                      Escribir <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                </li>
              ) : null}
              {instagram ? (
                <li>
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="pressable site-card flex min-h-[4.75rem] items-center justify-between gap-4 rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-card-bg)] px-5 py-4 text-[var(--site-fg)] lg:min-h-[6.5rem]"
                  >
                    <span className="min-w-0">
                      <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--site-muted)]">
                        Instagram
                      </span>
                      <span className="mt-1 block truncate text-sm font-medium sm:text-base">
                        {handle ?? "Enviar DM"}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-[var(--site-muted)]">
                      Abrir <span aria-hidden="true">↗</span>
                    </span>
                  </a>
                </li>
              ) : null}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--site-card-border)] p-6 text-center text-sm font-mono uppercase tracking-widest text-[var(--site-muted)]">
              El contacto se publica cuando el DJ cargue un correo o Instagram.
            </div>
          )}
        </SiteReveal>
      </div>
    </section>
  );
}
