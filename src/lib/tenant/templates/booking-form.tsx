"use client";

import { useEffect, useState } from "react";
import {
  BOOKING_EVENT_TYPES,
  BOOKING_EVENT_TYPE_LABELS,
  type BookingEventType,
} from "@/domain/booking";
import { BookingCaptcha } from "@/lib/tenant/templates/booking-captcha";
import { configuredTurnstileSiteKey } from "@/lib/tenant/templates/turnstile-widget";

const panelClass =
  "site-booking-panel rounded-3xl border border-[var(--site-fg)] bg-[var(--site-fg)] text-[var(--site-bg)] shadow-[0_20px_50px_rgba(0,0,0,0.28)] overflow-hidden w-full max-w-full";

const labelClass =
  "text-[11px] font-mono uppercase tracking-wider text-[color-mix(in_srgb,var(--site-bg)_70%,var(--site-fg))]";

const fieldClass =
  "w-full max-w-full min-w-0 block rounded-xl border border-[color-mix(in_srgb,var(--site-bg)_22%,var(--site-fg))] bg-[color-mix(in_srgb,var(--site-bg)_8%,var(--site-fg))] px-3.5 py-2.5 text-base sm:text-sm text-[var(--site-bg)] placeholder:text-[color-mix(in_srgb,var(--site-bg)_45%,var(--site-fg))] outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:border-[var(--site-bg)] transition-colors box-border";

export type BookingFormProps = {
  slug: string;
  artistName: string;
  theme?: "light" | "dark" | "auto";
};

