"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { DiscIcon } from "@phosphor-icons/react";
import { CR, US } from "country-flag-icons/react/3x2";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { slotText } from "slot-text";
import { IconArrowLeft, IconArrowRight } from "@/app/constant";
import {
  DEFAULT_MEETING_AVAILABILITY,
  isDateAvailableForMeeting,
  normalizeMeetingAvailability,
  type MeetingAvailability,
} from "@/domain/meeting-availability";
import {
  TurnstileWidget,
  configuredTurnstileSiteKey,
} from "@/lib/tenant/templates/turnstile-widget";
import { useTheme } from "@/panel/ThemeProvider";
import { ThemeToggle } from "@/panel/ThemeToggle";
import AppLink from "./app-link";
import {
  TilopaySdkCheckout,
  type TilopayCheckoutHandle,
  type TilopayCheckoutSession,
} from "./tilopay-sdk-checkout";

type Country = "CR" | "US";
type Step = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type PaymentConfig = {
  required: boolean;
  amount: number;
  currency: "USD" | "CRC";
  amountFormatted: string;
};

type PaymentReceipt = {
  orderNumber: string;
  amountFormatted: string;
  authCode: string | null;
};

const DRAFT_STORAGE_KEY = "gb_acceso_draft";

type Fields = {
  artistName: string;
  email: string;
  phone: string;
  country: Country;
  city: string;
  instagram: string;
  meetingAt: string;
  website: string;
  referralCode: string;
};

const QUESTIONS = [
  "¿Tu nombre artístico?",
  "¿Tu mejor correo?",
  "¿Tu número?",
  "¿En qué país?",
  "¿En qué provincia?",
  "¿Tu Instagram?",
  "¿Cuándo nos reunimos?",
  "Confirmá tu reserva.",
] as const;

const HINTS = [
  "Tu nombre artístico.",
  "Solo lo usaremos para contactarte.",
  "Opcional. Para avisarte por WhatsApp.",
  "Empezamos en Costa Rica.",
  "Así organizamos los primeros cupos.",
  "Instagram es opcional.",
  "Elegí día y hora (Hora Costa Rica).",
  "Realizá el pago para asegurar tu espacio.",
] as const;

const PROVINCES = [
  "San José",
  "Alajuela",
  "Cartago",
  "Heredia",
  "Guanacaste",
  "Puntarenas",
  "Limón",
] as const;

const PROVINCE_HINTS: Record<(typeof PROVINCES)[number], string> = {
  "San José": "Tierra de la capital.",
  Alajuela: "Tierra de mangos y volcanes.",
  Cartago: "Tierra de volcanes y agricultura.",
  Heredia: "Tierra de las flores.",
  Guanacaste: "Tierra de la pampa y el sabanero.",
  Puntarenas: "Tierra del Pacífico.",
  Limón: "Tierra del calipso.",
};

const EMPTY: Fields = {
  artistName: "",
  email: "",
  phone: "",
  country: "CR",
  city: "",
  instagram: "",
  meetingAt: "",
  website: "",
  referralCode: "",
};

const MEETING_HOURS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

function formatMeetingSummary(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const dayStr = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Costa_Rica",
  }).format(date);
  const timeStr = new Intl.DateTimeFormat("es-CR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Costa_Rica",
  }).format(date);
  const cap = dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
  return `${cap}, ${timeStr}`;
}

