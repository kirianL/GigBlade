import { z } from "zod";

import { validationError } from "@/domain/errors";

export const waitlistRequestSchema = z
  .object({
    artistName: z.string().optional(),
    email: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    instagram: z.string().optional(),
    phone: z.string().optional(),
    note: z.string().optional(),
    website: z.string().optional(),
    referralCode: z.string().optional(),
    packageId: z.string().optional(),
    meetingAt: z.string().optional(),
    turnstileToken: z.string().optional(),
    formStartedAt: z.number().optional(),
  })
  .strict();

export type WaitlistStatus = "pending" | "contacted" | "onboarded" | "declined";

export type WaitlistDraft = {
  artistName: string;
  email: string;
  country: "CR" | "US";
  city: string | null;
  instagram: string | null;
  phone: string | null;
  note: string | null;
  meetingAt?: string | null;
  referralCode?: string | null;
  packageId?: string | null;
  turnstileToken?: string | null;
};

export type WaitlistSignup = WaitlistDraft & {
  id: string;
  status: WaitlistStatus;
  createdAt: string;
};

export type WaitlistJoinResult = {
  alreadyJoined: boolean;
  meetingAt?: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INSTAGRAM_PATTERN = /^[a-z0-9._]{1,30}$/;

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown, max: number, field: string): string | null {
  const text = asTrimmedString(value);
  if (!text) return null;
  if (text.length > max) {
    throw validationError(`${field} es demasiado largo`);
  }
  return text;
}

export function normalizeInstagram(value: unknown): string | null {
  let handle = asTrimmedString(value);
  if (!handle) return null;

  handle = handle.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  handle = handle.replace(/^@/, "").replace(/\/.*$/, "").replace(/\?.*$/, "");
  handle = handle.toLowerCase();

  if (!INSTAGRAM_PATTERN.test(handle)) {
    throw validationError("El Instagram no es válido");
  }

  return handle;
}

function normalizePhone(value: unknown): string | null {
  const phone = asTrimmedString(value).replace(/\s+/g, " ");
  if (!phone) return null;
  if (phone.length > 30 || !/^\+?[\d\s().-]+$/.test(phone)) {
    throw validationError("El número no es válido");
  }
  const digits = phone.replace(/\D/g, "").length;
  if (digits < 7 || digits > 15) {
    throw validationError("El número no es válido");
  }
  return phone;
}

const MEETING_NOTE_PREFIX_RE = /^\[MEETING:([^\]]+)\]\s*/;

export function normalizeMeetingAt(value: unknown): string | null {
  const raw = asTrimmedString(value);
  if (!raw) return null;
  if (raw.length > 64) {
    throw validationError("La fecha de reunión no es válida");
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    throw validationError("La fecha y hora de la reunión no son válidas");
  }

  const now = Date.now();
  const minAllowed = now - 24 * 60 * 60 * 1000;
  const maxAllowed = now + 120 * 24 * 60 * 60 * 1000;

  if (parsed.getTime() < minAllowed) {
    throw validationError("Elegí una fecha y hora futura para la reunión");
  }
  if (parsed.getTime() > maxAllowed) {
    throw validationError("La reunión debe agendarse dentro de los próximos 4 meses");
  }

  return parsed.toISOString();
}

export function encodeMeetingInNote(
  note: string | null | undefined,
  meetingAt: string | null | undefined,
): string | null {
  const cleanNote = note?.replace(MEETING_NOTE_PREFIX_RE, "").trim() ?? "";
  if (!meetingAt) {
    return cleanNote || null;
  }
  const prefix = `[MEETING:${meetingAt}]`;
  if (!cleanNote) return prefix;
  return `${prefix} ${cleanNote}`.slice(0, 280);
}

export function decodeMeetingFromNote(
  note: string | null | undefined,
  explicitMeetingAt?: string | null,
): { meetingAt: string | null; note: string | null } {
  const rawNote = note ?? "";
  const match = rawNote.match(MEETING_NOTE_PREFIX_RE);
  const embeddedMeetingAt = match?.[1]?.trim() || null;
  const cleanedNote = rawNote.replace(MEETING_NOTE_PREFIX_RE, "").trim() || null;
  return {
    meetingAt: explicitMeetingAt || embeddedMeetingAt || null,
    note: cleanedNote,
  };
}

export function normalizeWaitlistDraft(input: {
  artistName?: unknown;
  email?: unknown;
  country?: unknown;
  city?: unknown;
  instagram?: unknown;
  phone?: unknown;
  note?: unknown;
  website?: unknown;
  referralCode?: unknown;
  packageId?: unknown;
  meetingAt?: unknown;
  turnstileToken?: unknown;
  formStartedAt?: unknown;
}): WaitlistDraft | { discarded: true } {
  if (asTrimmedString(input.website)) {
    return { discarded: true };
  }

  if (
    typeof input.formStartedAt === "number" &&
    Number.isFinite(input.formStartedAt) &&
    input.formStartedAt > 0
  ) {
    const elapsedMs = Date.now() - input.formStartedAt;
    // Automated bots submitting faster than 800ms are silently discarded like honeypot
    if (elapsedMs >= 0 && elapsedMs < 800) {
      return { discarded: true };
    }
  }

  const artistName = asTrimmedString(input.artistName);
  const email = asTrimmedString(input.email).toLowerCase();
  const country = asTrimmedString(input.country) || "CR";

  if (artistName.length < 2 || artistName.length > 80) {
    throw validationError("El nombre artístico debe tener entre 2 y 80 caracteres");
  }

  if (!EMAIL_PATTERN.test(email) || email.length > 254) {
    throw validationError("El correo no es válido");
  }

  if (country !== "CR") {
    throw validationError("Este país estará disponible pronto");
  }

  const referralCode = optionalText(input.referralCode, 30, "El código de referido");
  const packageId = optionalText(input.packageId, 40, "El paquete") || "all_inclusive";
  const meetingAt = normalizeMeetingAt(input.meetingAt);
  const turnstileToken = optionalText(input.turnstileToken, 4096, "El token de seguridad");

  return {
    artistName,
    email,
    country,
    city: optionalText(input.city, 80, "La ciudad"),
    instagram: normalizeInstagram(input.instagram),
    phone: normalizePhone(input.phone),
    note: optionalText(input.note, 280, "La nota"),
    meetingAt,
    referralCode: referralCode ? referralCode.toUpperCase() : null,
    packageId,
    turnstileToken,
  };
}

export function whatsappUrl(
  phone: string,
  country: WaitlistDraft["country"],
): string | null {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (country === "CR" && digits.length === 8) {
    digits = `506${digits}`;
  }
  return `https://wa.me/${digits}`;
}

export function phoneWhatsappUrl(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 8) return whatsappUrl(phone, "CR");
  if (!digits) return null;
  return `https://wa.me/${digits}`;
}

export function whatsappUrlWithText(
  phone: string,
  text: string,
): string | null {
  const base = phoneWhatsappUrl(phone);
  if (!base) return null;
  const message = text.trim();
  if (!message) return base;
  return `${base}?text=${encodeURIComponent(message)}`;
}

export function isWaitlistDraft(
  value: WaitlistDraft | { discarded: true },
): value is WaitlistDraft {
  return !("discarded" in value);
}
