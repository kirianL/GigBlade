import { phoneWhatsappUrl } from "@/domain/waitlist";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";
import { BookingForm } from "@/lib/tenant/templates/booking-form";

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
  const phone = profile.phone;
  const whatsapp = phone ? phoneWhatsappUrl(phone) : null;
  const handle = instagram ? instagramHandle(instagram) : undefined;
  const hasActions = Boolean(email || phone || instagram);
  const theme = site.templateId === "pista" ? "light" : "dark";

  return (
    <section
      id="contacto"
      data-section="contacto"
      className="relative w-full py-14 sm:py-20 md:py-28 px-5 sm:px-8 md:px-12 max-w-6xl mx-auto border-t border-[var(--site-card-border)]"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-start lg:gap-12">
        <SiteReveal className="lg:col-span-5 flex flex-col gap-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-[var(--site-muted)]">
              Contrataciones
            </span>
            <h2 className="font-display text-5xl uppercase leading-[0.85] tracking-tighter text-[var(--site-fg)] sm:text-7xl md:text-8xl mt-2">
              Booking
            </h2>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-[var(--site-muted)] sm:text-base">
              Completá el formulario para consultar disponibilidad, cotizar un evento o solicitar el rider técnico de{" "}
              <span className="text-[var(--site-fg)] font-medium">{profile.displayName}</span>.
            </p>
          </div>

          {hasActions && (
            <div className="mt-2">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--site-muted)] mb-3 opacity-80">
                Canales directos alternativos
              </span>
              <ul className="flex flex-col gap-2.5">
                {email ? (
                  <li>
                    <a
                      href={`mailto:${email}`}
                      aria-label={`Enviar correo a ${email}`}
                      className="pressable site-fill flex min-h-[4rem] items-center justify-between gap-4 rounded-2xl bg-[var(--site-fg)] px-5 py-3.5 text-[var(--site-bg)]"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-mono uppercase tracking-widest opacity-70">
                          Correo
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium normal-case tracking-normal sm:text-sm">
                          {email}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest">
                        Escribir <span aria-hidden="true">↗</span>
                      </span>
                    </a>
                  </li>
                ) : null}
                {phone && whatsapp ? (
                  <li>
                    <a
                      href={whatsapp}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Abrir WhatsApp al ${phone}`}
                      className="pressable site-card flex min-h-[4rem] items-center justify-between gap-4 rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-card-bg)] px-5 py-3.5 text-[var(--site-fg)]"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--site-muted)]">
                          WhatsApp
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium sm:text-sm">
                          {phone}
                        </span>
                      </span>
                      <span className="shrink-0 text-[10px] font-mono uppercase tracking-widest text-[var(--site-muted)]">
                        Chat <span aria-hidden="true">↗</span>
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
                      className="pressable site-card flex min-h-[4rem] items-center justify-between gap-4 rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-card-bg)] px-5 py-3.5 text-[var(--site-fg)]"
                    >
                      <span className="min-w-0">
                        <span className="block text-[10px] font-mono uppercase tracking-widest text-[var(--site-muted)]">
                          Instagram
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium sm:text-sm">
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
            </div>
          )}
        </SiteReveal>

        <SiteReveal delay={0.08} yOffset={20} className="lg:col-span-7">
          <BookingForm
            slug={site.slug}
            artistName={profile.displayName}
            theme={theme}
          />
        </SiteReveal>
      </div>
    </section>
  );
}