function buildGoogleCalendarUrl(
  iso: string,
  artistName: string,
): string | null {
  if (!iso) return null;
  const start = new Date(iso);
  if (Number.isNaN(start.getTime())) return null;
  const end = new Date(start.getTime() + 15 * 60 * 1000);
  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}Z$/, "Z");
  const title = encodeURIComponent(
    `Reunión GigBlades × ${artistName.trim() || "DJ"}`,
  );
  const details = encodeURIComponent(
    "Reunión de bienvenida (15 min) con el equipo de GigBlades para ver tu página web oficial de DJ y activar tu cupo.",
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${fmt(start)}/${fmt(end)}&details=${details}`;
}

const EASE = [0.23, 1, 0.32, 1] as const;

const SLOT = {
  direction: "down",
  rollBy: "word",
  skipUnchanged: false,
  bounce: 0.2,
  stagger: 36,
  duration: 260,
} as const;

const SLOT_BUTTON = {
  direction: "down",
  rollBy: "character",
  skipUnchanged: false,
  interrupt: true,
  bounce: 0.55,
} as const;

const SLOT_PROGRESS = {
  direction: "down",
  rollBy: "character",
  skipUnchanged: false,
  bounce: 0.15,
  stagger: 28,
  duration: 200,
} as const;

function AccessRoll({
  text,
  className,
  hover = false,
  play = false,
  live = true,
  options = SLOT,
}: {
  text: string;
  className?: string;
  hover?: boolean;
  play?: boolean;
  live?: boolean;
  options?: Parameters<typeof slotText>[2];
}) {
  const reduceMotion = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const ctrl = useRef<ReturnType<typeof slotText> | null>(null);
  const textRef = useRef(text);
  const optionsRef = useRef(options);
  const lastText = useRef(text);
  const played = useRef(false);

  useEffect(() => {
    textRef.current = text;
    optionsRef.current = options;
  });

  useEffect(() => {
    if (reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    ctrl.current = slotText(el, textRef.current, optionsRef.current);
    return () => {
      ctrl.current?.destroy();
      ctrl.current = null;
    };
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion || !live) return;
    const textChanged = lastText.current !== text;
    lastText.current = text;
    if (textChanged) {
      ctrl.current?.set(text, optionsRef.current);
      return;
    }
    if (play && !played.current) {
      played.current = true;
      ctrl.current?.set(text, optionsRef.current);
    }
  }, [text, live, play, reduceMotion]);

  useEffect(() => {
    if (!hover || reduceMotion) return;
    const el = ref.current;
    if (!el) return;
    const root = el.closest("[data-slot-hover-root]") ?? el;
    const enter = () => {
      ctrl.current?.set(textRef.current, {
        ...optionsRef.current,
        skipUnchanged: false,
        interrupt: true,
      });
    };
    root.addEventListener("mouseenter", enter);
    return () => root.removeEventListener("mouseenter", enter);
  }, [hover, reduceMotion]);

  if (reduceMotion) {
    return <span className={className}>{text}</span>;
  }

  return <span ref={ref} className={className} />;
}

const pageEnter = {
  hidden: { opacity: 0, transform: "translateY(10px)" },
  show: {
    opacity: 1,
    transform: "translateY(0px)",
    transition: { duration: 0.72, ease: EASE },
  },
};

const pageEnterStill = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.35 } },
};

export default function AccesoForm({
  initialVerifying = false,
}: {
  initialVerifying?: boolean;
}) {
  const id = useId();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState<Step>(0);
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "verifying" | "done"
  >(initialVerifying ? "verifying" : "idle");
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [introReady, setIntroReady] = useState(false);
  const [direction, setDirection] = useState(1);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [availability, setAvailability] = useState<MeetingAvailability>(
    DEFAULT_MEETING_AVAILABILITY,
  );
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    required: false,
    amount: 10,
    currency: "USD",
    amountFormatted: "US$ 10",
  });
  const [tilopaySession, setTilopaySession] =
    useState<TilopayCheckoutSession | null>(null);
  const [tilopayPaying, setTilopayPaying] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<PaymentReceipt | null>(
    null,
  );
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const formStartedAtRef = useRef<number>(Date.now());
  const formRef = useRef<HTMLFormElement>(null);
  const tilopayCheckoutRef = useRef<TilopayCheckoutHandle>(null);
  const sessionCacheKeyRef = useRef<string>("");
  const turnstileSiteKey = configuredTurnstileSiteKey();

  useEffect(() => {
    formStartedAtRef.current = Date.now();
    const timer = window.setTimeout(() => setIntroReady(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const refreshSlotsAndConfig = () => {
    return fetch("/api/waitlist", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            bookedSlots?: string[];
            availability?: unknown;
            payment?: PaymentConfig;
          } | null,
        ) => {
          if (Array.isArray(data?.bookedSlots)) {
            setBookedSlots(data.bookedSlots);
          }
          if (data?.availability) {
            setAvailability(normalizeMeetingAvailability(data.availability));
          }
          if (data?.payment) {
            setPaymentConfig(data.payment);
          }
        },
      )
      .catch(() => {
        // Ignore network error, slots remain open
      });
  };

  // Fetch booked slots + Tilopay requirement on mount and when approaching scheduler
  useEffect(() => {
    let active = true;
    if (step > 0 && step < 4) return;
    fetch("/api/waitlist", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (
          data: {
            bookedSlots?: string[];
            availability?: unknown;
            payment?: PaymentConfig;
          } | null,
        ) => {
          if (!active) return;
          if (Array.isArray(data?.bookedSlots)) {
            setBookedSlots(data.bookedSlots);
          }
          if (data?.availability) {
            setAvailability(normalizeMeetingAvailability(data.availability));
          }
          if (data?.payment) {
            setPaymentConfig(data.payment);
          }
        },
      )
      .catch(() => {
        // Ignore network error
      });
    return () => {
      active = false;
    };
  }, [step]);

  // Handle referral param + return redirect from Tilopay checkout
  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;

    try {
      const params = new URLSearchParams(window.location.search);
      const orderParam = params.get("order") || params.get("returnData") || "";
      const hasTilopayCallback =
        Boolean(orderParam) &&
        (params.has("code") ||
          params.has("OrderHash") ||
          params.has("tilopay-transaction") ||
          params.has("tpt"));

      if (hasTilopayCallback) {
        const code = params.get("code");
        const description = params.get("description");
        const auth = params.get("auth");
        const tilopayTransactionId =
          params.get("tilopay-transaction") || params.get("tpt");

        // Strip callback query params cleanly
        window.history.replaceState({}, "", window.location.pathname);

        // Hydrate non-sensitive draft while confirming server-to-server
        try {
          const rawSaved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
          if (rawSaved) {
            const parsed = JSON.parse(rawSaved) as Partial<Fields>;
            setFields((current) => ({ ...current, ...parsed }));
          }
        } catch {}

        setStatus("verifying");

        void fetch("/api/payments/tilopay/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            order: orderParam,
            returnData: params.get("returnData") || orderParam,
            code,
            description,
            auth,
            "tilopay-transaction": tilopayTransactionId,
          }),
        })
          .then(async (res) => {
            const payload = (await res.json().catch(() => null)) as {
              confirmed?: boolean;
              alreadyJoined?: boolean;
              artistName?: string;
              country?: Country;
              meetingAt?: string;
              payment?: PaymentReceipt;
              message?: string;
              draft?: Partial<Fields> | null;
            } | null;

            if (!active) return;

            if (res.ok && payload?.confirmed) {
              try {
                sessionStorage.removeItem(DRAFT_STORAGE_KEY);
                localStorage.removeItem("gb_ref");
                document.cookie = "gb_ref=; path=/; max-age=0;";
              } catch {}
              setFields((current) => ({
                ...current,
                artistName: payload.artistName ?? current.artistName,
                country: payload.country ?? current.country,
                meetingAt: payload.meetingAt ?? current.meetingAt,
                referralCode: "",
              }));
              setPaymentReceipt(payload.payment ?? null);
              setAlreadyJoined(Boolean(payload.alreadyJoined));
              setStatus("done");
              return;
            }

            if (payload?.draft) {
              const restored = payload.draft;
              setFields((current) => ({
                ...current,
                artistName: restored.artistName ?? current.artistName,
                email: restored.email ?? current.email,
                phone: restored.phone ?? current.phone,
                country: restored.country ?? current.country,
                city: restored.city ?? current.city,
                instagram: restored.instagram ?? current.instagram,
                meetingAt: restored.meetingAt ?? current.meetingAt,
                referralCode: restored.referralCode ?? current.referralCode,
              }));
            }

            void refreshSlotsAndConfig();
            setTilopaySession(null);
            sessionCacheKeyRef.current = "";
            setStep(6);
            setStatus("idle");
            setError(
              payload?.message ??
                "El pago no pudo completarse. Podés intentar nuevamente.",
            );
          })
          .catch(() => {
            if (!active) return;
            setTilopaySession(null);
            sessionCacheKeyRef.current = "";
            setStep(6);
            setStatus("idle");
            setError("No pudimos verificar el pago. Intentá de nuevo.");
          });

        return () => {
          active = false;
        };
      }

      const ref =
        params.get("ref") || params.get("referral") || params.get("r");
      if (ref) {
        const clean = ref.trim().toUpperCase();
        setFields((current) => ({ ...current, referralCode: clean }));
      } else {
        try {
          localStorage.removeItem("gb_ref");
          document.cookie = "gb_ref=; path=/; max-age=0;";
        } catch {}
        setFields((current) => ({ ...current, referralCode: "" }));
      }
    } catch {
      // Ignorar si hay error leyendo search params
    }

    return () => {
      active = false;
    };
  }, []);

  const saveDraftBeforeRedirect = () => {
    try {
      const draftToSave: Partial<Fields> = {
        artistName: fields.artistName.trim(),
        email: fields.email.trim(),
        phone: fields.phone.trim(),
        country: fields.country,
        city: fields.city.trim(),
        instagram: fields.instagram.trim(),
        meetingAt: fields.meetingAt.trim(),
        referralCode: fields.referralCode.trim(),
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftToSave));
    } catch {}
  };

  const moveTo = (next: Step) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError(null);
  };

  const validate = () => {
    if (step === 0) {
      const name = fields.artistName.trim();
      if (name.length === 0) {
        setError("El nombre artístico está vacío.");
        return false;
      }
      if (name.length < 2) {
        setError("El nombre artístico necesita al menos 2 caracteres.");
        return false;
      }
    }
    if (step === 1) {
      const email = fields.email.trim();
      if (email.length === 0) {
        setError("El correo está vacío.");
        return false;
      }
      if (email.includes(" ")) {
        setError("El correo no puede tener espacios.");
        return false;
      }
      if (!email.includes("@")) {
        setError("Al correo le falta el @.");
        return false;
      }
      const [local, domain] = email.split("@");
      if (!local) {
        setError("Escribí algo antes del @.");
        return false;
      }
      if (!domain) {
        setError("Falta el dominio después del @.");
        return false;
      }
      if (!domain.includes(".") || domain.endsWith(".")) {
        setError("Al dominio le falta la extensión, por ejemplo .com");
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("El correo no tiene un formato válido.");
        return false;
      }
    }
    if (step === 2 && fields.phone.trim()) {
      const phone = fields.phone.trim();
      const digits = phone.replace(/\D/g, "").length;
      if (
        phone.length > 30 ||
        digits < 7 ||
        digits > 15 ||
        !/^\+?[\d\s().-]+$/.test(phone)
      ) {
        setError("El número no es válido.");
        return false;
      }
    }
    if (step === 3 && fields.country !== "CR") {
      setError("De momento no estamos ahí.");
      return false;
    }
    if (
      step === 4 &&
      !PROVINCES.includes(fields.city as (typeof PROVINCES)[number])
    ) {
      setError("Elegí una provincia.");
      return false;
    }
    if (step === 5 && fields.instagram.trim()) {
      const handle = fields.instagram.trim().replace(/^@+/, "").toLowerCase();
      if (!/^[a-z0-9._]{1,30}$/.test(handle)) {
        setError("El Instagram no es válido.");
        return false;
      }
    }
    if (step === 6) {
      if (!fields.meetingAt.trim()) {
        setError("Seleccioná un día y una hora para nuestra reunión.");
        return false;
      }
      if (turnstileSiteKey && !turnstileToken) {
        setError("Completá la verificación de seguridad de Cloudflare.");
        return false;
      }
    }
    return true;
  };

  const startPaymentSession = async () => {
    const instagram = fields.instagram.replace(/^@+/, "").trim();
    const cacheKey = `${fields.email.trim().toLowerCase()}|${fields.meetingAt.trim()}|${fields.artistName.trim()}|${fields.city.trim()}`;
    if (tilopaySession && sessionCacheKeyRef.current === cacheKey) {
      moveTo(7);
      return;
    }

    setStatus("submitting");
    setError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 30_000);
    try {
      const response = await fetch("/api/payments/tilopay/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: fields.artistName.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim() || undefined,
          country: fields.country,
          city: fields.city.trim(),
          instagram: instagram || undefined,
          meetingAt: fields.meetingAt.trim(),
          website: fields.website,
          referralCode: fields.referralCode.trim() || undefined,
          packageId: "all_inclusive",
          turnstileToken: turnstileToken || undefined,
          formStartedAt: formStartedAtRef.current,
        }),
        signal: controller.signal,
      });

      const payload = (await response.json().catch(() => null)) as
        | ({
            alreadyJoined?: boolean;
            meetingAt?: string | null;
            message?: string;
          } & Partial<TilopayCheckoutSession>)
        | null;

      if (!response.ok) {
        setStatus("idle");
        setError(
          payload?.message ?? "No pudimos iniciar el cobro. Intentá de nuevo.",
        );
        if (response.status === 400) {
          void refreshSlotsAndConfig();
        }
        if (turnstileSiteKey) {
          setTurnstileToken("");
          setTurnstileResetKey((k) => k + 1);
        }
        return;
      }

      if (payload?.alreadyJoined) {
        try {
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
          localStorage.removeItem("gb_ref");
          document.cookie = "gb_ref=; path=/; max-age=0;";
        } catch {}
        setFields((current) => ({
          ...current,
          referralCode: "",
          meetingAt: payload.meetingAt ?? current.meetingAt,
        }));
        setAlreadyJoined(true);
        setStatus("done");
        return;
      }

      if (
        !payload?.sdkToken ||
        !payload?.orderNumber ||
        !payload?.billingDefaults
      ) {
        setStatus("idle");
        setError("La respuesta de Tilopay vino incompleta. Intentá de nuevo.");
        return;
      }

      const session: TilopayCheckoutSession = {
        sdkToken: payload.sdkToken,
        orderNumber: payload.orderNumber,
        amount: payload.amount ?? paymentConfig.amount,
        currency: payload.currency ?? paymentConfig.currency,
        amountFormatted:
          payload.amountFormatted ?? paymentConfig.amountFormatted,
        redirectUrl: payload.redirectUrl ?? `${window.location.origin}/acceso`,
        webhookUrl:
          payload.webhookUrl ??
          `${window.location.origin}/api/payments/tilopay/webhook`,
        billingDefaults: payload.billingDefaults,
      };

      setTilopaySession(session);
      sessionCacheKeyRef.current = cacheKey;
      setTilopayPaying(false);
      setStatus("idle");
      moveTo(7);
    } catch (caught) {
      setStatus("idle");
      setError(
        caught instanceof DOMException && caught.name === "AbortError"
          ? "La conexión con Tilopay tardó demasiado. Intentá de nuevo."
          : "No hay conexión. Intentá de nuevo.",
      );
    } finally {
      window.clearTimeout(timer);
    }
  };

  const joinWaitlist = async (
    instagram: string,
    meetingAtOverride?: string,
  ) => {
    if (turnstileSiteKey && !turnstileToken) {
      setError("Completá la verificación de seguridad de Cloudflare.");
      return;
    }
    setStatus("submitting");
    setError(null);
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 45_000);
    const finalMeetingAt =
      meetingAtOverride !== undefined
        ? meetingAtOverride
        : fields.meetingAt.trim();
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artistName: fields.artistName.trim(),
          email: fields.email.trim(),
          phone: fields.phone.trim() || undefined,
          country: fields.country,
          city: fields.city.trim(),
          instagram: instagram.trim() || undefined,
          meetingAt: finalMeetingAt || undefined,
          website: fields.website,
          referralCode: fields.referralCode.trim() || undefined,
          packageId: "all_inclusive",
          turnstileToken: turnstileToken || undefined,
          formStartedAt: formStartedAtRef.current,
        }),
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as {
        alreadyJoined?: boolean;
        meetingAt?: string | null;
        message?: string;
      } | null;
      if (!response.ok) {
        setStatus("idle");
        setError(payload?.message ?? "No pudimos anotarte. Intentá de nuevo.");
        if (turnstileSiteKey) {
          setTurnstileToken("");
          setTurnstileResetKey((k) => k + 1);
        }
        return;
      }
      try {
        localStorage.removeItem("gb_ref");
        document.cookie = "gb_ref=; path=/; max-age=0;";
      } catch {}
      setFields((current) => ({
        ...current,
        referralCode: "",
        meetingAt: finalMeetingAt,
      }));
      setAlreadyJoined(Boolean(payload?.alreadyJoined));
      setStatus("done");
    } catch (error) {
      setStatus("idle");
      setError(
        error instanceof DOMException && error.name === "AbortError"
          ? "La solicitud tardó demasiado. Intentá de nuevo."
          : "No hay conexión. Intentá de nuevo.",
      );
    } finally {
      window.clearTimeout(timer);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    if (step < 6) {
      moveTo((step + 1) as Step);
      return;
    }

    if (step === 6) {
      if (paymentConfig.required) {
        await startPaymentSession();
        return;
      }
      await joinWaitlist(fields.instagram.replace(/^@+/, ""));
      return;
    }

    if (step === 7) {
      await tilopayCheckoutRef.current?.submitPayment();
    }
  };

  const skipFocusDelay = useRef(true);

  useEffect(() => {
    if (status === "done" || status === "verifying") return;
    if (!introReady) return;
    const wait = skipFocusDelay.current || reduceMotion ? 0 : 240;
    skipFocusDelay.current = false;
    const timer = window.setTimeout(() => {
      const root = formRef.current;
      if (!root) return;
      const input = root.querySelector<HTMLInputElement>("[data-access-input]");
      if (input) {
        input.focus({ preventScroll: true });
        if (window.matchMedia("(pointer: fine)").matches) {
          input.select();
        }
        return;
      }
      (
        root.querySelector<HTMLElement>("[data-access-field][data-checked]") ??
        root.querySelector<HTMLElement>("[data-access-field]")
      )?.focus({ preventScroll: true });
    }, wait);
    return () => clearTimeout(timer);
  }, [step, status, reduceMotion, introReady]);

  const onFormKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Tab" || status !== "idle") return;
    // Native Tab navigation inside Step 7 card inputs
    if (step === 7) return;
    if (
      typeof window !== "undefined" &&
      !window.matchMedia("(pointer: fine)").matches
    ) {
      return;
    }

    if (event.shiftKey) {
      if (step === 0) return;
      event.preventDefault();
      moveTo((step - 1) as Step);
      return;
    }

    event.preventDefault();
    if (!validate()) return;
    if (step < 6) {
      moveTo((step + 1) as Step);
      return;
    }
    formRef.current?.requestSubmit();
  };

  const activeHint =
    step === 4 && PROVINCES.includes(fields.city as (typeof PROVINCES)[number])
      ? PROVINCE_HINTS[fields.city as (typeof PROVINCES)[number]]
      : step === 6 && fields.meetingAt
        ? formatMeetingSummary(fields.meetingAt)
        : step === 7 && fields.meetingAt
          ? `${formatMeetingSummary(fields.meetingAt)} — ${tilopaySession?.amountFormatted ?? paymentConfig.amountFormatted}`
          : HINTS[step];

  const totalSteps = paymentConfig.required
    ? QUESTIONS.length
    : QUESTIONS.length - 1;
  const { resolvedTheme } = useTheme();
  const isPaymentStep =
    (status === "idle" || status === "submitting") &&
    step === 7 &&
    Boolean(tilopaySession);

  return (
    <div className="app-canvas relative flex min-h-dvh flex-col overflow-hidden text-grayscale-12">
      <div
        aria-hidden
        className="aurora-wrapper pointer-events-none fixed inset-0 overflow-hidden"
      >
        <div className="aurora-top" />
        <div className="aurora-bottom" />
      </div>
      <Image
        src="/images/gigblade-access-signpost-blue.png"
        width={706}
        height={706}
        alt=""
        priority
        aria-hidden="true"
        className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
      />

      <motion.div
        className="relative z-10 flex min-h-0 flex-1 flex-col"
        initial={reduceMotion || initialVerifying ? "show" : "hidden"}
        animate="show"
        variants={reduceMotion ? pageEnterStill : pageEnter}
        onAnimationComplete={() => setIntroReady(true)}
      >
        <header className="mx-auto flex h-14 w-full max-w-5xl shrink-0 items-center justify-between gap-3 px-5 pt-[env(safe-area-inset-top)] sm:h-16 sm:px-8">
          <AppLink
            href="/"
            className="group inline-flex items-center gap-2 text-grayscale-12 transition-opacity duration-150 hover:opacity-80"
          >
            <span className="icon-tile flex size-7 items-center justify-center rounded-lg">
              <DiscIcon size={14} weight="bold" />
            </span>
            <span className="text-[13.5px] font-semibold tracking-[-0.02em]">
              GigBlades
            </span>
          </AppLink>
          <div className="flex items-center gap-3 sm:gap-4">
            {!isPaymentStep && fields.referralCode ? (
              <div className="hidden sm:flex items-center gap-1.5 rounded-md border border-grayscale-4 bg-grayscale-1 px-2.5 py-1 text-[11px] text-grayscale-10 select-none dark:bg-[#1b1b1a]">
                <span>Código:</span>
                <span className="font-mono font-semibold tracking-wider text-grayscale-12">
                  {fields.referralCode}
                </span>
              </div>
            ) : null}
            {!isPaymentStep && status !== "verifying" ? (
              <Progress
                step={step}
                totalSteps={totalSteps}
                done={status === "done"}
                reduceMotion={Boolean(reduceMotion)}
                live={introReady}
              />
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        {!isPaymentStep ? (
          <div className="relative z-10 h-px bg-grayscale-3 dark:bg-white/[0.08]">
            <motion.div
              className="h-full origin-left bg-grayscale-12"
              animate={{
                transform: `scaleX(${
                  status === "done" || status === "verifying"
                    ? 1
                    : Math.min(1, (step + 1) / totalSteps)
                })`,
              }}
              transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
            />
          </div>
        ) : null}

        <main
          className={`flex min-h-0 min-w-0 flex-1 justify-center overflow-y-auto ${
            isPaymentStep
              ? "items-start sm:items-center px-4 py-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8"
              : status === "done" || status === "verifying"
                ? "items-center px-5 py-8 sm:px-8 sm:py-10"
                : "items-start sm:items-center px-5 py-8 sm:px-8 sm:py-10"
          }`}
        >
          <AnimatePresence initial={false} mode="wait">
            {status === "verifying" ? (
              <motion.section
                key="verifying"
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: EASE }}
                className="flex w-full max-w-[340px] flex-col items-center justify-center px-4 text-center"
                aria-live="polite"
              >
                {/* Official minimalist Tilopay logo */}
                <div className="select-none">
                  <Image
                    src="/images/tilopay-logo.png"
                    width={140}
                    height={42}
                    alt="Tilopay"
                    priority
                    className="h-7 w-auto sm:h-8"
                  />
                </div>

                {/* Modern minimalist gliding beam loader */}
                <div
                  aria-hidden="true"
                  className="mt-6 h-[2px] w-40 overflow-hidden rounded-full bg-grayscale-4/70 dark:bg-white/[0.1]"
                >
                  <motion.div
                    className="h-full w-16 rounded-full bg-gradient-to-r from-transparent via-grayscale-12 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={
                      reduceMotion ? { x: "75%" } : { x: ["-100%", "260%"] }
                    }
                    transition={
                      reduceMotion
                        ? { duration: 0 }
                        : {
                            duration: 1.35,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                          }
                    }
                  />
                </div>

                <h1 className="mt-6 text-[clamp(1.35rem,5vw,1.75rem)] font-semibold leading-[1.2] tracking-[-0.025em] text-grayscale-12">
                  Verificando pago
                </h1>
                <p className="mt-2 text-[13.5px] leading-relaxed text-grayscale-9 sm:text-[14px]">
                  Confirmando tu reserva de forma segura
                </p>
              </motion.section>
            ) : status === "done" ? (
              <Success
                alreadyJoined={alreadyJoined}
                country={fields.country}
                artistName={fields.artistName}
                meetingAt={fields.meetingAt}
                paymentReceipt={paymentReceipt}
                reduceMotion={Boolean(reduceMotion)}
              />
            ) : isPaymentStep && tilopaySession ? (
              <motion.form
                key="payment-form"
                ref={formRef}
                onSubmit={submit}
                onKeyDown={onFormKeyDown}
                noValidate
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
                className="min-w-0 w-full max-w-[540px]"
              >
                <TilopaySdkCheckout
                  ref={tilopayCheckoutRef}
                  session={tilopaySession}
                  artistName={fields.artistName}
                  error={error}
                  onCancel={() => {
                    if (tilopayPaying) return;
                    moveTo(6);
                  }}
                  onBeforeRedirect={saveDraftBeforeRedirect}
                  onPayingChange={setTilopayPaying}
                  onError={setError}
                />
              </motion.form>
            ) : (
              <motion.form
                key="form"
                ref={formRef}
                onSubmit={submit}
                onKeyDown={onFormKeyDown}
                noValidate
                className="min-w-0 w-full max-w-2xl py-2 sm:py-0"
                initial={false}
                exit={{ opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.35, ease: EASE }}
              >
                <h1
                  className={`max-w-full font-semibold leading-[1.15] tracking-[-0.03em] text-grayscale-12 ${
                    step >= 6
                      ? "min-h-10 text-[clamp(24px,6vw,30px)] sm:max-w-2xl sm:text-[clamp(1.75rem,3.4vw,2.25rem)]"
                      : "min-h-12 text-[clamp(26px,8vw,32px)] sm:min-h-16 sm:max-w-xl sm:text-[clamp(2.15rem,4.5vw,3rem)]"
                  }`}
                >
                  <AccessRoll text={QUESTIONS[step]} live={introReady} />
                </h1>

                <p
                  id={`${id}-hint`}
                  className={`mt-2 min-h-6 text-sm leading-5 transition-colors duration-150 sm:text-[14px] ${
                    error ? "font-medium text-red-11" : "text-grayscale-9"
                  }`}
                  aria-live="polite"
                >
                  {error ? (
                    <span className="shake inline-block">{error}</span>
                  ) : (
                    <AccessRoll text={activeHint} live={introReady} />
                  )}
                </p>

                <motion.div
                  layout="size"
                  className={`relative overflow-hidden ${
                    step >= 6 ? "mt-3 sm:mt-4" : "mt-8 sm:mt-10"
                  }`}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
                >
                  <AnimatePresence
                    initial={false}
                    mode="popLayout"
                    custom={direction}
                  >
                    <motion.div
                      key={step}
                      custom={direction}
                      variants={{
                        enter: (dir: number) =>
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: dir * 12 },
                        center: { opacity: 1, y: 0 },
                        exit: (dir: number) =>
                          reduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, y: dir * -10 },
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        duration: reduceMotion ? 0 : 0.28,
                        ease: EASE,
                      }}
                    >
                      {step === 0 && (
                        <LineInput
                          id={`${id}-artist`}
                          value={fields.artistName}
                          placeholder="Nombre de DJ"
                          autoComplete="nickname"
                          invalid={Boolean(error)}
                          describedBy={`${id}-hint`}
                          onChange={(artistName) => {
                            setError(null);
                            setFields((current) => ({
                              ...current,
                              artistName,
                            }));
                          }}
                        />
                      )}
                      {step === 1 && (
                        <LineInput
                          id={`${id}-email`}
                          value={fields.email}
                          placeholder="nombre@correo.com"
                          type="email"
                          autoComplete="email"
                          invalid={Boolean(error)}
                          describedBy={`${id}-hint`}
                          onChange={(email) => {
                            setError(null);
                            setFields((current) => ({ ...current, email }));
                          }}
                        />
                      )}
                      {step === 2 && (
                        <LineInput
                          id={`${id}-phone`}
                          value={fields.phone}
                          placeholder="+506 8888 0000"
                          ariaLabel="Número de teléfono"
                          type="tel"
                          inputMode="tel"
                          autoComplete="tel"
                          invalid={Boolean(error)}
                          describedBy={`${id}-hint`}
                          onChange={(phone) => {
                            setError(null);
                            setFields((current) => ({ ...current, phone }));
                          }}
                        />
                      )}
                      {step === 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (status !== "idle") return;
                            setError(null);
                            setFields((current) => ({ ...current, phone: "" }));
                            moveTo(3);
                          }}
                          className="mt-3 cursor-pointer text-[13px] font-medium text-grayscale-9 transition-colors duration-150 hover:text-grayscale-12"
                        >
                          Saltar
                        </button>
                      )}
                      {step === 3 && (
                        <CountrySelect
                          value={fields.country}
                          onChange={(country) => {
                            setFields((current) => ({ ...current, country }));
                            setError(null);
                          }}
                          onUnavailable={() =>
                            setError("De momento no estamos ahí.")
                          }
                        />
                      )}
                      {step === 4 && (
                        <ProvinceSelect
                          value={fields.city}
                          onChange={(city) => {
                            setError(null);
                            setFields((current) => ({ ...current, city }));
                          }}
                        />
                      )}
                      {step === 5 && (
                        <InstagramInput
                          id={`${id}-instagram`}
                          value={fields.instagram}
                          describedBy={`${id}-hint`}
                          invalid={Boolean(error)}
                          onChange={(instagram) =>
                            setFields((current) => ({ ...current, instagram }))
                          }
                        />
                      )}
                      {step === 5 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (status !== "idle") return;
                            setError(null);
                            setFields((current) => ({
                              ...current,
                              instagram: "",
                            }));
                            moveTo(6);
                          }}
                          className="mt-3 cursor-pointer text-[13px] font-medium text-grayscale-9 transition-colors duration-150 hover:text-grayscale-12"
                        >
                          Saltar
                        </button>
                      )}
                      {step === 6 && (
                        <div className="flex flex-col gap-3">
                          <MeetingScheduler
                            value={fields.meetingAt}
                            bookedSlots={bookedSlots}
                            availability={availability}
                            reduceMotion={Boolean(reduceMotion)}
                            onChange={(meetingAt) => {
                              setError(null);
                              setFields((current) => ({
                                ...current,
                                meetingAt,
                              }));
                            }}
                          />
                          {turnstileSiteKey ? (
                            <div className="pt-1">
                              <TurnstileWidget
                                key={`${turnstileResetKey}-${resolvedTheme}`}
                                theme={resolvedTheme}
                                bare
                                onSuccess={(token) => {
                                  setTurnstileToken(token);
                                  setError(null);
                                }}
                                onExpire={() => setTurnstileToken("")}
                                onError={() =>
                                  setError(
                                    "La verificación de Cloudflare falló. Intentá de nuevo.",
                                  )
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>

                <motion.div
                  className="mt-6 flex w-full items-center gap-2 sm:mt-7 sm:w-auto"
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
                >
                  <AnimatePresence initial={false}>
                    {step > 0 && (
                      <motion.button
                        key="back"
                        type="button"
                        disabled={status === "submitting" || tilopayPaying}
                        onClick={() => moveTo((step - 1) as Step)}
                        aria-label="Volver"
                        initial={{
                          opacity: 0,
                          transform: reduceMotion ? "none" : "translateX(-8px)",
                        }}
                        animate={{
                          opacity: 1,
                          transform: "translateX(0px)",
                        }}
                        exit={{
                          opacity: 0,
                          transform: reduceMotion ? "none" : "translateX(-8px)",
                        }}
                        transition={{
                          duration: reduceMotion ? 0 : 0.28,
                          ease: EASE,
                        }}
                        className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-grayscale-4 bg-grayscale-1 text-grayscale-11 shadow-[0_1px_2px_rgba(28,22,16,0.04)] transition-[border-color,color,background-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
                      >
                        <span className="access-back-icon">
                          <IconArrowLeft className="h-4 w-4" />
                        </span>
                      </motion.button>
                    )}
                  </AnimatePresence>
                  <button
                    type="submit"
                    disabled={status === "submitting"}
                    className="flex h-11 min-w-0 flex-1 cursor-pointer items-center justify-between gap-4 rounded-md border border-transparent bg-grayscale-12 px-5 text-[13.5px] font-medium text-grayscale-1 shadow-[0_1px_2px_rgba(28,22,16,0.14)] transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] hover:bg-grayscale-11 active:scale-[0.96] disabled:cursor-wait disabled:opacity-50 sm:min-w-52 sm:flex-none"
                  >
                    <span className="whitespace-nowrap">
                      {status === "submitting"
                        ? step === 6 && paymentConfig.required
                          ? "Preparando pago…"
                          : "Enviando…"
                        : step === 6
                          ? paymentConfig.required
                            ? "Continuar al pago"
                            : "Agendar y anotarme"
                          : "Continuar"}
                    </span>
                    <IconArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                </motion.div>

                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="absolute left-[-9999px]"
                  value={fields.website}
                  onChange={(event) =>
                    setFields((current) => ({
                      ...current,
                      website: event.target.value,
                    }))
                  }
                />
              </motion.form>
            )}
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}

function Progress({
  step,
  totalSteps,
  done,
  reduceMotion,
  live = true,
}: {
  step: Step;
  totalSteps: number;
  done: boolean;
  reduceMotion: boolean;
  live?: boolean;
}) {
  const visibleQuestions = QUESTIONS.slice(0, totalSteps);
  return (
    <div
      className="flex items-center gap-2.5"
      aria-label={done ? "Completado" : `Paso ${step + 1} de ${totalSteps}`}
    >
      <div className="flex gap-1" aria-hidden="true">
        {visibleQuestions.map((question, index) => {
          const active = done || index <= step;
          return (
            <motion.span
              key={question}
              className="h-1 w-1 rounded-full bg-grayscale-12"
              animate={{ opacity: active ? 1 : 0.2 }}
              transition={{ duration: reduceMotion ? 0 : 0.16, ease: EASE }}
            />
          );
        })}
      </div>
      <span className="font-mono text-[10.5px] tabular-nums tracking-[0.12em] text-grayscale-9">
        <AccessRoll
          text={done ? "LISTO" : `0${step + 1}`}
          live={live}
          options={SLOT_PROGRESS}
        />
      </span>
    </div>
  );
}

function Success({
  alreadyJoined,
  country,
  artistName,
  meetingAt,
  paymentReceipt,
  reduceMotion,
}: {
  alreadyJoined: boolean;
  country: Country;
  artistName: string;
  meetingAt: string;
  paymentReceipt?: PaymentReceipt | null;
  reduceMotion: boolean;
}) {
  const place = country === "US" ? "Estados Unidos" : "Costa Rica";
  const meetingSummary = formatMeetingSummary(meetingAt);
  const gcalUrl = buildGoogleCalendarUrl(meetingAt, artistName);

  return (
    <motion.section
      key="success"
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, transform: "translateY(12px)" }
      }
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      transition={{ duration: reduceMotion ? 0.25 : 0.7, ease: EASE }}
      className="flex w-full flex-col items-center justify-center px-5 py-6 text-center"
      aria-live="polite"
    >
      <h1 className="max-w-[14ch] text-[clamp(2.15rem,8vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-grayscale-12">
        {alreadyJoined ? "Ya estabas en la lista." : "Estás en la lista."}
      </h1>
      <p className="mt-3 max-w-sm text-[14.5px] leading-6 text-grayscale-9">
        {alreadyJoined
          ? `Cuando abramos el próximo cupo en ${place}, te escribimos.`
          : meetingSummary
            ? "Tu reunión quedó agendada directamente en nuestra plataforma."
            : `Te escribiremos cuando abramos el próximo cupo en ${place}.`}
      </p>
      {meetingSummary ? (
        <div className="card mt-5 flex w-full max-w-sm flex-col items-center gap-2.5 px-4 py-3.5 text-left">
          <div className="flex w-full items-center justify-between gap-2">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-green-10">
              Reunión 1:1 confirmada
            </span>
            <span className="font-mono text-[10px] text-grayscale-8">
              15 MIN
            </span>
          </div>
          <p className="w-full text-sm font-semibold text-grayscale-12">
            {meetingSummary}
          </p>
          {paymentReceipt ? (
            <p className="w-full border-t border-grayscale-3/80 pt-2 font-mono text-[11px] text-grayscale-10 dark:border-white/[0.08]">
              Pago confirmado · {paymentReceipt.amountFormatted}
              {paymentReceipt.authCode
                ? ` · Aut. ${paymentReceipt.authCode}`
                : ""}
            </p>
          ) : null}
          {gcalUrl ? (
            <a
              href={gcalUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-0.5 inline-flex h-9 w-full items-center justify-center rounded-md border border-grayscale-4 bg-grayscale-1 px-3 font-mono text-[11px] font-medium text-grayscale-11 transition-[background-color,border-color,color,transform] duration-150 hover:border-grayscale-5 hover:bg-grayscale-2 hover:text-grayscale-12 active:scale-[0.96] dark:bg-grayscale-2 dark:hover:bg-grayscale-3"
            >
              + Agregar a Google Calendar
            </a>
          ) : null}
        </div>
      ) : null}
      <div className="mx-auto mt-6 w-[min(100%,14rem)] sm:mt-8 sm:w-[min(100%,16rem)]">
        <div className="access-success-art overflow-hidden rounded-xl border border-grayscale-4/80 bg-grayscale-1 dark:border-white/[0.1] dark:bg-[#1b1b1a]">
          <Image
            src="/images/gigblade-access-signpost-blue.png"
            width={706}
            height={706}
            alt="Un DJ en un cruce de caminos elige la flecha azul"
            className="mx-auto h-auto w-full"
            sizes="(max-width: 768px) 100vw, 706px"
            priority
          />
        </div>
      </div>
      <div>
        <AppLink
          href="/"
          onClick={() => {
            try {
              localStorage.removeItem("gb_ref");
              document.cookie = "gb_ref=; path=/; max-age=0;";
            } catch {}
          }}
          className="mt-6 inline-block text-[13px] font-medium text-grayscale-9 transition-colors duration-150 hover:text-grayscale-12"
        >
          ← Volver a GigBlades
        </AppLink>
      </div>
    </motion.section>
  );
}

function toCrDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "America/Costa_Rica",
  }).formatToParts(date);
  const y = parts.find((p) => p.type === "year")?.value ?? "2026";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function buildSlotIso(dateKey: string, hour24: string): string {
  return new Date(`${dateKey}T${hour24}:00-06:00`).toISOString();
}

function formatHourLabel(hour24: string, use24h: boolean): string {
  if (use24h) return hour24;
  const [hStr, mStr] = hour24.split(":");
  const h = Number(hStr);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mStr} ${suffix}`;
}

