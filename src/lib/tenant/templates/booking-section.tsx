"use client";

import { useState, type FormEvent } from "react";
import type { SiteTemplateProps } from "@/lib/tenant/templates/types";
import { SiteReveal } from "@/lib/tenant/templates/reveal";

export function ContactoSection({ site }: SiteTemplateProps) {
  const profile = site.profile;
  const instagram = profile.links.instagram;

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    eventType: "Club / Festival",
    date: "",
    city: profile.city || "",
    message: "",
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate snappy network store for MVP
    await new Promise((resolve) => setTimeout(resolve, 350));

    try {
      const storageKey = `gigblade.bookings.${site.slug}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || "[]");
      const record = {
        ...formData,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify([record, ...existing]));
    } catch {
      // Storage fallback
    }

    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section
      id="contacto"
      data-section="contacto"
      className="relative w-full py-20 sm:py-28 px-5 sm:px-8 md:px-12 max-w-6xl mx-auto border-t border-[var(--site-card-border)]"
    >
      <SiteReveal>
        <div className="max-w-2xl">
          <p className="text-xs uppercase font-mono tracking-widest text-[var(--site-accent)] mb-2">
            Booking & Management
          </p>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl tracking-tight text-[var(--site-fg)] uppercase leading-[0.95]">
            Reservá una fecha
          </h2>
          <p className="mt-4 text-sm sm:text-base text-[var(--site-muted)] leading-relaxed">
            Completá los datos de tu evento o club. Recibí rider técnico, disponibilidad y propuesta directa del artista.
          </p>
        </div>
      </SiteReveal>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Left Column: Booking Form */}
        <div className="lg:col-span-7">
          <SiteReveal delay={0.08} yOffset={20}>
            <div className="p-6 sm:p-8 rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-card-bg)] backdrop-blur-md">
              {submitted ? (
                <div className="py-8 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--site-accent)]/10 text-[var(--site-accent)] flex items-center justify-center mb-4">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-[var(--site-fg)] uppercase font-display tracking-tight">
                    Solicitud Registrada
                  </h3>
                  <p className="mt-2 text-sm text-[var(--site-muted)] max-w-sm">
                    Los detalles han quedado guardados en la bandeja del DJ. El equipo se pondrá en contacto a la brevedad.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: "",
                        eventType: "Club / Festival",
                        date: "",
                        city: profile.city || "",
                        message: "",
                      });
                    }}
                    className="pressable mt-6 px-4 py-2 rounded-full border border-[var(--site-card-border)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)] hover:border-[var(--site-accent)] transition-colors"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  {/* Name Input */}
                  <div>
                    <label
                      htmlFor="booking-name"
                      className="block text-xs font-mono uppercase tracking-wider text-[var(--site-muted)] mb-2"
                    >
                      Nombre / Productora / Club *
                    </label>
                    <input
                      id="booking-name"
                      required
                      type="text"
                      placeholder="Ej. Promotora Nocturna o Productor"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--site-card-border)] bg-[var(--site-bg)] text-[var(--site-fg)] placeholder:text-[var(--site-muted)]/60 text-base focus:outline-none focus:border-[var(--site-accent)] transition-colors"
                    />
                  </div>

                  {/* Grid: Event Type & Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="booking-type"
                        className="block text-xs font-mono uppercase tracking-wider text-[var(--site-muted)] mb-2"
                      >
                        Tipo de Evento
                      </label>
                      <select
                        id="booking-type"
                        value={formData.eventType}
                        onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--site-card-border)] bg-[var(--site-bg)] text-[var(--site-fg)] text-base focus:outline-none focus:border-[var(--site-accent)] transition-colors"
                      >
                        <option value="Club / Festival">Club / Festival</option>
                        <option value="Afterparty">Afterparty</option>
                        <option value="Evento Privado">Evento Privado</option>
                        <option value="Sesión en Vivo / Stream">Sesión en Vivo / Stream</option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="booking-date"
                        className="block text-xs font-mono uppercase tracking-wider text-[var(--site-muted)] mb-2"
                      >
                        Fecha Tentativa
                      </label>
                      <input
                        id="booking-date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--site-card-border)] bg-[var(--site-bg)] text-[var(--site-fg)] text-base focus:outline-none focus:border-[var(--site-accent)] transition-colors"
                      />
                    </div>
                  </div>

                  {/* Location Input */}
                  <div>
                    <label
                      htmlFor="booking-city"
                      className="block text-xs font-mono uppercase tracking-wider text-[var(--site-muted)] mb-2"
                    >
                      Ciudad / Venue
                    </label>
                    <input
                      id="booking-city"
                      type="text"
                      placeholder="Ej. San José, Costa Rica"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--site-card-border)] bg-[var(--site-bg)] text-[var(--site-fg)] placeholder:text-[var(--site-muted)]/60 text-base focus:outline-none focus:border-[var(--site-accent)] transition-colors"
                    />
                  </div>

                  {/* Message Input */}
                  <div>
                    <label
                      htmlFor="booking-message"
                      className="block text-xs font-mono uppercase tracking-wider text-[var(--site-muted)] mb-2"
                    >
                      Detalles o Requerimientos
                    </label>
                    <textarea
                      id="booking-message"
                      rows={3}
                      placeholder="Duración del set, horario, formato sonoro..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--site-card-border)] bg-[var(--site-bg)] text-[var(--site-fg)] placeholder:text-[var(--site-muted)]/60 text-base focus:outline-none focus:border-[var(--site-accent)] transition-colors resize-none"
                    />
                  </div>

                  {/* Submit Button with Emil Kowalski press feedback */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="pressable w-full py-3.5 rounded-xl bg-[var(--site-fg)] text-[var(--site-bg)] font-medium text-sm uppercase tracking-wider hover:opacity-95 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <span>Procesando...</span>
                    ) : (
                      <>
                        <span>Enviar Solicitud de Booking</span>
                        <span>→</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </SiteReveal>
        </div>

        {/* Right Column: Direct Channels & Artist Info */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <SiteReveal delay={0.14} yOffset={20}>
            <div className="p-6 rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-surface)]">
              <span className="text-[10px] font-mono tracking-widest text-[var(--site-accent)] uppercase block mb-1">
                Contacto Directo
              </span>
              <h3 className="text-xl font-display font-semibold text-[var(--site-fg)] uppercase">
                {profile.displayName}
              </h3>
              <p className="mt-2 text-xs text-[var(--site-muted)] leading-relaxed">
                Para contrataciones urgentes de fechas en fin de semana o coordinación de giras, podés comunicarte directamente por los canales oficiales.
              </p>

              {instagram ? (
                <div className="mt-6 pt-4 border-t border-[var(--site-card-border)]">
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noreferrer"
                    className="pressable inline-flex items-center justify-between w-full p-3 rounded-xl border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs font-mono uppercase tracking-wider text-[var(--site-fg)] hover:border-[var(--site-accent)] transition-colors"
                  >
                    <span>Escribir al Instagram Direct</span>
                    <span>↗</span>
                  </a>
                </div>
              ) : null}
            </div>
          </SiteReveal>

          <SiteReveal delay={0.2} yOffset={20}>
            <div className="p-5 rounded-2xl border border-[var(--site-card-border)] bg-[var(--site-card-bg)] text-xs text-[var(--site-muted)] font-mono leading-relaxed">
              <p className="uppercase text-[var(--site-fg)] font-semibold mb-1">
                Aclaración Técnica
              </p>
              Tiempos de respuesta habituales: 24 a 48 horas hábiles. Se incluye rider técnico y hospitality rider en la confirmación.
            </div>
          </SiteReveal>
        </div>
      </div>
    </section>
  );
}