export function BookingForm({
  slug,
  artistName,
  theme = "auto",
}: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventType, setEventType] = useState<BookingEventType>("club");
  const [city, setCity] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [note, setNote] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [captchaMounted, setCaptchaMounted] = useState(false);
  const captchaEnabled = Boolean(configuredTurnstileSiteKey());

  useEffect(() => {
    setCaptchaMounted(true);
  }, []);

  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Por favor ingresá tu nombre o productora.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Por favor ingresá un correo electrónico válido.");
      return;
    }
    if (captchaEnabled && !turnstileToken) {
      setErrorMessage("Completá la verificación de seguridad para continuar.");
      return;
    }

    setStatus("submitting");

    try {
      const response = await fetch(`/api/tenant/booking?slug=${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim() || null,
          eventType,
          city: city.trim() || null,
          eventDate: eventDate.trim() || null,
          note: note.trim() || null,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStatus("error");
        setCaptchaResetKey((key) => key + 1);
        setErrorMessage(
          data?.message || "No se pudo enviar la solicitud. Por favor intentá nuevamente.",
        );
        return;
      }

      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Ocurrió un error de conexión al enviar la solicitud. Intentá de nuevo.",
      );
    }
  }

  function handleReset() {
    setName("");
    setEmail("");
    setPhone("");
    setEventType("club");
    setCity("");
    setEventDate("");
    setNote("");
    setTurnstileToken("");
    setStatus("idle");
    setErrorMessage(null);
  }

  if (status === "success") {
    return (
      <div className={`${panelClass} p-6 sm:p-8 md:p-10 text-center flex flex-col items-center justify-center animate-fadeIn`}>
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg
            className="w-7 h-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl uppercase tracking-tight text-[var(--site-bg)] sm:text-3xl">
          ¡Solicitud enviada!
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[color-mix(in_srgb,var(--site-bg)_78%,var(--site-fg))] sm:text-base">
          Recibimos tu solicitud para <span className="font-semibold text-[var(--site-bg)]">{artistName}</span>.
          El artista o su equipo revisará los detalles y te responderá a la brevedad.
        </p>
        <button
          type="button"
          onClick={handleReset}
          className="pressable mt-6 inline-flex items-center justify-center rounded-xl bg-[var(--site-bg)] px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-[var(--site-fg)] transition-opacity hover:opacity-90"
        >
          Enviar otra propuesta
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${panelClass} flex flex-col gap-5 p-5 text-left sm:p-8 md:p-10 w-full max-w-full box-border`}
    >
      <div className="border-b border-[color-mix(in_srgb,var(--site-bg)_18%,var(--site-fg))] pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[color-mix(in_srgb,var(--site-bg)_70%,var(--site-fg))]">
          Solicitud directa
        </span>
        <h3 className="mt-1 font-display text-xl uppercase tracking-tight text-[var(--site-bg)] sm:text-2xl">
          Contratar / Solicitar fecha
        </h3>
      </div>

      {errorMessage && (
        <div className="rounded-xl bg-red-600 px-4 py-3 text-xs font-sans text-white sm:text-sm">
          {errorMessage}
        </div>
      )}

      {/* Nombre y Correo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <label
            htmlFor="booking-name"
            className={labelClass}
          >
            Nombre / Productora *
          </label>
          <input
            id="booking-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Club Vertigo / Productora"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <label
            htmlFor="booking-email"
            className={labelClass}
          >
            Correo electrónico *
          </label>
          <input
            id="booking-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contacto@evento.com"
            className={fieldClass}
          />
        </div>
      </div>

      {/* Teléfono y Ciudad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <label
            htmlFor="booking-phone"
            className={labelClass}
          >
            Teléfono / WhatsApp
          </label>
          <input
            id="booking-phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+506 8888-8888"
            className={fieldClass}
          />
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <label
            htmlFor="booking-city"
            className={labelClass}
          >
            Ciudad / Ubicación
          </label>
          <input
            id="booking-city"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ej: San José, Tamarindo, etc."
            className={fieldClass}
          />
        </div>
      </div>

      {/* Tipo de evento y Fecha */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <label
            htmlFor="booking-event-type"
            className={labelClass}
          >
            Tipo de evento *
          </label>
          <select
            id="booking-event-type"
            value={eventType}
            onChange={(e) => setEventType(e.target.value as BookingEventType)}
            className={fieldClass}
          >
            {BOOKING_EVENT_TYPES.map((type) => (
              <option key={type} value={type} className="bg-[var(--site-bg)] text-[var(--site-fg)]">
                {BOOKING_EVENT_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 min-w-0 w-full">
          <label
            htmlFor="booking-date"
            className={labelClass}
          >
            Fecha estimada
          </label>
          <input
            id="booking-date"
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Mensaje / Rider / Notas */}
      <div className="flex flex-col gap-1.5 min-w-0 w-full">
        <label
          htmlFor="booking-note"
          className={labelClass}
        >
          Detalles de la fecha / Presupuesto / Horario
        </label>
        <textarea
          id="booking-note"
          rows={3}
          maxLength={500}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Contanos sobre el horario propuesto, tipo de sonido, concepto de la fiesta o propuesta económica..."
          className={`${fieldClass} resize-none`}
        />
      </div>

      {captchaEnabled ? (
        <div className="mt-1 min-h-[78px] w-full min-w-0 overflow-hidden">
          {captchaMounted ? (
            <BookingCaptcha
              theme={theme}
              resetKey={captchaResetKey}
              onToken={setTurnstileToken}
              onClear={() => setTurnstileToken("")}
              onError={() => {
                setTurnstileToken("");
                setErrorMessage("No se pudo cargar la verificación de seguridad.");
              }}
            />
          ) : null}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="pressable mt-1 flex min-h-[3.25rem] w-full items-center justify-center rounded-2xl bg-[var(--site-bg)] px-5 py-3.5 text-sm font-medium tracking-wide text-[var(--site-fg)] transition-opacity disabled:opacity-50 sm:text-base sm:px-6"
      >
        {status === "submitting" ? (
          <span className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
            <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
            Enviando propuesta...
          </span>
        ) : (
          <span className="flex items-center justify-center sm:justify-between w-full gap-2 min-w-0">
            <span className="font-display uppercase tracking-wider text-sm sm:text-lg truncate">
              Enviar solicitud de booking
            </span>
            <span className="hidden sm:inline-flex text-xs font-mono uppercase tracking-widest shrink-0 items-center gap-1">
              Enviar <span aria-hidden="true">→</span>
            </span>
          </span>
        )}
      </button>
    </form>
  );
}