function isDayAvailable(dateKey: string, todayKey: string): boolean {
  if (dateKey < todayKey) return false;
  const d = new Date(`${dateKey}T12:00:00-06:00`);
  // Domingos cerrado (0)
  return d.getUTCDay() !== 0;
}

function getNextAvailableDateKeys(todayKey: string, count: number): string[] {
  const result: string[] = [];
  const cursor = new Date(`${todayKey}T12:00:00-06:00`);
  for (let i = 0; i < 45 && result.length < count; i++) {
    const key = toCrDateKey(cursor);
    if (isDayAvailable(key, todayKey)) {
      result.push(key);
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return result;
}

function MeetingScheduler({
  value,
  bookedSlots,
  availability,
  reduceMotion,
  onChange,
}: {
  value: string;
  bookedSlots: string[];
  availability: MeetingAvailability;
  reduceMotion: boolean;
  onChange: (iso: string) => void;
}) {
  const todayKey = useMemo(() => toCrDateKey(new Date()), []);
  const [monthCursor, setMonthCursor] = useState(() => {
    const [y, m] = todayKey.split("-").map(Number);
    return { year: y, month: m - 1 };
  });
  const [monthDirection, setMonthDirection] = useState(1);

  const firstAvailableKey = useMemo(() => {
    const cursor = new Date(`${todayKey}T12:00:00-06:00`);
    for (let i = 0; i < 60; i++) {
      const key = toCrDateKey(cursor);
      if (isDateAvailableForMeeting(key, todayKey, availability)) {
        return key;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return todayKey;
  }, [todayKey, availability]);

  const initialDateKey = useMemo(() => {
    if (value) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        const key = toCrDateKey(parsed);
        if (isDateAvailableForMeeting(key, todayKey, availability)) return key;
      }
    }
    return firstAvailableKey;
  }, [value, todayKey, availability, firstAvailableKey]);

  const [selectedDateKey, setSelectedDateKey] =
    useState<string>(initialDateKey);
  const [use24h, setUse24h] = useState<boolean>(false);

  const effectiveDateKey = isDateAvailableForMeeting(
    selectedDateKey,
    todayKey,
    availability,
  )
    ? selectedDateKey
    : firstAvailableKey;

  const bookedTimestamps = useMemo(() => {
    return bookedSlots
      .map((iso) => new Date(iso).getTime())
      .filter((t) => !Number.isNaN(t));
  }, [bookedSlots]);

  const slotsForSelectedDay = useMemo(() => {
    const nowPlusBuffer = Date.now() + 30 * 60 * 1000;
    const dayAvailable = isDateAvailableForMeeting(
      effectiveDateKey,
      todayKey,
      availability,
    );
    return availability.hours.map((hour24) => {
      const iso = buildSlotIso(effectiveDateKey, hour24);
      const slotMs = new Date(iso).getTime();
      const isPast = slotMs < nowPlusBuffer;
      const isBooked = bookedTimestamps.some(
        (bookedMs) => Math.abs(bookedMs - slotMs) < 25 * 60 * 1000,
      );
      return {
        hour24,
        iso,
        disabled: !dayAvailable || isPast || isBooked,
        isBooked,
      };
    });
  }, [effectiveDateKey, todayKey, availability, bookedTimestamps]);

  const monthLabel = useMemo(() => {
    const d = new Date(Date.UTC(monthCursor.year, monthCursor.month, 15));
    const text = new Intl.DateTimeFormat("es-CR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(d);
    return text.charAt(0).toUpperCase() + text.slice(1);
  }, [monthCursor]);

  const calendarDays = useMemo(() => {
    const first = new Date(Date.UTC(monthCursor.year, monthCursor.month, 1));
    const daysInMonth = new Date(
      Date.UTC(monthCursor.year, monthCursor.month + 1, 0),
    ).getUTCDate();
    const firstOffset = (first.getUTCDay() + 6) % 7;
    const cells: (string | null)[] = Array.from(
      { length: firstOffset },
      () => null,
    );
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(monthCursor.month + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      cells.push(`${monthCursor.year}-${mm}-${dd}`);
    }
    while (cells.length < 42) {
      cells.push(null);
    }
    return cells;
  }, [monthCursor]);

  const canGoPrevMonth = useMemo(() => {
    const [ty, tm] = todayKey.split("-").map(Number);
    return (
      monthCursor.year > ty ||
      (monthCursor.year === ty && monthCursor.month > tm - 1)
    );
  }, [monthCursor, todayKey]);

  const shiftMonth = (delta: number) => {
    if (delta < 0 && !canGoPrevMonth) return;
    setMonthDirection(delta);
    setMonthCursor((prev) => {
      const d = new Date(Date.UTC(prev.year, prev.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  };

  const handleSelectDay = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    if (value) {
      const prevDate = new Date(value);
      if (!Number.isNaN(prevDate.getTime())) {
        const crHour = new Intl.DateTimeFormat("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
          timeZone: "America/Costa_Rica",
        }).format(prevDate);
        if (availability.hours.includes(crHour)) {
          const candidateIso = buildSlotIso(dateKey, crHour);
          const candidateMs = new Date(candidateIso).getTime();
          const isBooked = bookedTimestamps.some(
            (b) => Math.abs(b - candidateMs) < 25 * 60 * 1000,
          );
          if (candidateMs > Date.now() + 30 * 60 * 1000 && !isBooked) {
            onChange(candidateIso);
            return;
          }
        }
      }
      onChange("");
    }
  };

  const monthKey = `${monthCursor.year}-${monthCursor.month}`;

  return (
    <div
      data-access-field
      tabIndex={-1}
      className="grid w-full grid-cols-1 gap-4 outline-none md:grid-cols-[292px_1fr] md:items-start md:gap-5"
    >
      {/* Minimalist Full-Month Square Grid Calendar (compact, zero scroll) */}
      <div className="card p-3">
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="text-[12.5px] font-semibold tracking-tight text-grayscale-12">
            {monthLabel}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={!canGoPrevMonth}
              onClick={() => shiftMonth(-1)}
              aria-label="Mes anterior"
              className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-grayscale-4 bg-grayscale-1 text-[11px] text-grayscale-11 transition-[background-color,transform] duration-150 hover:bg-grayscale-2 active:scale-[0.94] disabled:cursor-not-allowed disabled:opacity-35 dark:bg-[#1b1b1a]"
            >
              ←
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              aria-label="Mes siguiente"
              className="flex size-7 cursor-pointer items-center justify-center rounded-md border border-grayscale-4 bg-grayscale-1 text-[11px] text-grayscale-11 transition-[background-color,transform] duration-150 hover:bg-grayscale-2 active:scale-[0.94] dark:bg-[#1b1b1a]"
            >
              →
            </button>
          </div>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1 text-center font-mono text-[9.5px] font-medium uppercase tracking-wider text-grayscale-8">
          <span>L</span>
          <span>M</span>
          <span>X</span>
          <span>J</span>
          <span>V</span>
          <span>S</span>
          <span>D</span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={monthKey}
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: monthDirection * 8 }
            }
            animate={{ opacity: 1, x: 0 }}
            exit={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, x: monthDirection * -8 }
            }
            transition={{ duration: reduceMotion ? 0 : 0.16, ease: EASE }}
            className="grid grid-cols-7 gap-1"
          >
            {calendarDays.map((dateKey, idx) => {
              if (!dateKey) {
                return <div key={`empty-${idx}`} className="h-8 sm:h-8.5" />;
              }
              const available = isDateAvailableForMeeting(
                dateKey,
                todayKey,
                availability,
              );
              const isSelected = dateKey === effectiveDateKey;
              const isToday = dateKey === todayKey;
              const dayNumber = Number(dateKey.slice(-2));

              return (
                <button
                  key={dateKey}
                  type="button"
                  disabled={!available}
                  onClick={() => handleSelectDay(dateKey)}
                  aria-pressed={isSelected}
                  className={`relative flex h-8 sm:h-8.5 items-center justify-center rounded-md border font-mono text-[11.5px] tabular-nums transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] ${
                    !available
                      ? "cursor-not-allowed border-transparent text-grayscale-6/70 dark:text-grayscale-7"
                      : isSelected
                        ? "cursor-pointer border-grayscale-12 bg-grayscale-12 font-semibold text-grayscale-1 shadow-xs active:scale-[0.94]"
                        : "cursor-pointer border-grayscale-4/80 bg-grayscale-1 text-grayscale-11 hover:border-grayscale-7 hover:text-grayscale-12 active:scale-[0.94] dark:border-white/[0.08] dark:bg-[#161615] dark:hover:border-white/[0.2]"
                  }`}
                >
                  <span>{dayNumber}</span>
                  {isToday ? (
                    <span
                      aria-hidden="true"
                      className={`absolute bottom-1 h-0.5 w-0.5 rounded-full ${
                        isSelected ? "bg-grayscale-1" : "bg-grayscale-9"
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Time Slots */}
      <div className="flex flex-col">
        <div className="mb-2 flex items-center justify-between text-[11px] font-mono uppercase tracking-[0.1em] text-grayscale-9">
          <span>Hora</span>
          <div className="flex items-center gap-1 text-[10px]">
            <button
              type="button"
              onClick={() => setUse24h(false)}
              className={`cursor-pointer px-1 py-0.5 transition-colors ${
                !use24h
                  ? "text-grayscale-12 font-semibold"
                  : "text-grayscale-8 hover:text-grayscale-11"
              }`}
            >
              12H
            </button>
            <span className="text-grayscale-6">/</span>
            <button
              type="button"
              onClick={() => setUse24h(true)}
              className={`cursor-pointer px-1 py-0.5 transition-colors ${
                use24h
                  ? "text-grayscale-12 font-semibold"
                  : "text-grayscale-8 hover:text-grayscale-11"
              }`}
            >
              24H
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-2">
          {slotsForSelectedDay.map((slot) => {
            const isSelected = value === slot.iso;
            const label = formatHourLabel(slot.hour24, use24h);
            return (
              <button
                key={slot.hour24}
                type="button"
                disabled={slot.disabled}
                onClick={() => onChange(slot.iso)}
                aria-pressed={isSelected}
                className={`h-9 rounded-md px-2 text-center font-mono text-xs tabular-nums transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.2,0,0,1)] active:scale-[0.96] ${
                  slot.disabled
                    ? "cursor-not-allowed border border-transparent text-grayscale-7 line-through bg-transparent"
                    : isSelected
                      ? "border border-grayscale-12 bg-grayscale-12 text-grayscale-1 font-semibold shadow-xs cursor-pointer"
                      : "border border-grayscale-4 bg-grayscale-1 dark:bg-[#1b1b1a] text-grayscale-11 hover:border-grayscale-6 hover:text-grayscale-12 cursor-pointer"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ProvinceSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup
      aria-label="Provincia"
      value={value || null}
      onValueChange={(next) => next && onChange(next)}
      className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {PROVINCES.map((province) => (
        <div key={province} className="min-w-0">
          <Radio.Root
            value={province}
            data-access-field
            className="relative flex min-h-11 w-full cursor-pointer items-center rounded-lg border border-grayscale-4 bg-grayscale-1 px-4 text-left text-[15px] font-medium text-grayscale-10 outline-none transition-[background-color,border-color,color,transform] duration-150 hover:border-grayscale-6 hover:text-grayscale-12 active:scale-[0.98] data-checked:border-grayscale-12 data-checked:bg-grayscale-12 data-checked:text-grayscale-1 dark:bg-[#1b1b1a] dark:data-checked:bg-grayscale-12 dark:data-checked:text-grayscale-1 sm:min-h-12 sm:text-[16px]"
          >
            {province}
          </Radio.Root>
        </div>
      ))}
    </RadioGroup>
  );
}

const COUNTRIES = [
  { value: "CR" as const, name: "Costa Rica", Flag: CR, disabled: false },
  { value: "US" as const, name: "Estados Unidos", Flag: US, disabled: true },
] as const;

function CountrySelect({
  value,
  onChange,
  onUnavailable,
}: {
  value: Country;
  onChange: (value: Country) => void;
  onUnavailable: () => void;
}) {
  return (
    <RadioGroup
      aria-label="País"
      value={value}
      onValueChange={(next) => next && onChange(next as Country)}
      className="flex w-full flex-col gap-2.5"
    >
      {COUNTRIES.map((country) => {
        const Flag = country.Flag;
        const rowClass =
          "relative flex h-14 w-full items-center gap-3 rounded-lg border px-4 text-left outline-none transition-[border-color,background-color,color,transform] duration-150";

        if (country.disabled) {
          return (
            <button
              key={country.value}
              type="button"
              onClick={onUnavailable}
              className={`${rowClass} cursor-pointer border-grayscale-3/80 bg-grayscale-2/50 text-grayscale-8 dark:border-white/[0.06] dark:bg-[#141413]`}
            >
              <Flag
                title={country.name}
                className="h-3.5 w-5 shrink-0 rounded-[2px] opacity-45 sm:h-4 sm:w-6"
              />
              <span className="min-w-0 flex-1 text-[17px] font-medium tracking-[-0.02em] sm:text-[19px]">
                {country.name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-grayscale-8">
                Pronto
              </span>
            </button>
          );
        }

        return (
          <Radio.Root
            key={country.value}
            value={country.value}
            data-access-field
            className={`${rowClass} cursor-pointer border-grayscale-4 bg-grayscale-1 text-grayscale-12 shadow-2xs hover:border-grayscale-6 data-checked:border-grayscale-12 data-checked:bg-grayscale-2/70 dark:bg-[#1b1b1a] dark:data-checked:bg-[#232321]`}
          >
            <Flag
              title={country.name}
              className="h-3.5 w-5 shrink-0 rounded-[2px] sm:h-4 sm:w-6"
            />
            <span className="min-w-0 flex-1 text-[17px] font-medium tracking-[-0.02em] sm:text-[19px]">
              {country.name}
            </span>
          </Radio.Root>
        );
      })}
    </RadioGroup>
  );
}

function InstagramInput({
  id,
  value,
  onChange,
  invalid = false,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <label
      htmlFor={id}
      className={`campo flex h-12 w-full items-center gap-1.5 px-3.5 shadow-[0_1px_2px_rgba(28,22,16,0.03)] sm:h-13 ${
        invalid ? "campo-invalido shake" : ""
      }`}
    >
      <span className="select-none font-mono text-[16px] text-grayscale-8 sm:text-[18px]">
        @
      </span>
      <input
        id={id}
        type="text"
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        onChange={(event) =>
          onChange(event.target.value.replace(/^@+/, "").replace(/\s/g, ""))
        }
        placeholder="tuusuario"
        name="dj-instagram"
        autoComplete="off"
        data-access-input
        data-1p-ignore
        data-lpignore="true"
        aria-label="Instagram"
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="h-full min-w-0 flex-1 border-0 bg-transparent px-0 text-[16px] text-grayscale-12 outline-none placeholder:text-grayscale-8 sm:text-[17px]"
      />
    </label>
  );
}

function LineInput({
  id,
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  autoComplete,
  ariaLabel,
  invalid = false,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  inputMode?: "text" | "tel" | "email";
  autoComplete?: string;
  ariaLabel?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <input
      id={id}
      type={type}
      inputMode={inputMode}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      data-access-input
      aria-label={ariaLabel ?? placeholder}
      aria-invalid={invalid}
      aria-describedby={describedBy}
      className={`campo h-12 w-full px-3.5 text-[16px] shadow-[0_1px_2px_rgba(28,22,16,0.03)] sm:h-13 sm:text-[17px] ${
        invalid ? "campo-invalido shake" : ""
      }`}
    />
  );
}
